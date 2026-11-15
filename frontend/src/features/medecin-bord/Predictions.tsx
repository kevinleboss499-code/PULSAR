/* M12 · Prédictions de l’équipage (médecin de bord) : vue d’ensemble + détail par astronaute
   (modèles, scores, signaux contributeurs), validation ou remplacement des solutions proposées. */
import { LEVEL_TO_LIGHT, fmtH, useCrewPredictions } from "@/api";
import { Avatar, Lamp, PageHead as Head } from "@/components/ui";
import { CREW } from "@/data/demo/crew";
import { PredictionPanel, DriftMeter } from "@/features/predictions";
import type { Go } from "@/app/types";

export function CmoPredictions({ id, go }: { id?: string; go: Go }) {
  const m = CREW.find((c) => c.id === id) ?? CREW.find((c) => c.id === "LK")!;
  const q = useCrewPredictions(CREW.map((c) => c.id));
  return (
    <>
      <Head title={`Prédictions · ${m.name}`} sub="Prévisions 24 h / 7 j, anomalies détectées et solutions à valider." />
      <nav className="pred-crew" aria-label="Astronautes">
        {CREW.map((c, i) => {
          const p = q[i]?.data;
          return (
            <button key={c.id} aria-current={c.id === m.id ? "page" : undefined} onClick={() => go(`/medecin-bord/predictions/${c.id}`)}>
              <span className="pc-top"><Avatar id={c.id} l={p ? LEVEL_TO_LIGHT[p.riskLevel] : undefined} /><b>{c.name}</b>{p && p.riskLevel !== "vert" && <Lamp l={LEVEL_TO_LIGHT[p.riskLevel]} compact />}</span>
              {p ? <><DriftMeter v={p.driftScore} /><span className="pc-next">{p.nextThreshold ? `Seuil ${p.nextThreshold.level} ~${fmtH(p.nextThreshold.hours)} · ${p.nextThreshold.label}` : "Aucun seuil prévu"}</span><span className="pc-next">{p.anomalies.length} anomalie{p.anomalies.length > 1 ? "s" : ""}</span></> : <span className="pc-next">…</span>}
            </button>
          );
        })}
      </nav>
      <PredictionPanel key={m.id} astronautId={m.id} role="medecin-bord" />
    </>
  );
}
