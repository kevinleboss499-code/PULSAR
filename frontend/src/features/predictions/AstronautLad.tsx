/* Dernières valeurs disponibles d’un astronaute (tableau LAD) : capteurs temps réel + dernières mesures de kit. */
import { usePredictions, useTelemetry } from "@/api";
import { LadTable, type LadRow } from "@/components/telemetry";

const hm = (iso: string) => iso.slice(11, 19);
export function AstronautLad({ astronautId }: { astronautId: string }) {
  const { data: tel } = useTelemetry(astronautId, { limit: 2 });
  const { data: p } = usePredictions(astronautId, "24h");
  const live = tel?.[tel.length - 1];
  const fc = (m: string) => p?.forecasts.find((f) => f.metric === m);
  const lastObs = (m: string) => { const f = fc(m); const pt = f && [...f.points].reverse().find((x) => x.observed != null); return { f, pt }; };
  const rows: LadRow[] = [];
  if (live) {
    rows.push({ key: "hr", name: "Fréquence cardiaque", time: hm(live.timestamp), value: live.heartRate, unit: "bpm", orange: 100, rouge: 120, direction: "above", staleSec: (Date.now() - Date.parse(live.timestamp)) / 1000 });
    rows.push({ key: "spo2", name: "SpO₂", time: hm(live.timestamp), value: live.spo2, unit: "%", orange: 94, rouge: 92, direction: "below" });
    rows.push({ key: "dose", name: "Débit de dose", time: hm(live.timestamp), value: live.radiationDoseRate, unit: "µSv/h", orange: 40, rouge: 100, direction: "above" });
  }
  for (const m of ["bp_systolic", "skin_temp", "glucose", "sleep"]) {
    const { f, pt } = lastObs(m);
    if (f && pt) rows.push({ key: m, name: f.label, time: f.resolution === "day" ? pt.timestamp.slice(5, 10) : hm(pt.timestamp), value: pt.observed!, unit: f.unit, orange: f.thresholds.orange, rouge: f.thresholds.rouge, direction: f.thresholds.direction, staleSec: (Date.now() - Date.parse(pt.timestamp)) / 1000 });
  }
  if (!rows.length) return <p className="chart-empty">Chargement…</p>;
  return <LadTable rows={rows} caption="Dernières valeurs disponibles" staleAfterSec={36 * 3600} />;
}
