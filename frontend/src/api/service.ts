/* `api` : vraie API FastAPI ou simulateur (DÉMO) avec bascule automatique. */
import { mockApi } from "./mock";
import { httpApi, NetworkError, USE_MOCK, type PulsarApi } from "./client";
import type { DataSource } from "./types";

let offlineUntil = 0;
let lastSource: DataSource = USE_MOCK ? "mock" : "api";
const listeners = new Set<(s: DataSource) => void>();
const setSource = (s: DataSource) => { if (s !== lastSource) { lastSource = s; listeners.forEach((f) => f(s)); } };
export const onSourceChange = (f: (s: DataSource) => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
export const currentSource = () => lastSource;

/** Appelle la vraie API ; en cas d’API injoignable, utilise le simulateur (DÉMO) pendant 30 s. */
async function withFallback<T>(call: (a: PulsarApi) => Promise<T>): Promise<T> {
  if (USE_MOCK || Date.now() < offlineUntil) { setSource("mock"); return call(mockApi); }
  try { const r = await call(httpApi); setSource("api"); return r; }
  catch (e) {
    if (e instanceof NetworkError) { offlineUntil = Date.now() + 30_000; setSource("mock"); return call(mockApi); }
    throw e;
  }
}

export const api = {
  astronauts: () => withFallback((a) => a.astronauts()),
  telemetry: (q: Parameters<PulsarApi["telemetry"]>[0]) => withFallback((a) => a.telemetry(q)),
  alerts: (q?: Parameters<PulsarApi["alerts"]>[0]) => withFallback((a) => a.alerts(q)),
  predictions: (...args: Parameters<PulsarApi["predictions"]>) => withFallback((a) => a.predictions(...args)),
  recommendations: (id: string) => withFallback((a) => a.recommendations(id)),
  updateRecommendation: (...args: Parameters<PulsarApi["updateRecommendation"]>) => withFallback((a) => a.updateRecommendation(...args)),
};

