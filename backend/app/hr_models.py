"""Fréquence cardiaque : XGBoost, LSTM et Prophet sur la série de démonstration.

Les trois modèles tournent vraiment (pas une étiquette) :

- XGBoost — boosting de second ordre (Chen et Guestrin) : arbres de profondeur 2,
  objectif carré (gradient = résidu, hessienne = 1).
- LSTM — cellule de Hochreiter et Schmidhuber, une couche, entraînée par BPTT.
- Prophet — modèle additif de Taylor et Letham : tendance linéaire + saisonnalité
  de Fourier, ajusté par moindres carrés.

La série vient du générateur de démo (mêmes battements que la télémétrie).
Aide à la décision, pas un diagnostic.
"""
from __future__ import annotations

import math
import time
from datetime import datetime, timedelta, timezone

from app.demo import CREW

H = 4
LAGS = (1, 2, 3, 6, 12)
LAM = 1.0
XGB_ROUNDS = 8
XGB_LR = 0.35
LSTM_EPOCHS = 24
LSTM_LR = 0.06
Z80 = 1.28155
_FIT: dict[tuple, tuple[float, dict]] = {}


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _clip(v: float) -> float:
    return max(40.0, min(160.0, v))


def _r(v: float) -> float:
    return round(_clip(v), 1)


def displayed_hr(astronaut_id: str, sec: int) -> float:
    """Même formule que la télémétrie temps réel (`_sample`)."""
    return float(round(CREW[astronaut_id]["hr"] + 3 * math.sin(sec / 9)))


def _sigmoid(x: float) -> float:
    if x > 15:
        return 1.0
    if x < -15:
        return 0.0
    return 1.0 / (1.0 + math.exp(-x))


def _tanh(x: float) -> float:
    if x > 8:
        return 1.0
    if x < -8:
        return -1.0
    e2 = math.exp(2 * x)
    return (e2 - 1.0) / (e2 + 1.0)


def _solve(a: list[list[float]], b: list[float]) -> list[float]:
    n = len(b)
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for col in range(n):
        pivot = max(range(col, n), key=lambda r: abs(m[r][col]))
        m[col], m[pivot] = m[pivot], m[col]
        div = m[col][col] or 1e-8
        for j in range(col, n + 1):
            m[col][j] /= div
        for r in range(n):
            if r == col:
                continue
            factor = m[r][col]
            for j in range(col, n + 1):
                m[r][j] -= factor * m[col][j]
    return [m[i][n] for i in range(n)]


def _lstsq(x: list[list[float]], y: list[float]) -> list[float]:
    p = len(x[0])
    xtx = [[0.0] * p for _ in range(p)]
    xty = [0.0] * p
    for i, row in enumerate(x):
        for a in range(p):
            xty[a] += row[a] * y[i]
            for b in range(p):
                xtx[a][b] += row[a] * row[b]
    for a in range(p):
        xtx[a][a] += 1e-2
    return _solve(xtx, xty)


def _dot(row: list[float], beta: list[float]) -> float:
    return sum(a * b for a, b in zip(row, beta))


def _std(xs: list[float]) -> float:
    m = sum(xs) / len(xs)
    var = sum((v - m) ** 2 for v in xs) / max(1, len(xs) - 1)
    return math.sqrt(var) or 0.6


class _Leaf:
    def __init__(self, w: float) -> None:
        self.w = w

    def pred(self, _x: list[float]) -> float:
        return self.w


class _Split:
    def __init__(self, feat: int, thr: float, left, right) -> None:
        self.feat = feat
        self.thr = thr
        self.left = left
        self.right = right

    def pred(self, x: list[float]) -> float:
        return self.left.pred(x) if x[self.feat] <= self.thr else self.right.pred(x)


def _features(values: list[float], index0: int, idx: int, period: float) -> list[float]:
    def lag(k: int) -> float:
        j = idx - k - index0
        if j < 0 or j >= len(values):
            return values[0]
        return values[j]

    ang = 2 * math.pi * idx / period
    return [lag(k) for k in LAGS] + [math.sin(ang), math.cos(ang)]


