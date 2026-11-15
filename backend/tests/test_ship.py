"""Protections du serveur de bord. Base temporaire, sans réseau."""
import json
import os
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient


class ShipServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        fd, path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        os.environ["PULSAR_DB"] = path
        os.environ["NASA_API_KEY"] = "DEMO_KEY"
        from app.main import app
        from app.seed import seed

        seed()
        cls.client = TestClient(app)
        cls.db = path

    @classmethod
    def tearDownClass(cls):
        os.remove(cls.db)

    def test_health_says_models_are_simulated(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["models"], ["simulated-rules"])

    def test_astronauts_contract(self):
        row = self.client.get("/astronauts").json()[0]
        for key in ("id", "name", "role", "cabin", "status", "drift_score", "last_sync"):
            self.assertIn(key, row)

    def test_telemetry_is_chronological(self):
        rows = self.client.get("/telemetry", params={"astronaut_id": "LK", "limit": 5}).json()
        self.assertEqual(len(rows), 5)
        stamps = [r["timestamp"] for r in rows]
        self.assertEqual(stamps, sorted(stamps))
        self.assertIn("heart_rate", rows[-1])
        self.assertIn("spo2", rows[-1])

    def test_unknown_astronaut_is_404(self):
        self.assertEqual(self.client.get("/telemetry", params={"astronaut_id": "ZZ"}).status_code, 404)

    def test_alerts_filter_by_level(self):
        rows = self.client.get("/alerts", params={"level": "rouge"}).json()
        self.assertTrue(rows)
        self.assertTrue(all(r["level"] == "rouge" for r in rows))

    def test_predictions_cover_seven_metrics_and_are_simulated(self):
        body = self.client.get("/predictions/LK", params={"horizon": "24h"}).json()
        metrics = {f["metric"] for f in body["forecasts"]}
        self.assertEqual(len(metrics), 7)
        self.assertEqual(body["model"], "simulated-rules v0")
        self.assertTrue(body["forecasts"][0]["summary"].startswith("SIMULÉ"))

    def test_recommendations_list(self):
        rows = self.client.get("/recommendations/LK").json()
        self.assertTrue(any(r["id"] == "RC-LK-02" for r in rows))

    def test_astronaut_can_apply_own_recommendation(self):
        res = self.client.patch(
            "/recommendations/LK/RC-LK-02",
            headers={"X-User-Id": "AST-001"},
            json={"status": "appliquee", "by": "AST-001"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "appliquee")

    def test_astronaut_cannot_validate(self):
        res = self.client.patch(
            "/recommendations/LK/RC-LK-01",
            headers={"X-User-Id": "AST-001"},
            json={"status": "validee", "by": "AST-001"},
        )
        self.assertEqual(res.status_code, 403)

    def test_cmo_can_validate(self):
        res = self.client.patch(
            "/recommendations/LK/RC-LK-01",
            headers={"X-User-Id": "CMO-001"},
            json={"status": "validee", "by": "CMO-001", "note": "Vu à bord"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "validee")

    def test_nasa_is_read_only(self):
        res = self.client.patch(
            "/recommendations/LK/RC-LK-01",
            headers={"X-User-Id": "NASA-FS-001"},
            json={"status": "validee", "by": "NASA-FS-001"},
        )
        self.assertEqual(res.status_code, 403)

    def test_patch_requires_identity(self):
        res = self.client.patch("/recommendations/LK/RC-LK-01", json={"status": "faite", "by": "AST-001"})
        self.assertEqual(res.status_code, 401)

    def test_watch_can_sync_heart_rate(self):
        res = self.client.post(
            "/sync",
            headers={"X-Api-Key": "demo-key-watch-lk"},
            json={"client_event_id": "evt-hr-1", "astronaut_id": "LK", "metric": "heart_rate", "value": 76, "recorded_at": "2026-11-15T06:00:00Z"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json()["duplicate"])

    def test_sync_replay_does_not_duplicate(self):
        body = {"client_event_id": "evt-replay", "astronaut_id": "LK", "metric": "sleep", "value": 7.5, "recorded_at": "2026-11-15T06:10:00Z"}
        first = self.client.post("/sync", headers={"X-Api-Key": "demo-key-watch-lk"}, json=body)
        again = self.client.post("/sync", headers={"X-Api-Key": "demo-key-watch-lk"}, json=body)
        self.assertFalse(first.json()["duplicate"])
        self.assertTrue(again.json()["duplicate"])
        self.assertEqual(again.json()["id"], first.json()["id"])

    def test_watch_cannot_send_glucose(self):
        res = self.client.post(
            "/sync",
            headers={"X-Api-Key": "demo-key-watch-lk"},
            json={"client_event_id": "evt-glu-watch", "astronaut_id": "LK", "metric": "glucose", "value": 90, "recorded_at": "2026-11-15T06:01:00Z"},
        )
        self.assertEqual(res.status_code, 403)

    def test_watch_cannot_write_another_astronaut(self):
        res = self.client.post(
            "/sync",
            headers={"X-Api-Key": "demo-key-watch-lk"},
            json={"client_event_id": "evt-other", "astronaut_id": "AM", "metric": "spo2", "value": 98, "recorded_at": "2026-11-15T06:02:00Z"},
        )
        self.assertEqual(res.status_code, 403)

    def test_glucose_920_is_rejected(self):
        res = self.client.post(
            "/sync",
            headers={"X-Api-Key": "demo-key-kit-lk"},
            json={"client_event_id": "evt-920", "astronaut_id": "LK", "metric": "glucose", "value": 920, "recorded_at": "2026-11-15T06:03:00Z"},
        )
        self.assertEqual(res.status_code, 422)

    def test_kit_can_store_a_possible_glucose(self):
        res = self.client.post(
            "/sync",
            headers={"X-Api-Key": "demo-key-kit-lk"},
            json={"client_event_id": "evt-glu-ok", "astronaut_id": "LK", "metric": "glucose", "value": 92, "recorded_at": "2026-11-15T06:04:00Z"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["level"], "vert")

    def test_unknown_api_key_is_rejected(self):
        res = self.client.post(
            "/sync",
            headers={"X-Api-Key": "not-a-real-key"},
            json={"client_event_id": "evt-bad", "astronaut_id": "LK", "metric": "heart_rate", "value": 70, "recorded_at": "2026-11-15T06:05:00Z"},
        )
        self.assertEqual(res.status_code, 401)

    def test_stored_key_is_a_hash(self):
        import sqlite3
        from app.security import sha256_hex

        conn = sqlite3.connect(self.db)
        digest = conn.execute("SELECT key_hash FROM api_keys WHERE name = 'watch-lk'").fetchone()[0]
        conn.close()
        self.assertEqual(digest, sha256_hex("demo-key-watch-lk"))
        self.assertNotIn("demo-key", digest)

    def test_astronaut_cannot_read_someone_else(self):
        res = self.client.get("/telemetry", params={"astronaut_id": "AM"}, headers={"X-User-Id": "AST-001"})
        self.assertEqual(res.status_code, 403)

    def test_astronaut_can_read_own_telemetry(self):
        res = self.client.get("/telemetry", params={"astronaut_id": "LK"}, headers={"X-User-Id": "AST-001"})
        self.assertEqual(res.status_code, 200)

    def test_cmo_can_read_the_crew(self):
        res = self.client.get("/telemetry", params={"astronaut_id": "SR"}, headers={"X-User-Id": "CMO-001"})
        self.assertEqual(res.status_code, 200)

    def test_nasa_cannot_read_live_telemetry(self):
        res = self.client.get("/telemetry", params={"astronaut_id": "LK"}, headers={"X-User-Id": "NASA-FS-001"})
        self.assertEqual(res.status_code, 403)

    def test_nasa_can_read_a_report_prediction(self):
        res = self.client.get("/predictions/LK", headers={"X-User-Id": "NASA-FS-001"})
        self.assertEqual(res.status_code, 200)

    def test_login_and_bad_code(self):
        ok = self.client.post("/auth/login", json={"identifier": "AST-001", "code": "482105"})
        bad = self.client.post("/auth/login", json={"identifier": "AST-001", "code": "000000"})
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.json()["user"]["role"], "astronaute")
        self.assertEqual(bad.status_code, 401)
        self.assertNotIn("482105", json.dumps(ok.json()))

    def test_space_weather_falls_back_offline(self):
        with patch("app.space_weather.urllib.request.urlopen", side_effect=TimeoutError("avion")):
            res = self.client.get("/reference/space-weather")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn(body["provenance"], {"offline", "cache"})
        self.assertIn("pas des mesures", body["note"])


if __name__ == "__main__":
    unittest.main()
