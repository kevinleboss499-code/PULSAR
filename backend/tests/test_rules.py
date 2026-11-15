import unittest

from app.rules import metric_level, reject_impossible


class RuleTest(unittest.TestCase):
    def test_mood_one_is_rouge(self):
        self.assertEqual(metric_level("mood", 1), "rouge")

    def test_temperature_fever_is_rouge(self):
        self.assertEqual(metric_level("temperature", 38.2), "rouge")

    def test_spo2_above_100_is_impossible(self):
        self.assertIsNotNone(reject_impossible("spo2", 110))


if __name__ == "__main__":
    unittest.main()