def _build_tree(x: list[list[float]], g: list[float], idxs: list[int], depth: int):
    total_g = sum(g[i] for i in idxs)
    if depth == 0 or len(idxs) < 6:
        return _Leaf(-total_g / (len(idxs) + LAM))
    best = None
    nfeat = len(x[0])
    for feat in range(nfeat):
        order = sorted(idxs, key=lambda i: x[i][feat])
        gl = 0.0
        seen = 0
        for s in range(1, len(order)):
            gl += g[order[s - 1]]
            seen += 1
            if x[order[s]][feat] == x[order[s - 1]][feat]:
                continue
            if seen < 2 or len(order) - seen < 2:
                continue
            gr = total_g - gl
            hr = len(order) - seen
            gain = 0.5 * (
                (gl * gl) / (seen + LAM) + (gr * gr) / (hr + LAM) - (total_g * total_g) / (len(order) + LAM)
            )
            if best is None or gain > best[0]:
                thr = 0.5 * (x[order[s - 1]][feat] + x[order[s]][feat])
                best = (gain, feat, thr, order[:s], order[s:])
    if best is None or best[0] <= 0:
        return _Leaf(-total_g / (len(idxs) + LAM))
    _, feat, thr, left, right = best
    return _Split(feat, thr, _build_tree(x, g, left, depth - 1), _build_tree(x, g, right, depth - 1))


def _lin(values: list[float]) -> tuple[float, float]:
    """Pente et ordonnée : les arbres ne prolongent pas une tendance tout seuls."""
    n = len(values)
    t_mean = (n - 1) / 2
    y_mean = sum(values) / n
    var_t = sum((i - t_mean) ** 2 for i in range(n)) or 1.0
    cov = sum((i - t_mean) * (values[i] - y_mean) for i in range(n))
    slope = cov / var_t
    return slope, y_mean - slope * t_mean


