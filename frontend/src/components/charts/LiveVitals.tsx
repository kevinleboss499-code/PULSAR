/* Graphiques temps réel (Recharts) : fréquence cardiaque + SpO₂, et rayonnement (débit de dose + cumul).
   Données : useTelemetry (API FastAPI ou simulateur DÉMO), rafraîchies toutes les 2 s. Sobre : pas d’animation, pas de dégradé. */
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTelemetry, type TelemetrySample } from "@/api";
import { Icon } from "@/components/ui";
import { useConductorQuery } from "@/components/telemetry";
import { THRESHOLDS as TH } from "@/data/thresholds";

const AXIS = { stroke: "var(--line-strong)", tick: { fill: "var(--text-3)", fontSize: 11, fontFamily: "var(--font-mono)" }, tickLine: false } as const;
const hhmmss = (iso: string) => iso.slice(11, 19);
const tip = { contentStyle: { background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }, labelStyle: { color: "var(--text-3)" }, labelFormatter: (l: unknown) => hhmmss(String(l)) } as const;

function Empty({ text }: { text: string }) { return <p className="chart-empty"><Icon name="sync" size={16} className="spin" /> {text}</p>; }

export function LiveVitalsChart({ astronautId, height = 200 }: { astronautId: string; height?: number }) {
  const cq = useConductorQuery();
  const { data, isError } = useTelemetry(astronautId, { limit: cq.limit, until: cq.until });
  if (isError) return <Empty text="Télémétrie indisponible" />;
  if (!data) return <Empty text="Connexion aux capteurs…" />;
  const last = data[data.length - 1];
  return (
    <div className="live-chart">
      <dl className="live-now">
        <div><dt>FC</dt><dd className="mono">{last.heartRate}<small> bpm</small></dd></div>
        <div><dt>SpO₂</dt><dd className="mono">{last.spo2}<small> %</small></dd></div>
        <div><dt>Dérive</dt><dd className="mono">{last.driftScore.toFixed(2)}</dd></div>
      </dl>
      <div style={{ height }} role="img" aria-label={`Fréquence cardiaque ${last.heartRate} bpm et SpO₂ ${last.spo2} % (${cq.mode === "fixed" ? "fenêtre fixe" : "temps réel"})`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="timestamp" tickFormatter={hhmmss} minTickGap={48} {...AXIS} />
            <YAxis yAxisId="hr" domain={[40, 130]} width={40} {...AXIS} />
            <YAxis yAxisId="spo2" orientation="right" domain={[85, 100]} width={36} {...AXIS} />
            <ReferenceLine yAxisId="spo2" y={TH.spo2.rouge} stroke="var(--high)" strokeDasharray="4 4" label={{ value: `SpO₂ ${TH.spo2.rouge} %`, fill: "var(--text-3)", fontSize: 10, position: "insideBottomRight" }} />
            <Tooltip {...tip} />
            <Line yAxisId="hr" type="monotone" dataKey="heartRate" name="FC (bpm)" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line yAxisId="spo2" type="monotone" dataKey="spo2" name="SpO₂ (%)" stroke="var(--text-2)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="chart-legend"><li><i style={{ background: "var(--accent)" }} /> FC (bpm)</li><li><i style={{ background: "var(--text-2)" }} /> SpO₂ (%)</li><li><i className="dash" /> seuil SpO₂</li></ul>
    </div>
  );
}

export function RadiationChart({ astronautId, height = 160 }: { astronautId: string; height?: number }) {
  const cq = useConductorQuery();
  const { data, isError } = useTelemetry(astronautId, { limit: cq.limit, until: cq.until });
  if (isError) return <Empty text="Dosimètre indisponible" />;
  if (!data) return <Empty text="Connexion au dosimètre…" />;
  const last: TelemetrySample = data[data.length - 1];
  return (
    <div className="live-chart">
      <dl className="live-now">
        <div><dt>Débit de dose</dt><dd className="mono">{last.radiationDoseRate.toFixed(1)}<small> µSv/h</small></dd></div>
        <div><dt>Cumul mission</dt><dd className="mono">{last.radiationCumulative.toFixed(1)}<small> mSv</small></dd></div>
      </dl>
      <div style={{ height }} role="img" aria-label={`Débit de dose ${last.radiationDoseRate.toFixed(1)} microsieverts par heure`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="timestamp" tickFormatter={hhmmss} minTickGap={48} {...AXIS} />
            <YAxis domain={[0, 40]} width={40} {...AXIS} />
            <Tooltip {...tip} />
            <Line type="stepAfter" dataKey="radiationDoseRate" name="µSv/h" stroke="var(--accent)" strokeWidth={1.75} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
