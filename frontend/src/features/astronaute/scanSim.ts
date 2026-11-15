/* Taux SIMULÉS, déterministes à la seconde (même principe que api/mock.ts).
   Le backend les remplacera : même forme de résultat, plus de sinusoïde locale.
   Pas un diagnostic. */

const wave = (sec: number, period: number, phase = 0) => Math.sin((sec / period) * Math.PI * 2 + phase);

/** Oscille autour d’une base. `amp` est l’écart maximal. */
export function wobble(base: number, amp: number, periodSec: number, t = Date.now()) {
  const sec = t / 1000;
  return Math.round(base + amp * wave(sec, periodSec));
}

export type FatigueLevel = "faible" | "moderee" | "elevee";

export type ScanSample = {
  /** Fermeture des paupières, % au-dessus de la référence personnelle. */
  eyelids: number;
  /** Clignements par minute. */
  blinks: number;
  fatigue: FatigueLevel;
};

export function parseSleepHours(sleep: string) {
  const m = /^(\d+)h(\d+)/.exec(sleep.replace(",", "."));
  if (!m) return 7;
  return Math.round((Number(m[1]) + Number(m[2]) / 60) * 10) / 10;
}

export function scanSample(t = Date.now()): ScanSample {
  const sec = t / 1000;
  const eyelids = Math.round(10 + 14 * (0.5 + 0.5 * wave(sec, 6, 0.4)));
  const blinks = Math.round(18 + 7 * wave(sec, 4, 1.1));
  const fatigue: FatigueLevel = eyelids >= 22 ? "elevee" : eyelids >= 15 ? "moderee" : "faible";
  return { eyelids, blinks, fatigue };
}
