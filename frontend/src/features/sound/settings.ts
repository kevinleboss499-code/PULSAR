/* Réglages du son — logique PURE (testée dans tests/sound.spec.ts), sans import d’alias.
   Politique PULSAR : son UNIQUEMENT pour alerte ROUGE / extrême. Orange, notifs, capteurs, UI = silencieux
   (bandeau visuel inchangé). Pas de son d’interface.
   Règles (IEC 60601-1-8, adaptées) :
   - l’alarme ROUGE (priorité haute) ne peut pas être coupée par la sourdine ni désactivée : seulement ACQUITTÉE,
     ou mise en PAUSE 2 min (comme une vraie centrale d’alarme) ; son volume ne descend pas sous 40 %.
   - le visuel (bandeau) est TOUJOURS affiché, même son coupé. */

export type SoundCategory =
  | "alarmHigh" | "alarmMedium" | "alarmLow" | "ack" | "report" | "escalation" | "sensor" | "login" | "badge" | "watchTick" | "landing";

export type SoundSettings = { muted: boolean; volume: number; categories: Record<SoundCategory, boolean> };

export const CATEGORY_LABEL: Record<SoundCategory, string> = {
  alarmHigh: "Alerte rouge / extrême (seul son actif)",
  alarmMedium: "Alerte orange (silencieuse)",
  alarmLow: "Notification · information (silencieuse)",
  ack: "Acquittement (silencieux)",
  report: "Rapport reçu / envoyé (silencieux)",
  escalation: "Escalade (silencieuse)",
  sensor: "Scan fatigue · bips (silencieux)",
  badge: "Exercice terminé (silencieux)",
  login: "Connexion (désactivé)",
  watchTick: "Navigation montre (désactivé)",
  landing: "Survol interface (désactivé)",
};
/** Catégories impossibles à désactiver. */
export const LOCKED: SoundCategory[] = ["alarmHigh"];
/** Jamais de son hors alerte rouge (forcé à chaque lecture des réglages). */
export const SILENT: SoundCategory[] = [
  "alarmMedium", "alarmLow", "ack", "report", "escalation", "sensor", "badge", "login", "watchTick", "landing",
];
/** @deprecated alias — conservé pour imports éventuels. */
export const UI_ONLY: SoundCategory[] = ["login", "watchTick", "landing"];
export const SNOOZE_MS = 120_000;
export const MIN_HIGH_VOLUME = 0.4;
export const STORAGE_KEY = "pulsar.sound";

export const DEFAULT_SETTINGS: SoundSettings = {
  muted: false, volume: 0.7,
  categories: {
    alarmHigh: true,
    alarmMedium: false, alarmLow: false, ack: false, report: false, escalation: false,
    sensor: false, badge: false, login: false, watchTick: false, landing: false,
  },
};

/** Valide/complète un objet lu depuis le stockage (valeurs manquantes → défauts, volume borné, rouge forcé). */
export function normalize(raw: unknown): SoundSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<SoundSettings>;
  const vol = typeof r.volume === "number" && Number.isFinite(r.volume) ? Math.min(1, Math.max(0, r.volume)) : DEFAULT_SETTINGS.volume;
  const cats = { ...DEFAULT_SETTINGS.categories };
  if (r.categories && typeof r.categories === "object") for (const k of Object.keys(cats) as SoundCategory[]) if (typeof r.categories[k] === "boolean") cats[k] = r.categories[k]!;
  for (const k of LOCKED) cats[k] = true;
  for (const k of SILENT) cats[k] = false; // politique : uniquement le rouge sonne
  return { muted: r.muted === true, volume: vol, categories: cats };
}

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;
export function loadSettings(storage: Storage): SoundSettings {
  try { return normalize(JSON.parse(storage.getItem(STORAGE_KEY) || "null")); } catch { return { ...DEFAULT_SETTINGS, categories: { ...DEFAULT_SETTINGS.categories } }; }
}
export function saveSettings(storage: Storage, s: SoundSettings) { storage.setItem(STORAGE_KEY, JSON.stringify(normalize(s))); }

/** Change une catégorie (refusé pour les catégories verrouillées). */
export function setCategory(s: SoundSettings, c: SoundCategory, on: boolean): SoundSettings {
  if (LOCKED.includes(c)) return s;
  return { ...s, categories: { ...s.categories, [c]: on } };
}

export type AlarmState = { acknowledged: boolean; snoozedUntil?: number | null };
export const isSnoozed = (a: AlarmState | undefined, now: number) => !!a?.snoozedUntil && now < a.snoozedUntil;

/** Doit-on émettre ce son maintenant ? */
export function shouldPlay(s: SoundSettings, c: SoundCategory, alarm?: AlarmState, now = Date.now()): boolean {
  if (alarm && (alarm.acknowledged || isSnoozed(alarm, now))) return false;
  if (c === "alarmHigh") return true; // ni sourdine ni case à cocher : il faut acquitter ou mettre en pause
  return !s.muted && s.categories[c];
}

/** Volume effectif (0–1). */
export function effectiveVolume(s: SoundSettings, c: SoundCategory): number {
  if (c === "alarmHigh") return Math.max(MIN_HIGH_VOLUME, s.volume);
  return s.muted ? 0 : s.volume;
}

/** Fin de pause (2 min) d’une alarme. */
export const snoozeUntil = (now = Date.now()) => now + SNOOZE_MS;
