/* Zoom de zone partagé : même geste sur tous les tableaux de bord. */
import { useState } from "react";
import { REGIONS } from "@/data/demo/regions";
import type { ZoneState } from "./zones";

export function zoneBrief(states: Record<string, ZoneState>, id: string) {
  const reg = REGIONS.find((r) => r.id === id);
  const st = states[id] ?? "none";
  if (st === "high") return `Alerte · ${reg?.need ?? "zone"}`;
  if (st === "medium") return `Attention · ${reg?.need ?? "zone"}`;
  if (st === "none") return "Pas de mesure directe";
  return "Nominal";
}

export function useZoneZoom(states: Record<string, ZoneState>, initial = "", scope = "") {
  const [sel, setSel] = useState(initial);
  const [seen, setSeen] = useState(scope);
  if (scope !== seen) {
    setSeen(scope);
    setSel(initial);
  }
  const pick = (id: string) => setSel((cur) => (cur === id ? "" : id));
  return {
    sel: sel || undefined,
    pick,
    zoom: !!sel,
    need: sel ? zoneBrief(states, sel) : undefined,
  };
}
