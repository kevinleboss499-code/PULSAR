"""Serveur de bord PULSAR. Aide à la décision, pas un dispositif médical."""
import math
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.db import connect, init_db
from app.demo import CREW
from app.forecast import build_predictions
from app.rules import WATCH_METRICS, metric_level, reject_impossible
from app.security import same_hash, sha256_hex
from app.seed import seed
from app.space_weather import space_weather

ROOT = Path(__file__).resolve().parent.parent


def _load_env() -> None:
    path = ROOT / ".env"
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


_load_env()

app = FastAPI(title="PULSAR AHM — serveur de bord", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173", "http://127.0.0.1:4173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    conn = connect()
    init_db(conn)
    conn.close()
    seed()


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _user(conn, user_id: str | None):
    if not user_id:
        return None
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id.strip().upper(),)).fetchone()
    if not row:
        raise HTTPException(401, "Identifiant inconnu")
    return row


def _can_read(user, astronaut_id: str, live: bool) -> None:
    if user is None:
        return
    if user["role"] == "astronaute" and user["crew_id"] != astronaut_id:
        raise HTTPException(403, "Un astronaute ne voit que ses données")
    if user["role"] == "nasa" and live:
        raise HTTPException(403, "Le sol reçoit des rapports, pas la télémétrie directe")


