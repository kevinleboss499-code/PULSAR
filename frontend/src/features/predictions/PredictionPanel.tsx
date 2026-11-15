/* Bloc « Prédictions » d’un astronaute : risque global, délai avant seuil, courbes prévu/observé,
   anomalies détectées (signaux contributeurs) et solutions proposées.
   mode "simple" = astronaute (langage simple) ; "detail" = médecin de bord (modèles, scores, contributions). */
import { useState } from "react";
import { motion } from "motion/react";
import { fmtH, LEVEL_TO_LIGHT, usePredictions, type Anomaly, type Horizon, type Prediction } from "@/api";
import { Card, Icon, Lamp } from "@/components/ui";
import { DataTag } from "@/app/DataSource";
import type { Role } from "@/data/types";
import { ForecastChart, ForecastLegend } from "./ForecastChart";
import { AstronautLad } from "./AstronautLad";
import { Disclaimer, Solutions } from "./Solutions";

export const MODEL_LABEL = { isolation_forest: "Isolation Forest", lstm_autoencoder: "Autoencodeur LSTM", rule: "Règle seuil" } as const;
const LEVEL_WORD = { vert: "faible", orange: "modéré", rouge: "élevé" } as const;

export function HorizonToggle({ value, onChange }: { value: Horizon; onChange: (h: Horizon) => void }) {
  return (
    <div className="seg2" role="group" aria-label="Horizon de prévision">
      <button aria-pressed={value === "24h"} onClick={() => onChange("24h")}>24 heures</button>
      <button aria-pressed={value === "7d"} onClick={() => onChange("7d")}>7 jours</button>
    </div>
  );
}

export function nextThresholdText(p: Prediction, simple?: boolean) {
  const n = p.nextThreshold;
  if (!n) return simple ? "Aucun seuil ne devrait être franchi sur cette période." : "Aucun franchissement de seuil prévu dans l’horizon.";
  return simple ? `${n.label} : pourrait passer à l’${n.level} dans ~${fmtH(n.hours)}.` : `Seuil ${n.level} probable dans ~${fmtH(n.hours)} (${n.label}).`;
}

export function DriftMeter({ v }: { v: number }) {
  const l = v >= 0.7 ? "high" : v >= 0.4 ? "medium" : "ok";
  return (
    <div className="drift" role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={v} aria-label="Score de dérive">
      <span className="drift-bar"><motion.i className={`d-${l}`} initial={{ width: 0 }} animate={{ width: `${Math.round(v * 100)}%` }} transition={{ duration: 0.4, ease: "easeOut" }} /></span>
      <span className="mono">{v.toFixed(2)}</span>
    </div>
  );
}

function RiskSummary({ p, simple }: { p: Prediction; simple: boolean }) {
  return (
    <div className="risk">
      <div><p className="eyebrow">{simple ? "Risque prévu" : "Niveau de risque prévu"}</p><div className="risk-lamp"><Lamp l={LEVEL_TO_LIGHT[p.riskLevel]} /><span className="muted">{p.riskLevel} · {LEVEL_WORD[p.riskLevel]}</span></div></div>
      <div><p className="eyebrow">Score de dérive</p><DriftMeter v={p.driftScore} /></div>
      <div className="risk-next"><p className="eyebrow">Prochain seuil</p><p className="risk-tth"><Icon name="hourglass" size={16} /> {nextThresholdText(p, simple)}</p></div>
      {!simple && <p className="muted small risk-model"><Icon name="memory" size={14} /> {p.model} · généré {p.generatedAt.slice(11, 16)} UTC</p>}
    </div>
  );
}

