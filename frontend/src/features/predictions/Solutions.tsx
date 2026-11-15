/* Solutions proposées pour chaque anomalie : actions concrètes, NON diagnostiques.
   Astronaute : Appliquer / Marquer fait / Escalader au médecin de bord.
   Médecin de bord : Valider / Remplacer (nouvelle consigne + note) / Marquer fait / Escalader au flight surgeon.
   NASA : lecture seule. */
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRecommendations, useUpdateRecommendation, type Recommendation, type RecommendationCategory, type RecommendationStatus, type Priority, type Anomaly } from "@/api";
import { Icon, WorkflowBadge, workflowFromRecommendationStatus, type IconName } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthProvider";
import { useSound } from "@/features/sound";
import type { Role } from "@/data/types";

export const CATEGORY: Record<RecommendationCategory, { label: string; icon: IconName }> = {
  hydratation: { label: "Hydratation", icon: "water_drop" },
  repos_sommeil: { label: "Repos · sommeil", icon: "bedtime" },
  ajustement_exercice: { label: "Exercice adapté", icon: "fitness_center" },
  abri_radiations: { label: "Abri anti-radiations", icon: "shield" },
  remesure: { label: "Refaire la mesure", icon: "event_repeat" },
  echographie: { label: "Échographie", icon: "monitor_heart" },
  contact_medecin_bord: { label: "Médecin de bord", icon: "stethoscope" },
  contact_flight_surgeon: { label: "Flight surgeon (NASA)", icon: "satellite_alt" },
};
const PRIO: Record<Priority, string> = { haute: "Priorité haute", moyenne: "Priorité moyenne", basse: "Priorité basse" };
const PRIO_RANK: Record<Priority, number> = { haute: 0, moyenne: 1, basse: 2 };

export function statusLabel(r: Recommendation): string {
  const byCmo = r.updatedBy?.startsWith("CMO");
  const m: Record<RecommendationStatus, string> = {
    proposee: "Nouveau", appliquee: "Pris en charge", faite: "Résolu",
    escaladee: byCmo ? "Escaladé · flight surgeon" : "Escaladé · médecin de bord",
    validee: "Pris en charge · validée", remplacee: "Résolu · remplacée",
  };
  return m[r.status];
}

export function Disclaimer({ simple }: { simple?: boolean }) {
  return (
    <p className="disclaimer" role="note">
      <Icon name="info" size={16} />
      {simple
        ? <span>Prévisions SIMULÉES : aucun modèle Isolation Forest ni LSTM ne tourne. En cas de doute ou de symptôme, prévenez le médecin de bord. Ce n’est pas un diagnostic.</span>
        : <span>Prévisions, Isolation Forest et autoencodeur LSTM : SIMULÉS tant qu’aucun modèle réel ne tourne. Aide à la décision, pas un diagnostic. À valider par le médecin de bord ou un flight surgeon.</span>}
    </p>
  );
}

export function Solutions({ astronautId, role, anomalies = [] }: { astronautId: string; role: Role; anomalies?: Anomaly[] }) {
  const { data, isLoading, isError } = useRecommendations(astronautId);
  if (isLoading) return <p className="chart-empty">Chargement des solutions…</p>;
  if (isError) return <p className="chart-empty">Solutions indisponibles.</p>;
  if (!data?.length) return <p className="r-note"><Icon name="check_circle" size={16} /> {role === "astronaute" ? "Rien à faire de particulier. Continuez votre routine." : "Aucune solution proposée pour cet astronaute."}</p>;
  const list = [...data].sort((a, b) => PRIO_RANK[a.priority] - PRIO_RANK[b.priority]);
  return <ul className="sol-list">{list.map((r) => <SolutionItem key={r.id} r={r} role={role} anomaly={anomalies.find((a) => a.id === r.anomalyId)} />)}</ul>;
}

