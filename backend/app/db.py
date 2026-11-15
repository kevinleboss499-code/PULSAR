"""SQLite du vaisseau. Le chemin vient de PULSAR_DB (défaut data/pulsar.db)."""
import os
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def db_path() -> Path:
    raw = os.environ.get("PULSAR_DB", str(ROOT / "data" / "pulsar.db"))
    return Path(raw)


def connect() -> sqlite3.Connection:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            role TEXT NOT NULL,
            crew_id TEXT,
            display_name TEXT NOT NULL,
            title TEXT NOT NULL,
            code_hash TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS api_keys (
            name TEXT PRIMARY KEY,
            key_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            crew_id TEXT,
            scopes TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS measurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_event_id TEXT NOT NULL UNIQUE,
            astronaut_id TEXT NOT NULL,
            metric TEXT NOT NULL,
            value REAL NOT NULL,
            value2 REAL,
            unit TEXT,
            recorded_at TEXT NOT NULL,
            key_name TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recommendations (
            id TEXT PRIMARY KEY,
            astronaut_id TEXT NOT NULL,
            anomaly_id TEXT,
            source TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT NOT NULL,
            title TEXT NOT NULL,
            rationale TEXT NOT NULL,
            plain_text TEXT NOT NULL,
            status TEXT NOT NULL,
            updated_at TEXT,
            updated_by TEXT,
            assignee TEXT,
            note TEXT,
            replacement_title TEXT
        );
        CREATE TABLE IF NOT EXISTS login_attempts (
            identifier TEXT PRIMARY KEY,
            fails INTEGER NOT NULL,
            locked_until REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token_hash TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            expires_at REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS space_weather_cache (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            body TEXT NOT NULL,
            saved_at TEXT NOT NULL
        );
        """
    )
    conn.commit()
