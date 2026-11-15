"""Seuils indicatifs et rejet des valeurs impossibles. Pas un diagnostic."""
import json
from pathlib import Path

THRESHOLDS = json.loads((Path(__file__).parent / "thresholds.json").read_text(encoding="utf-8"))

# Au-delà : la valeur ne peut pas venir d'un capteur (ex. glycémie 920). Elle est refusée, pas alertée.
IMPOSSIBLE = {
    "heart_rate": (20, 250),
    "spo2": (50, 100),
    "sleep": (0, 24),
    "glucose": (20, 600),
    "temperature": (30, 45),
    "mood": (1, 5),
    "bp_systolic": (50, 280),
    "bp_diastolic": (30, 180),
}

WATCH_METRICS = frozenset({"heart_rate", "sleep", "spo2"})
KIT_METRICS = frozenset({"glucose", "temperature", "mood", "bp_systolic", "bp_diastolic"})


def reject_impossible(metric: str, value: float) -> str | None:
    bounds = IMPOSSIBLE.get(metric)
    if bounds is None:
        return f"Indicateur inconnu : {metric}"
    lo, hi = bounds
    if value < lo or value > hi:
        return f"Valeur impossible pour {metric} : {value} (plage physique {lo}–{hi})"
    return None


def level_above(value: float, orange: float, rouge: float) -> str:
    if value >= rouge:
        return "rouge"
    if value >= orange:
        return "orange"
    return "vert"


def level_below(value: float, orange: float, rouge: float) -> str:
    if value <= rouge:
        return "rouge"
    if value <= orange:
        return "orange"
    return "vert"


def metric_level(metric: str, value: float) -> str:
    if metric == "heart_rate":
        t = THRESHOLDS["heart_rate"]
        return level_above(value, t["orange"], t["rouge"])
    if metric == "spo2":
        t = THRESHOLDS["spo2"]
        return level_below(value, t["orange"], t["rouge"])
    if metric == "sleep":
        t = THRESHOLDS["sleep"]
        if value <= t["rouge"]:
            return "rouge"
        if value < t["orange"]:
            return "orange"
        return "vert"
    if metric == "glucose":
        t = THRESHOLDS["glucose_fasting"]
        if value < t["rouge_low"] or value > t["rouge_high"]:
            return "rouge"
        if value < t["orange_low"] or value > t["orange_high"]:
            return "orange"
        return "vert"
    if metric == "temperature":
        t = THRESHOLDS["temperature"]
        if value >= t["rouge_high"] or value <= t["rouge_low"]:
            return "rouge"
        if value >= t["orange_high"] or value < t["orange_low"]:
            return "orange"
        return "vert"
    if metric == "mood":
        t = THRESHOLDS["mood"]
        return level_below(value, t["orange"], t["rouge"])
    if metric == "bp_systolic":
        t = THRESHOLDS["bp_systolic"]
        return level_above(value, t["orange"], t["rouge"])
    if metric == "bp_diastolic":
        t = THRESHOLDS["bp_diastolic"]
        return level_above(value, t["orange"], t["rouge"])
    return "vert"