export function AnomalyList({ items, simple, selected, onSelect }: { items: Anomaly[]; simple?: boolean; selected?: string; onSelect?: (id: string) => void }) {
  if (!items.length) return <p className="r-note"><Icon name="check_circle" size={16} /> {simple ? "Rien d’inhabituel n’a été remarqué." : "Aucune anomalie détectée."}</p>;
  return (
    <ul className="anom-list">
      {items.map((a) => (
        <li key={a.id} data-id={a.id} className={selected === a.id ? "is-selected" : ""}>
          <div className="anom-head"><Lamp l={LEVEL_TO_LIGHT[a.level]} compact /><b>{a.label}</b>{a.value != null && <span className="mono">{a.value} {a.unit}</span>}{onSelect && <button className="forecast-inspect" aria-pressed={selected === a.id} onClick={() => onSelect(a.id)} aria-label={`Inspecter ${a.label}`}><Icon name="info" size={14} /></button>}</div>
          <p>{simple ? a.plainExplanation : a.explanation}</p>
          {!simple && (
            <>
              <p className="anom-meta mono">{MODEL_LABEL[a.model]} · dérive {a.driftScore.toFixed(2)} · détectée {a.detectedAt.slice(11, 16)} UTC · {a.id}</p>
              <div className="contrib" aria-label="Signaux ayant contribué">
                <p className="eyebrow">Signaux contributeurs</p>
                {a.contributors.map((c) => (
                  <div key={c.signal} className="contrib-row"><span>{c.signal}</span><span className="contrib-bar"><motion.i initial={{ width: 0 }} whileInView={{ width: `${Math.round(c.weight * 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.4 }} /></span><span className="mono">{Math.round(c.weight * 100)} %</span></div>
                ))}
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

type Sel = { kind: "forecast"; id: string } | { kind: "anomaly"; id: string } | null;

/** Panneau « Inspecteur » (médecin de bord) : propriétés de l’élément sélectionné (prévision ou anomalie). */
function Inspector({ p, sel }: { p: Prediction; sel: Sel }) {
  const f = sel?.kind === "forecast" ? p.forecasts.find((x) => x.metric === sel.id) : undefined;
  const a = sel?.kind === "anomaly" ? p.anomalies.find((x) => x.id === sel.id) : undefined;
  const rows: [string, string][] = f ? [
    ["Indicateur", f.label], ["Unité", f.unit], ["Résolution", f.resolution === "day" ? "journalière" : "horaire"], ["Horizon", p.horizon === "7d" ? "7 jours" : "24 heures"],
    ["Seuil orange", f.thresholds.orange != null ? `${f.thresholds.direction === "below" ? "≤" : "≥"} ${f.thresholds.orange} ${f.unit}` : "—"],
    ["Seuil rouge", f.thresholds.rouge != null ? `${f.thresholds.direction === "below" ? "≤" : "≥"} ${f.thresholds.rouge} ${f.unit}` : "—"],
    ["Tendance", f.trend], ["Niveau prévu", f.level], ["Délai avant seuil", f.timeToThresholdHours != null ? `~${fmtH(f.timeToThresholdHours)} (${f.thresholdLevel})` : "aucun"], ["Points", String(f.points.length)], ["Modèle", p.model],
  ] : a ? [
    ["Identifiant", a.id], ["Indicateur", a.metric], ["Valeur", a.value != null ? `${a.value} ${a.unit ?? ""}` : "—"], ["Niveau", a.level], ["Modèle", MODEL_LABEL[a.model]],
    ["Score de dérive", a.driftScore.toFixed(2)], ["Détectée", `${a.detectedAt.slice(0, 16).replace("T", " ")} UTC`], ...a.contributors.map((c) => [`Contribution · ${c.signal}`, `${Math.round(c.weight * 100)} %`] as [string, string]),
  ] : [];
  return (
    <aside className="inspector" aria-label="Inspecteur">
      <header><Icon name="info" size={16} /><h3>Inspecteur</h3></header>
      {rows.length ? (
        <>
          <p className="insp-title">{f ? f.label : a?.label}</p>
          <dl className="insp-props">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className="mono">{v}</dd></div>)}</dl>
          {f && <p className="insp-sum">{f.summary}</p>}
          {a && <p className="insp-sum">{a.explanation}</p>}
        </>
      ) : <p className="muted small">Sélectionnez une courbe ou une anomalie (bouton « i ») pour voir ses propriétés.</p>}
    </aside>
  );
}

export function PredictionPanel({ astronautId, role }: { astronautId: string; role: Role }) {
  const simple = role === "astronaute";
  const [h, setH] = useState<Horizon>("24h");
  const [sel, setSel] = useState<Sel>(null);
  const { data: p, isLoading, isError } = usePredictions(astronautId, h);
  if (isError) return <p className="chart-empty">Prévisions indisponibles.</p>;
  if (isLoading || !p) return <p className="chart-empty">Calcul des prévisions…</p>;
  const pick = (s: Sel) => setSel((cur) => (cur && s && cur.kind === s.kind && cur.id === s.id ? null : s));
  const main = (
    <div className="pred" data-astronaut={astronautId}>
      <Disclaimer simple={simple} />
      <Card title={simple ? "Votre tendance" : "Synthèse du modèle"} icon="insights" aside={<DataTag />}><RiskSummary p={p} simple={simple} /></Card>
      <Card title={simple ? "Ce qui est prévu" : "Prévisions · observé vs prévu"} icon="timeline" aside={<HorizonToggle value={h} onChange={setH} />} className={simple ? "" : "dense"}>
        <div className="forecast-grid">{p.forecasts.map((f) => <ForecastChart key={f.metric + h} f={f} simple={simple} height={simple ? 120 : 130} selected={sel?.kind === "forecast" && sel.id === f.metric} onSelect={simple ? undefined : () => pick({ kind: "forecast", id: f.metric })} />)}</div>
        <ForecastLegend />
      </Card>
      {!simple && <Card title="Dernières valeurs disponibles" icon="monitoring" className="dense"><AstronautLad astronautId={astronautId} /></Card>}
      <div className="two-col">
        <Card title={simple ? "Ce que PULSAR a remarqué" : "Anomalies détectées"} icon="notification_important"><AnomalyList items={p.anomalies} simple={simple} selected={sel?.kind === "anomaly" ? sel.id : undefined} onSelect={simple ? undefined : (id) => pick({ kind: "anomaly", id })} /></Card>
        <Card title={simple ? "Ce que vous pouvez faire" : "Solutions proposées"} icon="healing"><Solutions astronautId={astronautId} role={role} anomalies={p.anomalies} /></Card>
      </div>
    </div>
  );
  if (simple || role === "nasa") return main;
  return <div className="pred-layout">{main}<Inspector p={p} sel={sel} /></div>;
}
