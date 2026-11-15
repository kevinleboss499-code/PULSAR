/* Client HTTP typé de l’API PULSAR (FastAPI). Base : VITE_API_URL (défaut http://localhost:8000).
   - VITE_USE_MOCK=true → simulateur local (mock.ts) uniquement.
   - Sinon : vraie API ; si elle est injoignable, bascule automatique sur le simulateur pendant 30 s puis réessaie.
   Contrat JSON : docs/API-CONTRACT.md. */
import type { Alert, AlertLevel, Astronaut, DataSource, Horizon, Prediction, Recommendation, RecommendationUpdate, TelemetrySample } from "./types";
import { camelize, snakeize, toAlert, toAstronaut, toSample } from "./mapping";

export type TelemetryQuery = { astronautId: string; limit?: number; stepSec?: number; since?: string; until?: string };
export type AlertsQuery = { astronautId?: string; level?: AlertLevel };
export interface PulsarApi {
  source: DataSource;
  astronauts(): Promise<Astronaut[]>;
  telemetry(q: TelemetryQuery): Promise<TelemetrySample[]>;
  alerts(q?: AlertsQuery): Promise<Alert[]>;
  /** GET /predictions/{astronaut_id}?horizon=24h|7d */
  predictions(astronautId: string, horizon?: Horizon): Promise<Prediction>;
  /** GET /recommendations/{astronaut_id} */
  recommendations(astronautId: string): Promise<Recommendation[]>;
  /** PATCH /recommendations/{astronaut_id}/{recommendation_id} */
  updateRecommendation(astronautId: string, id: string, u: RecommendationUpdate): Promise<Recommendation>;
}

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); this.name = "ApiError"; } }
export class NetworkError extends Error { constructor(message: string) { super(message); this.name = "NetworkError"; } }

async function get<T>(path: string, params: Record<string, string | number | undefined> = {}, timeoutMs = 4000, init?: RequestInit): Promise<T> {
  const url = new URL(API_URL + path);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try { res = await fetch(url, { ...init, headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) }, signal: ctrl.signal }); }
  catch (e) { throw new NetworkError(`API injoignable (${API_URL}) : ${(e as Error).message}`); }
  finally { clearTimeout(t); }
  if (!res.ok) throw new ApiError(res.status, `${path} → HTTP ${res.status}`);
  return (await res.json()) as T;
}

type J = Record<string, unknown>;
export const httpApi: PulsarApi = {
  source: "api",
  astronauts: async () => (await get<J[]>("/astronauts")).map(toAstronaut),
  telemetry: async ({ astronautId, limit = 60, since, until }) => (await get<J[]>("/telemetry", { astronaut_id: astronautId, limit, since, until })).map(toSample),
  alerts: async (q = {}) => (await get<J[]>("/alerts", { astronaut_id: q.astronautId, level: q.level })).map(toAlert),
  predictions: async (id, horizon = "24h") => camelize<Prediction>(await get<J>(`/predictions/${encodeURIComponent(id)}`, { horizon })),
  recommendations: async (id) => camelize<Recommendation[]>(await get<J[]>(`/recommendations/${encodeURIComponent(id)}`)),
  updateRecommendation: async (id, recId, u) => camelize<Recommendation>(await get<J>(`/recommendations/${encodeURIComponent(id)}/${encodeURIComponent(recId)}`, {}, 4000, { method: "PATCH", body: JSON.stringify(snakeize(u)) })),
};