def _fit_xgb(values: list[float], index0: int, period: float) -> dict:
    slope, intercept = _lin(values)
    resid = [values[i] - (intercept + slope * i) for i in range(len(values))]
    start = min(12, max(2, len(resid) // 3))
    rows = []
    y = []
    for local in range(start, len(resid)):
        rows.append(_features(resid, index0, index0 + local, period))
        y.append(resid[local])
    if len(y) < 4:
        return {"init": 0.0, "trees": [], "index0": index0, "period": period, "slope": slope, "intercept": intercept}
    init = sum(y) / len(y)
    pred = [init] * len(y)
    trees = []
    for _ in range(XGB_ROUNDS):
        g = [pred[i] - y[i] for i in range(len(y))]
        trees.append(_build_tree(rows, g, list(range(len(y))), 2))
        pred = [pred[i] + XGB_LR * trees[-1].pred(rows[i]) for i in range(len(y))]
    return {"init": init, "trees": trees, "index0": index0, "period": period, "slope": slope, "intercept": intercept}


def _xgb_resid(model: dict, resid: list[float], idx: int) -> float:
    if not model["trees"]:
        return 0.0
    x = _features(resid, model["index0"], idx, model["period"])
    return model["init"] + XGB_LR * sum(tree.pred(x) for tree in model["trees"])


def _xgb_ahead(model: dict, values: list[float], steps: int) -> list[float]:
    slope, intercept = model["slope"], model["intercept"]
    resid = [values[i] - (intercept + slope * i) for i in range(len(values))]
    out = []
    local = len(values)
    idx = model["index0"] + local
    for _ in range(steps):
        r = _xgb_resid(model, resid, idx)
        resid.append(r)
        out.append(_clip(intercept + slope * local + r))
        local += 1
        idx += 1
    return out


def _rng(seed: int):
    state = seed % 2_147_483_647 or 1

    def nxt() -> float:
        nonlocal state
        state = (1103515245 * state + 12345) % 2_147_483_647
        return (state / 2_147_483_647) * 0.2 - 0.1

    return nxt


def _zeros(n: int) -> list[float]:
    return [0.0] * n


def _phase(idx: float, period: float) -> tuple[float, float]:
    ang = 2 * math.pi * idx / period
    return math.sin(ang), math.cos(ang)


def _new_lstm(seed: int) -> dict:
    rnd = _rng(seed)
    z = 3 + H

    def mat() -> list[list[float]]:
        return [[rnd() for _ in range(z)] for _ in range(H)]

    return {
        "Wf": mat(), "Wi": mat(), "Wo": mat(), "Wc": mat(),
        "bf": [1.0] + _zeros(H - 1), "bi": _zeros(H), "bo": _zeros(H), "bc": _zeros(H),
        "Wy": [rnd() for _ in range(H)], "by": 0.0,
    }


def _scale(v: float) -> float:
    return (v - 70.0) / 25.0


def _unscale(z: float) -> float:
    return _clip(z * 25.0 + 70.0)


def _gate(w: list[list[float]], b: list[float], z: list[float], fn) -> list[float]:
    return [fn(sum(w[r][c] * z[c] for c in range(len(z))) + b[r]) for r in range(H)]


def _forward(model: dict, x: float, seasonal: float, sn: float, cs: float, h: list[float], c: list[float]):
    """y = saisonnalité (valeur à t − période) + correction de la cellule LSTM."""
    z = [x, sn, cs] + h
    f = _gate(model["Wf"], model["bf"], z, _sigmoid)
    i = _gate(model["Wi"], model["bi"], z, _sigmoid)
    o = _gate(model["Wo"], model["bo"], z, _sigmoid)
    g = _gate(model["Wc"], model["bc"], z, _tanh)
    c2 = [f[k] * c[k] + i[k] * g[k] for k in range(H)]
    th = [_tanh(c2[k]) for k in range(H)]
    h2 = [o[k] * th[k] for k in range(H)]
    raw = model["by"] + sum(model["Wy"][k] * h2[k] for k in range(H))
    raw = max(-0.9, min(0.9, raw))
    y = seasonal + raw
    return y, h2, c2, {"z": z, "f": f, "i": i, "o": o, "g": g, "c": c2, "th": th, "h": h2, "c_prev": c}


def _fit_lstm(values: list[float], index0: int, period: float, seed: int) -> dict:
    model = _new_lstm(seed)
    series = [_scale(v) for v in values]
    if len(series) < 4:
        return model
    zdim = 3 + H
    for _epoch in range(LSTM_EPOCHS):
        h = _zeros(H)
        c = _zeros(H)
        steps = []
        lag = max(1, round(period))
        for t in range(len(series) - 1):
            sn, cs = _phase(index0 + t, period)
            seasonal = series[t + 1 - lag] if t + 1 >= lag else series[t]
            y, h, c, snap = _forward(model, series[t], seasonal, sn, cs, h, c)
            snap["y"] = y
            snap["target"] = series[t + 1]
            steps.append(snap)
        grads = {k: [[0.0] * zdim for _ in range(H)] for k in ("Wf", "Wi", "Wo", "Wc")}
        grads.update({k: _zeros(H) for k in ("bf", "bi", "bo", "bc")})
        dwy = _zeros(H)
        dby = 0.0
        dh_next = _zeros(H)
        dc_next = _zeros(H)
        for snap in reversed(steps):
            dy = snap["y"] - snap["target"]
            for k in range(H):
                dwy[k] += dy * snap["h"][k]
            dby += dy
            dh = [dy * model["Wy"][k] + dh_next[k] for k in range(H)]
            do_act = [dh[k] * snap["th"][k] for k in range(H)]
            dth = [dh[k] * snap["o"][k] for k in range(H)]
            dc = [dth[k] * (1 - snap["th"][k] ** 2) + dc_next[k] for k in range(H)]
            df_act = [dc[k] * snap["c_prev"][k] for k in range(H)]
            di_act = [dc[k] * snap["g"][k] for k in range(H)]
            dg_act = [dc[k] * snap["i"][k] for k in range(H)]
            dc_next = [dc[k] * snap["f"][k] for k in range(H)]
            df = [df_act[k] * snap["f"][k] * (1 - snap["f"][k]) for k in range(H)]
            di = [di_act[k] * snap["i"][k] * (1 - snap["i"][k]) for k in range(H)]
            do = [do_act[k] * snap["o"][k] * (1 - snap["o"][k]) for k in range(H)]
            dg = [dg_act[k] * (1 - snap["g"][k] ** 2) for k in range(H)]
            dz = _zeros(zdim)
            for name, delta in (("Wf", df), ("Wi", di), ("Wo", do), ("Wc", dg)):
                bias = "b" + name[1]
                for r in range(H):
                    grads[bias][r] += delta[r]
                    for col in range(zdim):
                        grads[name][r][col] += delta[r] * snap["z"][col]
                        dz[col] += model[name][r][col] * delta[r]
            dh_next = dz[3:]
        for name in ("Wf", "Wi", "Wo", "Wc"):
            for r in range(H):
                for col in range(zdim):
                    g = max(-1.0, min(1.0, grads[name][r][col]))
                    model[name][r][col] -= LSTM_LR * g
        for name in ("bf", "bi", "bo", "bc"):
            for r in range(H):
                model[name][r] -= LSTM_LR * max(-1.0, min(1.0, grads[name][r]))
        for k in range(H):
            model["Wy"][k] -= LSTM_LR * max(-1.0, min(1.0, dwy[k]))
        model["by"] -= LSTM_LR * max(-1.0, min(1.0, dby))
    return model


def _lstm_loss(model: dict, values: list[float], index0: int, period: float) -> float:
    series = [_scale(v) for v in values]
    h, c = _zeros(H), _zeros(H)
    loss = 0.0
    n = 0
    lag = max(1, round(period))
    for t in range(len(series) - 1):
        sn, cs = _phase(index0 + t, period)
        seasonal = series[t + 1 - lag] if t + 1 >= lag else series[t]
        y, h, c, _snap = _forward(model, series[t], seasonal, sn, cs, h, c)
        loss += (y - series[t + 1]) ** 2
        n += 1
    return loss / max(1, n)


def _lstm_ahead(model: dict, values: list[float], index0: int, period: float, steps: int) -> list[float]:
    series = [_scale(v) for v in values]
    lag = max(1, round(period))
    h, c = _zeros(H), _zeros(H)
    for t in range(len(series) - 1):
        sn, cs = _phase(index0 + t, period)
        seasonal = series[t + 1 - lag] if t + 1 >= lag else series[t]
        _y, h, c, _snap = _forward(model, series[t], seasonal, sn, cs, h, c)
    extended = series[:]
    out = []
    for s in range(steps):
        t = len(series) - 1 + s
        sn, cs = _phase(index0 + t, period)
        seasonal = extended[t + 1 - lag] if t + 1 >= lag else extended[t]
        y, h, c, _snap = _forward(model, extended[t], seasonal, sn, cs, h, c)
        extended.append(y)
        out.append(_unscale(y))
    return out


def _prophet_row(t: float, t0: float, period: float, trend_scale: float) -> list[float]:
    row = [1.0, (t - t0) / trend_scale]
    for k in (1, 2, 3):
        ang = 2 * math.pi * k * t / period
        row.append(math.sin(ang))
        row.append(math.cos(ang))
    return row


def _fit_prophet(indices: list[float], values: list[float], period: float, trend_scale: float) -> dict:
    t0 = indices[0]
    x = [_prophet_row(t, t0, period, trend_scale) for t in indices]
    beta = _lstsq(x, values)
    resid = [values[i] - _dot(x[i], beta) for i in range(len(values))]
    return {"beta": beta, "sigma": _std(resid), "t0": t0, "period": period, "trend_scale": trend_scale}


def _prophet_at(model: dict, t: float) -> tuple[float, float, float]:
    y = _dot(_prophet_row(t, model["t0"], model["period"], model["trend_scale"]), model["beta"])
    y = _clip(y)
    band = Z80 * model["sigma"]
    return y, _clip(y - band), _clip(y + band)


def _fit_models(values: list[float], index0: int, period: float, trend_scale: float, seed: int) -> dict:
    indices = [float(index0 + i) for i in range(len(values))]
    return {
        "xgb": _fit_xgb(values, index0, period),
        "lstm": _fit_lstm(values, index0, period, seed),
        "prophet": _fit_prophet(indices, values, period, trend_scale),
        "index0": index0,
        "period": period,
    }


def _cached(key: tuple, ttl: float, build):
    hit = _FIT.get(key)
    now = time.time()
    if hit and now - hit[0] < ttl:
        return hit[1]
    model = build()
    _FIT[key] = (now, model)
    return model


def _ahead(model: dict, values: list[float], steps: int) -> list[dict]:
    xgb = _xgb_ahead(model["xgb"], values, steps)
    lstm = _lstm_ahead(model["lstm"], values, model["index0"], model["period"], steps)
    index0 = model["index0"]
    out = []
    for s in range(steps):
        t = float(index0 + len(values) + s)
        py, lo, hi = _prophet_at(model["prophet"], t)
        trio = sorted((_clip(xgb[s]), _clip(lstm[s]), py))
        mid = trio[1]
        out.append({
            "predicted": _r(mid),
            "lower": _r(min(trio[0], lo)),
            "upper": _r(max(trio[2], hi)),
            "xgboost": _r(xgb[s]),
            "lstm": _r(lstm[s]),
            "prophet": _r(py),
        })
    return out


def _hourly_value(astronaut_id: str, now: datetime, i: int) -> float:
    stamp = now + timedelta(hours=i)
    circ = 3.2 * math.sin((stamp.hour - 4) / 24 * 2 * math.pi)
    slope = 0.45 if astronaut_id == "LK" else 0.02
    return CREW[astronaut_id]["hr"] + slope * i + circ


def _daily_value(astronaut_id: str, i: int) -> float:
    slope = {"LK": 1.6, "AM": 0.2, "NO": 0.05, "SR": 0.1}[astronaut_id]
    return CREW[astronaut_id]["hr"] + slope * i + 1.1 * math.sin(2 * math.pi * i / 7)


def live_forecast(astronaut_id: str, end_ts: float) -> dict:
    if astronaut_id not in CREW:
        raise KeyError(astronaut_id)
    end = int(end_ts // 2) * 2
    step = 2
    n_hist, n_fut = 60, 45
    secs = [end - (n_hist - 1 - i) * step for i in range(n_hist)]
    values = [displayed_hr(astronaut_id, sec) for sec in secs]
    index0 = secs[0] // step
    period = (2 * math.pi * 9) / step
    seed = sum(ord(c) for c in astronaut_id) * 97 + 11
    model = _cached(
        (astronaut_id, "live", end // 20),
        20,
        lambda: _fit_models(values, index0, period, 1800.0, seed),
    )
    future = _ahead(model, values, n_fut)
    points = []
    for sec, value in zip(secs, values):
        points.append({"timestamp": _iso(datetime.fromtimestamp(sec, timezone.utc)), "heart_rate": value})
    points[-1].update({k: points[-1]["heart_rate"] for k in ("xgboost", "lstm", "prophet")})
    for s, row in enumerate(future, start=1):
        stamp = datetime.fromtimestamp(end + s * step, timezone.utc)
        points.append({"timestamp": _iso(stamp), **row})
    return {
        "astronaut_id": astronaut_id,
        "generated_at": _iso(datetime.fromtimestamp(end, timezone.utc)),
        "step_sec": step,
        "models": ["xgboost", "lstm", "prophet"],
        "note": "Aide à la décision, pas un diagnostic. Série de démonstration.",
        "points": points,
    }


def _level_trend(values: list[float], direction: str, orange: float, rouge: float, step_hours: float):
    def crosses(v: float, thr: float) -> bool:
        return v >= thr if direction == "above" else v <= thr

    level = "vert"
    tth = None
    tl = None
    for i, v in enumerate(values):
        if crosses(v, rouge):
            level = "rouge"
            if tth is None and i > 0 and not crosses(values[0], rouge):
                tth = round(i * step_hours, 1)
                tl = "rouge"
            break
        if crosses(v, orange):
            level = "orange"
            if tth is None and i > 0 and not crosses(values[0], orange):
                tth = round(i * step_hours, 1)
                tl = "orange"
    if level == "rouge" and tth is None and tl is None and crosses(values[0], orange) and not crosses(values[0], rouge):
        for i, v in enumerate(values):
            if crosses(v, rouge) and i > 0:
                tth = round(i * step_hours, 1)
                tl = "rouge"
                break
    first, last = values[0], values[-1]
    tol = 1.5 if step_hours <= 1 else 1.0
    if abs(last - first) < tol:
        trend = "stable"
    elif last > first:
        trend = "hausse"
    else:
        trend = "baisse"
    return level, trend, tth, tl


def heart_metric_forecast(astronaut_id: str, horizon: str, now: datetime) -> dict:
    daily = horizon == "7d"
    past, fut = (7, 7) if daily else (24, 24)
    step_hours = 24.0 if daily else 1.0
    if daily:
        values = [_daily_value(astronaut_id, i) for i in range(-past, 1)]
        index0 = int(now.timestamp() // 86400) - past
        period, trend_scale, res = 7.0, 1.0, "day"
    else:
        values = [_hourly_value(astronaut_id, now, i) for i in range(-past, 1)]
        index0 = int(now.timestamp() // 3600) - past
        period, trend_scale, res = 24.0, 1.0, "hour"
    seed = sum(ord(c) for c in astronaut_id) * 13 + (7 if daily else 3)
    bucket = now.strftime("%Y-%m-%d") if daily else now.strftime("%Y-%m-%dT%H")
    model = _cached(
        (astronaut_id, horizon, bucket),
        3600,
        lambda: _fit_models(values, index0, period, trend_scale, seed),
    )
    future = _ahead(model, values, fut)
    orange, rouge = 100, 120
    preds = [values[-1]] + [row["predicted"] for row in future]
    level, trend, tth, tl = _level_trend(preds, "above", orange, rouge, step_hours)
    points = []
    for i in range(-past, 1):
        stamp = now + (timedelta(days=i) if daily else timedelta(hours=i))
        points.append({"timestamp": _iso(stamp), "observed": round(values[i + past], 1)})
    points[-1].update({
        "predicted": round(values[-1], 1),
        "lower": round(values[-1] - 0.6, 1),
        "upper": round(values[-1] + 0.6, 1),
        "xgboost": round(values[-1], 1),
        "lstm": round(values[-1], 1),
        "prophet": round(values[-1], 1),
    })
    for s, row in enumerate(future, start=1):
        stamp = now + (timedelta(days=s) if daily else timedelta(hours=s))
        points.append({"timestamp": _iso(stamp), **row})
    last = future[-1]["predicted"]
    now_v = round(values[-1], 1)
    when = "7 prochains jours" if daily else "24 prochaines heures"
    delay = ""
    if tth is not None and tl:
        unit = "j" if tth >= 48 else "h"
        shown = max(1, round(tth / 24)) if tth >= 48 else max(1, round(tth))
        delay = f" Seuil {tl} ({orange if tl == 'orange' else rouge} bpm) probable dans environ {shown} {unit}."
    summary = (
        f"FC de repos : {now_v} bpm maintenant, médiane XGBoost, LSTM et Prophet {trend} "
        f"sur les {when} ({last} bpm).{delay} Aide à la décision, pas un diagnostic. Série de démonstration."
    )
    return {
        "metric": "heart_rate",
        "label": "FC de repos",
        "unit": "bpm",
        "resolution": res,
        "points": points,
        "thresholds": {"orange": orange, "rouge": rouge, "direction": "above"},
        "level": level,
        "trend": trend,
        "time_to_threshold_hours": tth,
        "threshold_level": tl,
        "summary": summary,
    }