def _sample(astronaut_id: str, t: float) -> dict:
    crew = CREW[astronaut_id]
    sec = int(t)
    hr = round(crew["hr"] + 3 * math.sin(sec / 9))
    spo2 = round(min(100, crew["spo2"] + 0.2 * math.sin(sec / 5)), 1)
    return {
        "astronaut_id": astronaut_id,
        "timestamp": datetime.fromtimestamp(sec, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "heart_rate": hr,
        "spo2": spo2,
        "radiation_dose_rate": crew["dose"],
        "radiation_cumulative": 42.1,
        "skin_temp": 36.7,
        "hrv": 41,
        "drift_score": crew["drift"],
        "sensor_id": f"esp32-{astronaut_id.lower()}-wrist",
    }


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0", "models": ["simulated-rules"], "note": "Isolation Forest et LSTM ne tournent pas. SIMULÉ."}


@app.get("/astronauts")
def astronauts(x_user_id: str | None = Header(default=None)):
    conn = connect()
    try:
        user = _user(conn, x_user_id)
    finally:
        conn.close()
    rows = []
    for aid, crew in CREW.items():
        if user and user["role"] == "astronaute" and user["crew_id"] != aid:
            continue
        rows.append({
            "id": aid,
            "name": crew["name"],
            "role": crew["role"],
            "cabin": crew["cabin"],
            "status": crew["status"],
            "drift_score": crew["drift"],
            "last_sync": _now(),
        })
    return rows


@app.get("/telemetry")
def telemetry(astronaut_id: str, limit: int = 60, since: str | None = None, until: str | None = None, x_user_id: str | None = Header(default=None)):
    if astronaut_id not in CREW:
        raise HTTPException(404, "Astronaute inconnu")
    conn = connect()
    try:
        _can_read(_user(conn, x_user_id), astronaut_id, live=True)
    finally:
        conn.close()
    end = datetime.fromisoformat(until.replace("Z", "+00:00")).timestamp() if until else time.time()
    end = int(end // 2) * 2
    points = [_sample(astronaut_id, end - (limit - 1 - i) * 2) for i in range(max(1, min(limit, 500)))]
    if since:
        points = [p for p in points if p["timestamp"] > since]
    return points


def _alerts() -> list[dict]:
    now = datetime.now(timezone.utc)
    def ago(minutes: int) -> str:
        return (now - timedelta(minutes=minutes)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return [
        {"id": "AL-127-004", "astronaut_id": "LK", "level": "orange", "metric": "heart_rate", "message": "FC de repos en hausse sur 3 jours (94 bpm, plage 60–100). SIMULÉ.", "value": 94, "threshold": 100, "drift_score": 0.58, "model": "lstm_autoencoder", "created_at": ago(3), "acknowledged": False, "assignee": "CMO-001", "seen_at": None, "ack_by": None, "workflow_status": "nouveau"},
        {"id": "AL-126-012", "astronaut_id": "SR", "level": "rouge", "metric": "spo2", "message": "SpO₂ 91 % pendant 4 min (seuil 92 %). SIMULÉ.", "value": 91, "threshold": 92, "drift_score": 0.74, "model": "rule", "created_at": ago(651), "acknowledged": True, "assignee": "CMO-001", "seen_at": ago(650), "ack_by": "CMO-001", "workflow_status": "resolu"},
    ]


@app.get("/alerts")
def alerts(astronaut_id: str | None = None, level: str | None = None, x_user_id: str | None = Header(default=None)):
    conn = connect()
    try:
        user = _user(conn, x_user_id)
    finally:
        conn.close()
    rows = _alerts()
    if user and user["role"] == "astronaute":
        rows = [a for a in rows if a["astronaut_id"] == user["crew_id"]]
    if astronaut_id:
        if user and user["role"] == "astronaute" and user["crew_id"] != astronaut_id:
            raise HTTPException(403, "Un astronaute ne voit que ses données")
        rows = [a for a in rows if a["astronaut_id"] == astronaut_id]
    if level:
        rows = [a for a in rows if a["level"] == level]
    return rows


@app.get("/predictions/{astronaut_id}")
def predictions(astronaut_id: str, horizon: str = "24h", x_user_id: str | None = Header(default=None)):
    if astronaut_id not in CREW:
        raise HTTPException(404, "Astronaute inconnu")
    if horizon not in {"24h", "7d"}:
        raise HTTPException(422, "horizon doit être 24h ou 7d")
    conn = connect()
    try:
        _can_read(_user(conn, x_user_id), astronaut_id, live=False)
    finally:
        conn.close()
    return build_predictions(astronaut_id, horizon)


def _rec_dict(row) -> dict:
    return {k: row[k] for k in row.keys()}


@app.get("/recommendations/{astronaut_id}")
def recommendations(astronaut_id: str, x_user_id: str | None = Header(default=None)):
    if astronaut_id not in CREW:
        raise HTTPException(404, "Astronaute inconnu")
    conn = connect()
    try:
        _can_read(_user(conn, x_user_id), astronaut_id, live=False)
        rows = conn.execute("SELECT * FROM recommendations WHERE astronaut_id = ?", (astronaut_id,)).fetchall()
        return [_rec_dict(r) for r in rows]
    finally:
        conn.close()


class RecPatch(BaseModel):
    status: str
    by: str
    note: str | None = None
    replacement_title: str | None = None


ASTRO_STATUS = {"appliquee", "faite", "escaladee"}
CMO_STATUS = {"validee", "remplacee", "appliquee", "faite", "escaladee"}


@app.patch("/recommendations/{astronaut_id}/{recommendation_id}")
def patch_recommendation(astronaut_id: str, recommendation_id: str, body: RecPatch, x_user_id: str | None = Header(default=None)):
    if not x_user_id:
        raise HTTPException(401, "Identifiant requis")
    conn = connect()
    try:
        user = _user(conn, x_user_id)
        if user["id"] != body.by.strip().upper():
            raise HTTPException(403, "Le champ by ne correspond pas à l'utilisateur")
        if user["role"] == "nasa":
            raise HTTPException(403, "Le sol est en lecture seule")
        if user["role"] == "astronaute":
            if user["crew_id"] != astronaut_id or body.status not in ASTRO_STATUS:
                raise HTTPException(403, "Action non autorisée pour l'astronaute")
        elif body.status not in CMO_STATUS:
            raise HTTPException(422, "Statut inconnu")
        cur = conn.execute(
            "UPDATE recommendations SET status = ?, updated_by = ?, updated_at = ?, note = COALESCE(?, note), replacement_title = COALESCE(?, replacement_title), assignee = ? WHERE id = ? AND astronaut_id = ?",
            (body.status, user["id"], _now(), body.note, body.replacement_title, user["id"], recommendation_id, astronaut_id),
        )
        if cur.rowcount != 1:
            raise HTTPException(404, "Recommandation inconnue")
        conn.commit()
        row = conn.execute("SELECT * FROM recommendations WHERE id = ?", (recommendation_id,)).fetchone()
        return _rec_dict(row)
    finally:
        conn.close()


class SyncBody(BaseModel):
    client_event_id: str = Field(min_length=1)
    astronaut_id: str
    metric: str
    value: float
    value2: float | None = None
    unit: str | None = None
    recorded_at: str


def _key_row(conn, raw: str | None):
    if not raw:
        raise HTTPException(401, "Clé d'API manquante")
    rows = conn.execute("SELECT * FROM api_keys").fetchall()
    for row in rows:
        if same_hash(raw, row["key_hash"]):
            return row
    raise HTTPException(401, "Clé d'API refusée")


@app.post("/sync")
def sync(body: SyncBody, x_api_key: str | None = Header(default=None)):
    conn = connect()
    try:
        key = _key_row(conn, x_api_key)
        scopes = set(key["scopes"].split(","))
        if body.metric not in scopes:
            raise HTTPException(403, "Cette clé ne peut pas envoyer cet indicateur")
        if key["crew_id"] and key["crew_id"] != body.astronaut_id:
            raise HTTPException(403, "Cette clé est limitée à un astronaute")
        if key["role"] == "montre" and body.metric not in WATCH_METRICS:
            raise HTTPException(403, "La montre est limitée au pouls, au sommeil et à la SpO₂")
        problem = reject_impossible(body.metric, body.value)
        if problem:
            raise HTTPException(422, problem)
        if body.value2 is not None and body.metric == "bp_systolic":
            problem = reject_impossible("bp_diastolic", body.value2)
            if problem:
                raise HTTPException(422, problem)
        existing = conn.execute("SELECT * FROM measurements WHERE client_event_id = ?", (body.client_event_id,)).fetchone()
        if existing:
            return {"id": existing["id"], "duplicate": True, "level": metric_level(body.metric, existing["value"]), "astronaut_id": existing["astronaut_id"], "metric": existing["metric"], "value": existing["value"]}
        cur = conn.execute(
            "INSERT INTO measurements (client_event_id, astronaut_id, metric, value, value2, unit, recorded_at, key_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (body.client_event_id, body.astronaut_id, body.metric, body.value, body.value2, body.unit, body.recorded_at, key["name"]),
        )
        conn.commit()
        return {"id": cur.lastrowid, "duplicate": False, "level": metric_level(body.metric, body.value), "astronaut_id": body.astronaut_id, "metric": body.metric, "value": body.value}
    finally:
        conn.close()


class LoginBody(BaseModel):
    identifier: str
    code: str


@app.post("/auth/login")
def login(body: LoginBody):
    ident = body.identifier.strip().upper()
    conn = connect()
    try:
        attempt = conn.execute("SELECT * FROM login_attempts WHERE identifier = ?", (ident,)).fetchone()
        if attempt and attempt["locked_until"] > time.time():
            raise HTTPException(429, "Trop d'essais")
        user = conn.execute("SELECT * FROM users WHERE id = ?", (ident,)).fetchone()
        if not user or not same_hash(body.code, user["code_hash"]):
            fails = (attempt["fails"] if attempt else 0) + 1
            locked = time.time() + 30 if fails >= 5 else 0
            conn.execute(
                "INSERT INTO login_attempts (identifier, fails, locked_until) VALUES (?, ?, ?) "
                "ON CONFLICT(identifier) DO UPDATE SET fails = excluded.fails, locked_until = excluded.locked_until",
                (ident, fails, locked),
            )
            conn.commit()
            raise HTTPException(401, "Identifiant ou code incorrect")
        conn.execute("DELETE FROM login_attempts WHERE identifier = ?", (ident,))
        token = sha256_hex(f"{ident}:{time.time()}")
        conn.execute(
            "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
            (sha256_hex(token), ident, time.time() + 12 * 3600),
        )
        conn.commit()
        now_ms = int(time.time() * 1000)
        return {
            "user": {"id": user["id"], "role": user["role"], "displayName": user["display_name"], "title": user["title"], "crewId": user["crew_id"]},
            "token": token,
            "issuedAt": now_ms,
            "expiresAt": now_ms + 12 * 3600 * 1000,
        }
    finally:
        conn.close()


@app.post("/auth/logout", status_code=204)
def logout():
    return None


@app.get("/reference/space-weather")
def reference_space_weather():
    return space_weather()
