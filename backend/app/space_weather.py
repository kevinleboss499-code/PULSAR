"""Météo spatiale DONKI. L'appel part d'ici, jamais du navigateur. Délai 3 s."""
import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.db import ROOT, connect

OFFLINE = ROOT / "data" / "space_weather.json"
NOTE = "Données de référence NASA (DONKI), pas des mesures de l'équipage."


def _stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def offline_payload() -> dict:
    data = json.loads(OFFLINE.read_text(encoding="utf-8"))
    data["provenance"] = "offline"
    data["note"] = NOTE + " DÉMO."
    return data


def _save_cache(payload: dict) -> None:
    conn = connect()
    try:
        conn.execute(
            "INSERT INTO space_weather_cache (id, body, saved_at) VALUES (1, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET body = excluded.body, saved_at = excluded.saved_at",
            (json.dumps(payload), _stamp()),
        )
        conn.commit()
    finally:
        conn.close()


def _read_cache() -> dict | None:
    conn = connect()
    try:
        row = conn.execute("SELECT body FROM space_weather_cache WHERE id = 1").fetchone()
    finally:
        conn.close()
    if not row:
        return None
    data = json.loads(row["body"])
    data["provenance"] = "cache"
    data["note"] = NOTE
    return data


def _normalize(items: list) -> dict:
    events = []
    for item in items[:5]:
        events.append({
            "kind": str(item.get("messageType") or "DONKI"),
            "title": str(item.get("messageID") or item.get("messageType") or "Notification DONKI"),
            "time": str(item.get("messageIssueTime") or _stamp()),
        })
    summary = f"{len(items)} notification(s) DONKI sur 7 jours." if items else "Aucune notification DONKI sur 7 jours."
    return {"provenance": "connected", "fetched_at": _stamp(), "summary": summary, "events": events, "note": NOTE}


def space_weather() -> dict:
    """Ne lève pas. Connecté, puis cache SQLite, puis fichier JSON."""
    key = os.environ.get("NASA_API_KEY", "DEMO_KEY")
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=7)
    url = (
        "https://api.nasa.gov/DONKI/notifications"
        f"?startDate={start.isoformat()}&endDate={end.isoformat()}&type=all&api_key={key}"
    )
    try:
        with urllib.request.urlopen(url, timeout=3) as res:
            raw = json.loads(res.read().decode("utf-8"))
        payload = _normalize(raw if isinstance(raw, list) else [])
        _save_cache(payload)
        return payload
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError, ValueError):
        cached = _read_cache()
        if cached:
            return cached
        return offline_payload()
