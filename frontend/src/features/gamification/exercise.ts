/* Séance d’exercice partagée : Objectifs / Bien-être la lancent ; Accueil et Silhouette suivent les zones. */
import { useSyncExternalStore } from "react";
import type { ZoneState } from "@/components/body3d";

export const BODY_PARTS = [
  { id: "legs", label: "Jambes", zone: "muscles" },
  { id: "arms", label: "Bras", zone: "muscles" },
  { id: "core", label: "Tronc", zone: "muscles" },
  { id: "spine", label: "Os", zone: "spine" },
  { id: "heart", label: "Cœur", zone: "heart" },
  { id: "lungs", label: "Poumons", zone: "lungs" },
] as const;

type Snap = { running: boolean; step: number };
let snap: Snap = { running: false, step: 0 };
const listeners = new Set<() => void>();
let timer = 0;

function emit(next: Snap) {
  snap = next;
  listeners.forEach((fn) => fn());
}

export function startExercise() {
  window.clearInterval(timer);
  emit({ running: true, step: 0 });
  timer = window.setInterval(() => emit({ running: true, step: snap.step + 1 }), 3000);
}

export function stopExercise() {
  window.clearInterval(timer);
  timer = 0;
  emit({ running: false, step: snap.step });
}

export function useExerciseSession() {
  return useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    () => snap,
    () => snap,
  );
}

/** Zone de la silhouette correspondant à la partie travaillée en ce moment. */
export function exerciseFocus(session: Snap) {
  if (!session.running) return "";
  return BODY_PARTS[session.step % BODY_PARTS.length].zone;
}

export function exercisePart(session: Snap) {
  if (!session.running) return null;
  return BODY_PARTS[session.step % BODY_PARTS.length];
}

/** Zones déjà passées dans la séance (y compris celle en cours). */
export function exerciseCovered(session: Snap): string[] {
  if (!session.running && session.step === 0) return [];
  const n = session.running ? Math.min(BODY_PARTS.length, session.step + 1) : Math.min(BODY_PARTS.length, session.step);
  const zones = new Set<string>();
  for (let i = 0; i < n; i++) zones.add(BODY_PARTS[i % BODY_PARTS.length].zone);
  return [...zones];
}

/**
 * Teinte le corps pendant la séance : zones sollicitées en `active` (vert),
 * sans écraser une alerte clinique déjà présente (medium / high).
 */
export function applyExerciseStates(base: Record<string, ZoneState>, session: Snap): Record<string, ZoneState> {
  if (!session.running) return base;
  const next = { ...base };
  for (const zone of exerciseCovered(session)) {
    const cur = next[zone] ?? "none";
    if (cur !== "medium" && cur !== "high") next[zone] = "active";
  }
  return next;
}
