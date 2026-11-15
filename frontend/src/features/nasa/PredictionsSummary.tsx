/* Section de rapport NASA : synthèse des prédictions, anomalies et solutions de chaque astronaute (lecture seule). */
import { LEVEL_TO_LIGHT, fmtH, useCrewPredictions, useRecommendations } from "@/api";
import { Avatar, Icon, Lamp } from "@/components/ui";
import { CREW } from "@/data/demo/crew";
import { MODEL_LABEL, Disclaimer, statusLabel } from "@/features/predictions";

function Recs({ id }: { id: string }) {
  const { data } = useRecommendations(id);
  if (!data) return <>…</>;
  if (!data.length) return <span className="muted">—</span>;
  return <ul className="nasa-recs">{data.map((r) => <li key={r.id}>{r.status === "remplacee" && r.replacementTitle ? r.replacementTitle : r.title} <span className="muted">· {statusLabel(r)}</span></li>)}</ul>;
}

export function PredictionsSummary() {
  const q = useCrewPredictions(CREW.map((c) => c.id));
  return (
    <section className="rep-sec pred-summary">
      <h2><Icon name="insights" size={18} /> Prédictions et anomalies (modèles de bord)</h2>
      <Disclaimer />
      <table className="crew-table pred-table">
        <thead><tr><th>Astronaute</th><th>Risque prévu</th><th>Dérive</th><th>Prochain seuil</th><th>Anomalies</th><th>Solutions (statut à bord)</th></tr></thead>
        <tbody>{CREW.map((m, i) => {
          const p = q[i]?.data;
          return (
            <tr key={m.id} data-id={m.id}>
              <td><span className="who"><Avatar id={m.id} l={p ? LEVEL_TO_LIGHT[p.riskLevel] : undefined} /> {m.name}</span></td>
              <td>{p ? <Lamp l={LEVEL_TO_LIGHT[p.riskLevel]} /> : "…"}</td>
              <td className="mono">{p ? p.driftScore.toFixed(2) : "…"}</td>
              <td>{p?.nextThreshold ? `${p.nextThreshold.label} · ${p.nextThreshold.level} ~${fmtH(p.nextThreshold.hours)}` : "—"}</td>
              <td>{p?.anomalies.length ? <ul className="nasa-recs">{p.anomalies.map((a) => <li key={a.id}>{a.label} <span className="muted mono">· {MODEL_LABEL[a.model]} · {a.driftScore.toFixed(2)}</span></li>)}</ul> : "—"}</td>
              <td><Recs id={m.id} /></td>
            </tr>
          );
        })}</tbody>
      </table>
    </section>
  );
}
