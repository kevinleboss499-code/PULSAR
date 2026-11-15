"""Prévisions. La FC est calculée par XGBoost, LSTM et Prophet.
Les autres indicateurs restent un scénario de démonstration (pas un diagnostic)."""
import math
from datetime import datetime, timedelta, timezone

from app.demo import CREW
from app.hr_models import heart_metric_forecast
from app.rules import THRESHOLDS

METRICS = [
    ("heart_rate", "FC de repos", "bpm", "hour", "above", "heart_rate"),
    ("spo2", "SpO₂", "%", "hour", "below", "spo2"),
    ("bp_systolic", "Tension systolique", "mmHg", "hour", "above", "bp_systolic"),
    ("skin_temp", "Température", "°C", "hour", "above", "temperature"),
    ("glucose", "Glycémie", "mg/dL", "hour", "above", "glucose_forecast"),
    ("sleep", "Sommeil", "h", "day", "below", "sleep"),
    ("radiation", "Débit de dose", "µSv/h", "hour", "above", "radiation_dose_rate"),
]
BASE = {
    "heart_rate": "hr",
    "spo2": "spo2",
    "bp_systolic": None,
    "skin_temp": None,
    "glucose": None,
    "sleep": None,
    "radiation": "dose",
}
FIXED = {"bp_systolic": {"LK": 128, "AM": 118, "NO": 116, "SR": 121}, "skin_temp": {"LK": 37.1, "AM": 36.7, "NO": 36.6, "SR": 36.8}, "glucose": {"LK": 98, "AM": 94, "NO": 90, "SR": 92}, "sleep": {"LK": 5.3, "AM": 7.6, "NO": 7.1, "SR": 6.8}}


def _thr(key: str, direction: str) -> dict:
    raw = THRESHOLDS[key]
    if "orange" in raw:
        return {"orange": raw["orange"], "rouge": raw["rouge"], "direction": direction}
    return {"orange": raw["orange_high"], "rouge": raw["rouge_high"], "direction": direction}


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def build_predictions(astronaut_id: str, horizon: str) -> dict:
    crew = CREW[astronaut_id]
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    step = timedelta(days=1) if horizon == "7d" else timedelta(hours=1)
    forecasts = [heart_metric_forecast(astronaut_id, horizon, now)]
    anomalies = []
    wave = {"spo2": 0.25, "bp_systolic": 2.4, "skin_temp": 0.12, "glucose": 4.0, "sleep": 0.0, "radiation": 1.4}
    for metric, label, unit, resolution, direction, thr_key in METRICS:
        if metric == "heart_rate":
            continue
        res = "day" if metric == "sleep" or horizon == "7d" else resolution
        use_step = timedelta(days=1) if res == "day" else step
        past, fut = (7, 7) if res == "day" else (24, 24)
        if metric == "sleep" and horizon != "7d":
            fut = 3
        if metric in FIXED:
            base = FIXED[metric][astronaut_id]
        else:
            base = crew[BASE[metric]]
        orange = _thr(thr_key, direction)["orange"]
        points = []
        for i in range(-past, fut + 1):
            stamp_dt = now + use_step * i
            stamp = _iso(stamp_dt)
            drift = (-0.08 if astronaut_id == "LK" and metric == "sleep" else 0.02) * i
            circ = wave.get(metric, 0) * math.sin((stamp_dt.hour - 4) / 24 * 2 * math.pi)
            value = round(base + drift + circ, 1)
            point = {"timestamp": stamp}
            if i <= 0:
                point["observed"] = value
            if i >= 0:
                band = round(0.8 + 0.12 * i, 1)
                point["predicted"] = value
                point["lower"] = round(value - band, 1)
                point["upper"] = round(value + band, 1)
            points.append(point)
        level = "orange" if astronaut_id == "LK" and metric == "sleep" else "vert"
        forecasts.append({
            "metric": metric,
            "label": label,
            "unit": unit,
            "resolution": res,
            "points": points,
            "thresholds": _thr(thr_key, direction),
            "level": level,
            "trend": "baisse" if astronaut_id == "LK" and metric == "sleep" else "stable",
            "time_to_threshold_hours": None,
            "threshold_level": None,
            "summary": f"{label} : {base} {unit}. Scénario de démonstration, seuil indicatif {orange}. Aide à la décision, pas un diagnostic.",
        })
    if astronaut_id == "LK":
        anomalies.append({
            "id": "AN-LK-01",
            "astronaut_id": "LK",
            "metric": "heart_rate",
            "label": "FC de repos en hausse sur 3 jours",
            "value": 94,
            "unit": "bpm",
            "level": "orange",
            "model": "lstm_autoencoder",
            "drift_score": 0.58,
            "detected_at": _iso(now),
            "contributors": [{"signal": "FC de repos", "weight": 0.46}, {"signal": "Durée de sommeil", "weight": 0.31}, {"signal": "VFC (RMSSD)", "weight": 0.23}],
            "explanation": "SIMULÉ — texte de démonstration, pas une sortie d'autoencodeur.",
            "plain_explanation": "SIMULÉ — votre pouls au repos monte depuis 3 jours et vos nuits sont plus courtes.",
        })
    heart = forecasts[0]
    rank = {"vert": 0, "orange": 1, "rouge": 2}
    risk = max((f["level"] for f in forecasts), key=lambda lv: rank[lv])
    nxt = None
    if heart.get("time_to_threshold_hours") is not None and heart.get("threshold_level"):
        nxt = {"metric": "heart_rate", "label": "FC de repos", "level": heart["threshold_level"], "hours": heart["time_to_threshold_hours"]}
    return {
        "astronaut_id": astronaut_id,
        "generated_at": _iso(now),
        "horizon": horizon,
        "model": "xgboost + lstm + prophet",
        "risk_level": risk,
        "drift_score": crew["drift"],
        "next_threshold": nxt,
        "forecasts": forecasts,
        "anomalies": anomalies,
    }
