/* Hooks de données (TanStack React Query). Le QueryClient est fourni dans app/App.tsx. */
import { useEffect, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, currentSource, onSourceChange } from "./service";
import type { AlertLevel, DataSource, Horizon, RecommendationUpdate } from "./types";

/** Télémétrie d’un astronaute : temps réel (rafraîchie toutes les `intervalMs`) ou fenêtre fixe se terminant à `until`. */
export function useTelemetry(astronautId: string | undefined, { limit = 60, intervalMs = 2000, until }: { limit?: number; intervalMs?: number; until?: string } = {}) {
  return useQuery({
    queryKey: ["telemetry", astronautId, limit, until ?? "live"],
    queryFn: () => api.telemetry({ astronautId: astronautId!, limit, until }),
    enabled: !!astronautId,
    refetchInterval: until ? false : intervalMs, // fenêtre fixe = pas de rafraîchissement
    placeholderData: (prev) => prev,
  });
}

/** Alertes (filtrables par astronaute et niveau vert/orange/rouge), rafraîchies toutes les 15 s. */
export function useAlerts(q: { astronautId?: string; level?: AlertLevel } = {}) {
  return useQuery({ queryKey: ["alerts", q.astronautId, q.level], queryFn: () => api.alerts(q), refetchInterval: 15_000 });
}

/** Équipage avec état global et score de dérive, rafraîchi toutes les 30 s. */
export function useAstronauts() {
  return useQuery({ queryKey: ["astronauts"], queryFn: () => api.astronauts(), refetchInterval: 30_000 });
}

/** Source des données affichées : "api" ou "mock" (simulateur DÉMO). */
export function useDataSource(): DataSource {
  const [s, set] = useState<DataSource>(currentSource());
  useEffect(() => onSourceChange(set), []);
  return s;
}

/** Prévisions + anomalies d’un astronaute (horizon 24 h ou 7 j), rafraîchies chaque minute. */
export function usePredictions(astronautId: string | undefined, horizon: Horizon = "24h") {
  return useQuery({ queryKey: ["predictions", astronautId, horizon], queryFn: () => api.predictions(astronautId!, horizon), enabled: !!astronautId, refetchInterval: 60_000, placeholderData: (p) => (p?.astronautId === astronautId ? p : undefined) });
}
/** Prévisions de plusieurs astronautes (tableau NASA / médecin de bord). */
export function useCrewPredictions(ids: string[], horizon: Horizon = "24h") {
  return useQueries({ queries: ids.map((id) => ({ queryKey: ["predictions", id, horizon], queryFn: () => api.predictions(id, horizon), refetchInterval: 60_000 })) });
}
/** Solutions proposées (recommandations non diagnostiques) d’un astronaute. */
export function useRecommendations(astronautId: string | undefined) {
  return useQuery({ queryKey: ["recommendations", astronautId], queryFn: () => api.recommendations(astronautId!), enabled: !!astronautId, refetchInterval: 15_000 });
}
/** Change le statut d’une solution (appliquer, fait, escalader, valider, remplacer). */
export function useUpdateRecommendation(astronautId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: RecommendationUpdate }) => api.updateRecommendation(astronautId, id, update),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations", astronautId] }),
  });
}
