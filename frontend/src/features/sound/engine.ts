/* Moteur audio : sons SYNTHÉTISÉS avec la Web Audio API (aucun fichier, aucun droit d’auteur).
   Motifs d’alarme inspirés d’IEC 60601-1-8 :
   - haute priorité (rouge) : salve de 10 impulsions « x-x-x — x-x  ·  x-x-x — x-x », répétée tant que non acquittée ;
   - moyenne (orange) : 3 impulsions « x-x-x », répétée plus lentement ;
   - basse (info) : 1 carillon doux.
   Impulsions = fondamentale + 3 harmoniques (repérables dans le bruit), attaque/relâche courtes (pas de clic). */
import type { SoundCategory } from "./settings";

export type SoundId =
  | "alarmHigh" | "alarmMedium" | "alarmLow" | "ack" | "reportIn" | "reportOut" | "escalation"
  | "fatiguePim" | "sensorTick" | "sensorRise" | "sensorStop"
  | "login" | "badge" | "watchTick" | "hover";
export const SOUND_CATEGORY: Record<SoundId, SoundCategory> = {
  alarmHigh: "alarmHigh", alarmMedium: "alarmMedium", alarmLow: "alarmLow", ack: "ack", reportIn: "report", reportOut: "report",
  escalation: "escalation", fatiguePim: "alarmHigh", sensorTick: "sensor", sensorRise: "sensor", sensorStop: "sensor",
  login: "login", badge: "badge", watchTick: "watchTick", hover: "landing",
};
export const SOUND_LABEL: Record<SoundId, string> = {
  alarmHigh: "Alerte rouge", alarmMedium: "Alerte orange", alarmLow: "Notification", ack: "Acquittement", reportIn: "Rapport reçu", reportOut: "Rapport envoyé",
  escalation: "Escalade", fatiguePim: "Pim fatigue (scan)", sensorTick: "Bip capteur", sensorRise: "Risque en hausse", sensorStop: "Arrêt alerte",
  login: "Connexion", badge: "Exercice terminé", watchTick: "Tic montre", hover: "Survol",
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

/** Journal des sons émis (utile pour les tests et le débogage). */
export const soundLog: { id: SoundId; at: number }[] = [];
declare global { interface Window { __pulsarSoundLog?: typeof soundLog } }
if (typeof window !== "undefined") window.__pulsarSoundLog = soundLog;

export const isUnlocked = () => !!ctx && ctx.state === "running";
/** À appeler lors d’un geste utilisateur (politique d’autoplay des navigateurs). */
export async function unlock(): Promise<boolean> {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") await ctx.resume();
    return ctx.state === "running";
  } catch { return false; }
}

function pulse(t0: number, freq: number, dur: number, gain: number, harmonics = [1, 0.5, 0.3, 0.2]) {
  if (!ctx || !master) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.015);
  g.gain.setValueAtTime(gain, t0 + Math.max(0.02, dur - 0.04));
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  g.connect(master);
  harmonics.forEach((h, i) => {
    if (!ctx) return;
    const o = ctx.createOscillator();
    const hg = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq * (i + 1);
    hg.gain.value = h / harmonics.length;
    o.connect(hg).connect(g);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  });
}
/** Bip court type piezo Arduino (`tone()` / buzzer) — onde carrée, attaque nette. */
function piezo(t0: number, freq: number, dur: number, gain: number) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "square";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.004);
  g.gain.setValueAtTime(gain, t0 + Math.max(0.01, dur - 0.012));
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.01);
}
function sweep(t0: number, f1: number, f2: number, dur: number, gain: number) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(f1, t0);
  o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + 0.02); g.gain.linearRampToValueAtTime(0, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

/** Durée (s) de chaque motif, pour la planification des répétitions. */
const PATTERNS: Record<SoundId, (t: number, v: number) => void> = {
  alarmHigh: (t, v) => { // 10 impulsions : 3 + 2, pause, 3 + 2
    const f = 660, d = 0.12, s = 0.07; let x = t;
    for (const group of [3, 2, 3, 2]) { for (let i = 0; i < group; i++) { pulse(x, f, d, v); x += d + s; } x += group === 2 ? 0.35 : 0.12; }
  },
  alarmMedium: (t, v) => { for (let i = 0; i < 3; i++) pulse(t + i * 0.32, 523, 0.2, v * 0.8); },
  alarmLow: (t, v) => { pulse(t, 784, 0.35, v * 0.45, [1, 0.25]); },
  ack: (t, v) => { pulse(t, 659, 0.12, v * 0.5, [1, 0.3]); pulse(t + 0.16, 494, 0.18, v * 0.5, [1, 0.3]); },
  reportIn: (t, v) => { pulse(t, 587, 0.12, v * 0.45, [1, 0.3]); pulse(t + 0.15, 880, 0.2, v * 0.45, [1, 0.3]); },
  reportOut: (t, v) => { [523, 659, 784].forEach((f, i) => pulse(t + i * 0.11, f, 0.1, v * 0.4, [1, 0.2])); },
  escalation: (t, v) => { sweep(t, 440, 880, 0.32, v * 0.4); pulse(t + 0.34, 880, 0.12, v * 0.4, [1, 0.3]); },
  /** Scan visage, fatigue extrême : buzzer Arduino. Six « pim », de plus en plus serrés et un peu plus aigus. */
  fatiguePim: (t, v) => {
    const gaps = [0, 0.2, 0.36, 0.48, 0.58, 0.66];
    gaps.forEach((g, i) => piezo(t + g, 2000 + i * 140, 0.04, Math.min(0.45, v * 0.55)));
  },
  /** Un « pim » piezo — répété plus vite quand le risque fatigue monte. */
  sensorTick: (t, v) => { piezo(t, 2100, 0.05, v * 0.22); },
  /** Salve qui accélère (risque élevé / montée). */
  sensorRise: (t, v) => {
    const gaps = [0, 0.22, 0.4, 0.54, 0.66, 0.76];
    gaps.forEach((g, i) => piezo(t + g, 1800 + i * 120, 0.045, v * (0.16 + i * 0.02)));
  },
  /** Bip d’arrêt (pouls en hausse → on stoppe l’exercice), type Arduino. */
  sensorStop: (t, v) => { piezo(t, 2400, 0.08, v * 0.28); piezo(t + 0.12, 1600, 0.12, v * 0.22); },
  login: (t, v) => { pulse(t, 523, 0.3, v * 0.3, [1, 0.2]); pulse(t + 0.08, 659, 0.3, v * 0.25, [1, 0.2]); pulse(t + 0.16, 784, 0.35, v * 0.22, [1, 0.2]); },
  badge: (t, v) => { pulse(t, 1319, 0.12, v * 0.12, [1]); },
  watchTick: (t, v) => { pulse(t, 1800, 0.025, v * 0.18, [1, 0.4]); },
  hover: (t, v) => { pulse(t, 1568, 0.04, v * 0.06, [1]); },
};
/** Plus de répétition : une notification = un seul motif, puis silence. */
export const REPEAT_MS: Partial<Record<SoundId, number>> = {};

/** Joue un motif au volume `v` (0–1). Toujours journalisé, même si l’audio n’est pas encore débloqué. */
export function playPattern(id: SoundId, v: number) {
  soundLog.push({ id, at: Date.now() });
  if (soundLog.length > 200) soundLog.shift();
  if (!ctx || ctx.state !== "running" || v <= 0) return;
  PATTERNS[id](ctx.currentTime + 0.02, v);
}
