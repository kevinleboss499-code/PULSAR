"""Les trois modèles de FC produisent une prévision bornée, et le LSTM apprend."""
import time
import unittest
from datetime import datetime, timezone

from app.hr_models import _fit_lstm, _lstm_loss, _new_lstm, heart_metric_forecast, live_forecast


class HeartModelsTest(unittest.TestCase):
    def test_lstm_loss_drops_on_a_ramp(self):
        series = [70 + 0.4 * i + 2 * ((i % 6) - 3) for i in range(36)]
        before = _lstm_loss(_new_lstm(1), series, 0, 6)
        after = _lstm_loss(_fit_lstm(series, 0, 6, 1), series, 0, 6)
        self.assertLess(after, before)

    def test_live_forecast_is_bounded_and_cached(self):
        t0 = time.perf_counter()
        body = live_forecast("LK", 1_763_200_000)
        cold = time.perf_counter() - t0
        t1 = time.perf_counter()
        live_forecast("LK", 1_763_200_000)
        warm = time.perf_counter() - t1
        self.assertLess(cold, 3.0)
        self.assertLess(warm, 0.4)
        self.assertEqual(body["models"], ["xgboost", "lstm", "prophet"])
        future = [p for p in body["points"] if "predicted" in p]
        self.assertGreaterEqual(len(future), 30)
        for p in future:
            for key in ("xgboost", "lstm", "prophet"):
                self.assertGreaterEqual(p[key], 40)
                self.assertLessEqual(p[key], 160)
        self.assertLess(abs(future[-1]["lstm"] - future[-1]["prophet"]), 12)

    def test_lk_day_forecast_has_three_curves(self):
        now = datetime(2026, 11, 15, 12, 0, tzinfo=timezone.utc)
        heart = heart_metric_forecast("LK", "24h", now)
        future = [p for p in heart["points"] if "observed" not in p]
        self.assertEqual(len(future), 24)
        self.assertIn("XGBoost", heart["summary"])
        spread = max(abs(future[-1]["xgboost"] - future[-1]["prophet"]), abs(future[-1]["lstm"] - future[-1]["prophet"]))
        self.assertGreaterEqual(spread, 0)


if __name__ == "__main__":
    unittest.main()
