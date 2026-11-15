"""Prévisions SIMULÉES. Aucun Isolation Forest ni LSTM ne tourne ici."""
from datetime import datetime, timedelta, timezone

from app.demo import CREW
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
    past, fut = (7, 7) if horizon == "7d" else (8, 8)
    forecasts = []
    anomalies = []
    for metric, label, unit, resolution, direction, thr_key in METRICS:
        res = "day" if metric == "sleep" or horizon == "7d" else resolution
        use_step = timedelta(days=1) if res == "day" else step
        if metric in FIXED:
            base = FIXED[metric][astronaut_id]
        else:
            base = crew[BASE[metric]]
        orange = _thr(thr_key, direction)["orange"]
        points = []
        for i in range(-past, fut + 1):
            stamp = _iso(now + use_step * i)
            drift = (0.4 if astronaut_id == "LK" and metric == "heart_rate" else 0.05) * i
            value = round(base + drift, 1)
            point = {"timestamp": stamp}
            if i <= 0:
                point["observed"] = value
            if i >= 0:
                point["predicted"] = value
                point["lower"] = round(value - 1.2, 1)
                point["upper"] = round(value + 1.2, 1)
            points.append(point)
        level = "orange" if astronaut_id == "LK" and metric in {"heart_rate", "sleep"} else "vert"
        forecasts.append({
            "metric": metric,
            "label": label,
            "unit": unit,
            "resolution": res,
            "points": points,
            "thresholds": _thr(thr_key, direction),
            "level": level,
            "trend": "hausse" if astronaut_id == "LK" and metric == "heart_rate" else "stable",
            "time_to_threshold_hours": 8 if astronaut_id == "LK" and metric == "heart_rate" else None,
            "threshold_level": "orange" if astronaut_id == "LK" and metric == "heart_rate" else None,
            "summary": f"SIMULÉ — {label} : {base} {unit}. Aucun modèle réel (Isolation Forest, LSTM) ne tourne. Seuil indicatif {orange}.",
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
    risk = "orange" if astronaut_id == "LK" else "vert"
    return {
        "astronaut_id": astronaut_id,
        "generated_at": _iso(now),
        "horizon": horizon,
        "model": "simulated-rules v0",
        "risk_level": risk,
        "drift_score": crew["drift"],
        "next_threshold": {"metric": "heart_rate", "label": "FC de repos", "level": "orange", "hours": 8} if astronaut_id == "LK" else None,
        "forecasts": forecasts,
        "anomalies": anomalies,
    }
