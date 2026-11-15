/* Seuils indicatifs — cahier des charges §7 et §8.
   backend/app/thresholds.json reprend les mêmes nombres (le serveur Python n’est pas dans ce dépôt).
   Ce n’est pas un diagnostic. Un médecin doit valider ces repères. */
import type { Light } from "./types";

export const THRESHOLDS = {
  heart_rate: { orange: 100, rouge: 120 },
  spo2: { orange: 94, rouge: 92 },
  bp_systolic: { orange: 130, rouge: 160 },
  bp_diastolic: { orange: 85, rouge: 100 },
  glucose_fasting: { orangeHigh: 99, rougeHigh: 126, orangeLow: 70, rougeLow: 54 },
  glucose_post: { orangeHigh: 140, rougeHigh: 180, orangeLow: 70, rougeLow: 54 },
  /** Prévisions sans contexte de repas : côté haut seulement. */
  glucose_forecast: { orange: 126, rouge: 180 },
  temperature: { orangeHigh: 37.5, rougeHigh: 38, orangeLow: 36.1, rougeLow: 35 },
  /** CDC : 7 h ou plus. Attention sous 6 h, alerte à 5 h ou moins (§8, nuits courtes). */
  sleep: { orange: 6, rouge: 5 },
  /** Pas de norme CDC : 1 = alerte, 2 = attention, 3 à 5 = nominal. */
  mood: { orange: 2, rouge: 1 },
  radiation: { orange: 40, rouge: 100 },
} as const;

export function bandAbove(v: number, orange: number, rouge: number): Light {
  if (v >= rouge) return "warning";
  if (v >= orange) return "caution";
  return "ok";
}

export function bandBelow(v: number, orange: number, rouge: number): Light {
  if (v <= rouge) return "warning";
  if (v <= orange) return "caution";
  return "ok";
}

export function heartRateLight(bpm: number): Light {
  return bandAbove(bpm, THRESHOLDS.heart_rate.orange, THRESHOLDS.heart_rate.rouge);
}

export function spo2Light(pct: number): Light {
  return bandBelow(pct, THRESHOLDS.spo2.orange, THRESHOLDS.spo2.rouge);
}

export function bpLights(sys: number, dia: number): Light {
  const s = bandAbove(sys, THRESHOLDS.bp_systolic.orange, THRESHOLDS.bp_systolic.rouge);
  const d = bandAbove(dia, THRESHOLDS.bp_diastolic.orange, THRESHOLDS.bp_diastolic.rouge);
  if (s === "warning" || d === "warning") return "warning";
  if (s === "caution" || d === "caution") return "caution";
  return "ok";
}

export function glucoseLight(g: number, meal: "jeun" | "repas"): Light {
  if (!g) return "ok";
  const t = meal === "jeun" ? THRESHOLDS.glucose_fasting : THRESHOLDS.glucose_post;
  if (g < t.rougeLow || g > t.rougeHigh) return "warning";
  if (g < t.orangeLow || g > t.orangeHigh) return "caution";
  return "ok";
}

export function temperatureLight(c: number): Light {
  const t = THRESHOLDS.temperature;
  if (!Number.isFinite(c) || c <= 0) return "ok";
  if (c >= t.rougeHigh || c <= t.rougeLow) return "warning";
  if (c >= t.orangeHigh || c < t.orangeLow) return "caution";
  return "ok";
}

export function moodLight(n: number): Light {
  if (n <= THRESHOLDS.mood.rouge) return "warning";
  if (n <= THRESHOLDS.mood.orange) return "caution";
  return "ok";
}

export function sleepLight(hours: number): Light {
  if (hours <= THRESHOLDS.sleep.rouge) return "warning";
  if (hours < THRESHOLDS.sleep.orange) return "caution";
  return "ok";
}