function SolutionItem({ r, role, anomaly }: { r: Recommendation; role: Role; anomaly?: Anomaly }) {
  const { user } = useAuth();
  const mut = useUpdateRecommendation(r.astronautId);
  const { play } = useSound();
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState(r.note ?? "");
  const set = (status: RecommendationStatus, extra: { note?: string; replacementTitle?: string } = {}) => mut.mutate({ id: r.id, update: { status, by: user?.id ?? "?", ...extra } }, { onSuccess: () => { if (status === "escaladee") play("escalation"); else if (status === "validee" || status === "faite") play("ack"); } });
  const simple = role === "astronaute";
  const closed = r.status === "faite" || r.status === "escaladee";
  const decided = r.status === "validee" || r.status === "remplacee";
  const c = CATEGORY[r.category];
  return (
    <motion.li layout className={`sol sol-${r.priority} st-${r.status}`} data-status={r.status} data-id={r.id}>
      <span className="sol-ico"><Icon name={c.icon} size={20} /></span>
      <div className="sol-body">
        <p className="sol-meta"><span className={`prio prio-${r.priority}`}>{r.priority === "haute" && <Icon name="arrow_upward" size={12} />}{PRIO[r.priority]}</span><span>{c.label}</span>{!simple && <span className="mono">{r.source === "prevision" ? "issue d’une prévision" : anomaly ? `anomalie ${anomaly.id}` : ""}</span>}</p>
        {r.status === "remplacee" && r.replacementTitle
          ? <><p className="sol-title">{r.replacementTitle}</p><p className="sol-old"><s>{r.title}</s></p></>
          : <p className="sol-title">{simple ? r.plainText : r.title}</p>}
        {!simple && <p className="sol-why"><b>Pourquoi :</b> {r.rationale}</p>}
        {r.note && <p className="sol-note"><Icon name="ink_pen" size={14} /> {r.note}</p>}
        <p className="sol-status" aria-live="polite">
          <WorkflowBadge status={workflowFromRecommendationStatus(r.status)} assignee={r.assignee ?? r.updatedBy ?? (r.status === "proposee" ? (simple ? "Vous" : "CMO-001") : null)} />
          <span className="visually-hidden">{statusLabel(r)}</span>
        </p>
        <AnimatePresence initial={false}>
          {edit && (
            <motion.form className="sol-edit" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; set("remplacee", { replacementTitle: title.trim(), note: note.trim() || undefined }); setEdit(false); }}>
              <label className="field"><span>Nouvelle consigne</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Repos complet jusqu’à 18:00" required /></label>
              <label className="field"><span>Note du médecin de bord (facultatif)</span><input value={note} onChange={(e) => setNote(e.target.value)} /></label>
              <div className="btn-row"><button className="btn btn-primary sm" type="submit">Enregistrer</button><button className="btn btn-ghost sm" type="button" onClick={() => setEdit(false)}>Annuler</button></div>
            </motion.form>
          )}
        </AnimatePresence>
        {role === "astronaute" && !closed && (
          <div className="btn-row sol-actions">
            {r.status !== "appliquee" && <button className="btn btn-secondary sm" disabled={mut.isPending} onClick={() => set("appliquee")}><Icon name="play_arrow" size={16} /> Appliquer</button>}
            <button className="btn btn-secondary sm" disabled={mut.isPending} onClick={() => set("faite")}><Icon name="check" size={16} /> Marquer fait</button>
            <button className="btn btn-ghost sm" disabled={mut.isPending} onClick={() => set("escaladee")}><Icon name="stethoscope" size={16} /> Escalader au médecin de bord</button>
          </div>
        )}
        {role === "medecin-bord" && !edit && (
          <div className="btn-row sol-actions">
            {!decided && <button className="btn btn-secondary sm" disabled={mut.isPending} onClick={() => set("validee", { note: note.trim() || undefined })}><Icon name="thumb_up" size={16} /> Valider</button>}
            <button className="btn btn-secondary sm" onClick={() => { setTitle(r.replacementTitle ?? ""); setEdit(true); }}><Icon name="edit" size={16} /> Remplacer…</button>
            {r.status !== "faite" && <button className="btn btn-ghost sm" disabled={mut.isPending} onClick={() => set("faite")}><Icon name="check" size={16} /> Marquer fait</button>}
            {r.status !== "escaladee" && <button className="btn btn-ghost sm" disabled={mut.isPending} onClick={() => set("escaladee")}><Icon name="satellite_alt" size={16} /> Escalader au flight surgeon</button>}
          </div>
        )}
      </div>
    </motion.li>
  );
}
