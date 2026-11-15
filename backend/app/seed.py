"""Remplit la base de démo. `python -m app.seed` depuis backend/."""
from app.db import connect, init_db
from app.demo import KEYS, RECS, USERS
from app.security import sha256_hex


def seed() -> None:
    conn = connect()
    init_db(conn)
    for uid, role, crew, name, title, code in USERS:
        conn.execute(
            "INSERT INTO users (id, role, crew_id, display_name, title, code_hash) VALUES (?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET code_hash = excluded.code_hash, role = excluded.role",
            (uid, role, crew, name, title, sha256_hex(code)),
        )
    for name, secret, role, crew, scopes in KEYS:
        conn.execute(
            "INSERT INTO api_keys (name, key_hash, role, crew_id, scopes) VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(name) DO UPDATE SET key_hash = excluded.key_hash, scopes = excluded.scopes",
            (name, sha256_hex(secret), role, crew, scopes),
        )
    for row in RECS:
        conn.execute(
            "INSERT INTO recommendations (id, astronaut_id, anomaly_id, source, category, priority, title, rationale, plain_text, status, updated_at, updated_by, assignee, note, replacement_title) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(id) DO NOTHING",
            row,
        )
    conn.commit()
    conn.close()


if __name__ == "__main__":
    seed()
    print("Base de démo prête. Clés factices : demo-key-watch-lk, demo-key-kit-lk, demo-key-cmo.")
