/* Courbe de prévision (Recharts) : observé (trait plein) + prévu (tirets) + intervalle de confiance (bande pâle),
   lignes de seuil orange/rouge, repère « maintenant ». Résumé texte + tableau pour lecteurs d’écran (CDC EF-47). */
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtH, LEVEL_TO_LIGHT, type MetricForecast } from "@/api";
import { Icon, Lamp } from "@/components/ui";

const AXIS = { stroke: "var(--line-strong)", tick: { fill: "var(--text-3)", fontSize: 11, fontFamily: "var(--font-mono)" }, tickLine: false } as const;
const TIP = { contentStyle: { background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }, labelStyle: { color: "var(--text-3)" } };

export function tickLabel(f: Pick<MetricForecast, "resolution">, now: number) {
  return (t: number) => {
    if (f.resolution === "day") { const d = Math.round((t - now) / 86_400_000); return d === 0 ? "auj." : d > 0 ? `J+${d}` : `J${d}`; }
    return new Date(t).toISOString().slice(11, 13) + "h";
  };
}

export function ForecastChart({ f, height = 150, simple = false, selected, onSelect }: { f: MetricForecast; height?: number; simple?: boolean; selected?: boolean; onSelect?: () => void }) {
  const data = f.points.map((p) => ({ t: Date.parse(p.timestamp), observed: p.observed, predicted: p.predicted, band: p.lower != null && p.upper != null ? [p.lower, p.upper] : undefined }));
  const nowPt = f.points.find((p) => p.predicted !== undefined)!;
  const now = Date.parse(nowPt.timestamp);
  const last = [...f.points].reverse().find((p) => p.observed !== undefined)?.observed;
  const end = f.points[f.points.length - 1].predicted;
  const vals = f.points.flatMap((p) => [p.observed, p.lower, p.upper]).filter((v): v is number => v != null);
  if (f.thresholds.orange != null) vals.push(f.thresholds.orange);
  const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.12 || 1;
  const fmt = tickLabel(f, now);
  const warn = f.level !== "vert";
  return (
    <figure className={`forecast ${warn ? "is-" + f.level : ""} ${selected ? "is-selected" : ""}`} data-metric={f.metric}>
      <figcaption className="forecast-head">
        <span className="forecast-label">{f.label}</span>
        <span className="forecast-vals mono">{last ?? "—"} <small>{f.unit}</small> <span aria-hidden="true">→</span> {end != null ? Math.round(end * 10) / 10 : "—"} <small>{f.unit} prévu</small></span>
        {warn && <Lamp l={LEVEL_TO_LIGHT[f.level]} compact />}
        {onSelect && <button className="forecast-inspect" aria-pressed={!!selected} onClick={onSelect} aria-label={`Inspecter ${f.label}`}><Icon name="info" size={14} /></button>}
      </figcaption>
      <div style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={fmt} minTickGap={28} {...AXIS} />
            <YAxis domain={[Math.floor(lo - pad), Math.ceil(hi + pad)]} width={48} tickFormatter={(v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))} {...AXIS} />
            {!simple && <Tooltip {...TIP} labelFormatter={(l) => fmt(Number(l))} formatter={(v, n) => [Array.isArray(v) ? `${v[0]}–${v[1]}` : String(v), n === "band" ? "intervalle 80 %" : n === "observed" ? "observé" : "prévu"]} />}
            <Area dataKey="band" stroke="none" fill="var(--accent)" fillOpacity={0.12} isAnimationActive={false} connectNulls />
            {f.thresholds.orange != null && <ReferenceLine y={f.thresholds.orange} stroke="var(--medium)" strokeDasharray="4 4" />}
            {f.thresholds.rouge != null && <ReferenceLine y={f.thresholds.rouge} stroke="var(--high)" strokeDasharray="4 4" />}
            <ReferenceLine x={now} stroke="var(--text-3)" label={{ value: "maintenant", position: "insideTopLeft", fill: "var(--text-3)", fontSize: 10, fontFamily: "var(--font-mono)" }} />
            <Line dataKey="observed" stroke="var(--text)" strokeWidth={1.75} dot={f.resolution === "day" || f.points.filter((p) => p.observed != null).length < 10 ? { r: 2.5, fill: "var(--text)", stroke: "none" } : false} connectNulls isAnimationActive={false} />
            <Line dataKey="predicted" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {f.timeToThresholdHours != null && f.thresholdLevel && (
        <p className={`forecast-tth t-${f.thresholdLevel}`}>Seuil {f.thresholdLevel} probable dans ~{fmtH(f.timeToThresholdHours)}</p>
      )}
      <p className="visually-hidden">{f.summary}</p>
      {!simple && (
        <details className="forecast-table">
          <summary>Tableau des valeurs</summary>
          <table><thead><tr><th>Moment</th><th>Observé</th><th>Prévu</th><th>Intervalle</th></tr></thead>
            <tbody>{f.points.map((p) => <tr key={p.timestamp}><td>{fmt(Date.parse(p.timestamp))}</td><td>{p.observed ?? "—"}</td><td>{p.predicted ?? "—"}</td><td>{p.lower != null ? `${p.lower}–${p.upper}` : "—"}</td></tr>)}</tbody></table>
        </details>
      )}
    </figure>
  );
}

export function ForecastLegend() {
  return (
    <ul className="chart-legend">
      <li><i style={{ background: "var(--text)" }} /> observé</li>
      <li><i className="dash acc" /> prévu</li>
      <li><i className="band" /> intervalle de confiance 80 %</li>
      <li><i className="dash" /> seuils orange / rouge</li>
    </ul>
  );
}
