/* Médecins NASA (flight surgeons) — Mission Control Center, Houston. Rapports reçus par liaison satellite.
   Maquettes Figma : page « NASA Houston » (1:5), écrans N01–N06. */
import { useState } from "react";
import { Icon, Demo, Card, Lamp, Avatar, Spark, PageHead as Head, WorkflowBadge } from "@/components/ui";
import { notifyBackend, notifyOk } from "@/components/ui/noticeStore";
import type { WorkflowStatus } from "@/components/ui";
import { BodyFigure, statesFor, useZoneZoom } from "@/components/body3d";
import { REPORTS, CREW, TRENDS, WINDOWS } from "@/data/demo/crew";
import type { Go } from "@/app/types";
import type { Light } from "@/data/types";
import { Probe } from "@/features/medecin-bord/Probe";
import { EchoConfirm, EchoReview, retainFor, studyLine } from "./EchoReview";
import { PredictionsSummary } from "./PredictionsSummary";
import { SoundButton } from "@/features/sound";
import { downloadPdf } from "./reportFile";
function Latency({ r }: { r: (typeof REPORTS)[number] }) { return <p className="latency"><Icon name="schedule" size={14} /> Données reçues {r.age}, générées à {r.generated.split("· ")[1]} à bord</p>; }
function ReportList({ cur, go }: { cur: string; go: Go }) {
  const [filter, setFilter] = useState<"tous" | "red" | "prog">("tous");
  const redN = REPORTS.filter((r) => r.kind === "red").length;
  const progN = REPORTS.filter((r) => r.kind !== "red").length;
  const unreadN = REPORTS.filter((r) => r.unread).length;
  const rows = REPORTS.filter((r) => filter === "tous" || (filter === "red" ? r.kind === "red" : r.kind !== "red"));
  return (
    <aside className="rep-list n01-list" aria-label="Rapports reçus">
      <header className="n01-list-h">
        <h2>Rapports</h2>
        <p className="r-note mono">{REPORTS.length} reçus · {unreadN} non lus · {redN} alerte</p>
      </header>
      <div className="rep-filter" role="tablist" aria-label="Filtrer">
        <button type="button" aria-pressed={filter === "tous"} onClick={() => setFilter("tous")}>Tous · {REPORTS.length}</button>
        <button type="button" aria-pressed={filter === "red"} onClick={() => setFilter("red")}>Alerte rouge · {redN}</button>
        <button type="button" aria-pressed={filter === "prog"} onClick={() => setFilter("prog")}>Programmés · {progN}</button>
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            <button type="button" aria-current={r.id === cur ? "true" : undefined} className={`rep ${r.kind}`} onClick={() => go(`/nasa/rapport/${r.id}`)}>
              <span className="rep-kind">{r.kind === "red" ? <><Icon name="error" size={14} /> Alerte rouge</> : <><Icon name="schedule" size={14} /> Programmé</>}</span>
              {r.unread && <i className="dot" aria-label="Non lu" />}
              <strong>{r.title}</strong>
              <span className="rep-meta">Généré {r.generated} · reçu {r.age}</span>
              <span className="rep-lights">
                {Object.entries(r.lights).filter(([, l]) => l !== "ok").map(([k, l]) => (
                  <span key={k} className="rep-lamp"><span className="mono">{k}</span> <Lamp l={l} compact /></span>
                ))}
                {Object.values(r.lights).every((l) => l === "ok") && <Lamp l="ok" compact />}
                <span className="rep-att">{r.images > 0 && <><Icon name="image" size={14} /> {r.images}</>}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!rows.length && <p className="r-note">Aucun rapport dans ce filtre.</p>}
    </aside>
  );
}
function savePdf(r: (typeof REPORTS)[number]) {
  const word = (l: string) => (l === "warning" ? "alerte" : l === "caution" ? "attention" : "nominal");
  downloadPdf(`${r.id}.pdf`, [
    "PULSAR AHM — rapport médical",
    `${r.id} · ${r.title}`,
    `Généré ${r.generated}`,
    `Reçu ${r.received}`,
    "",
    "Notes du médecin de bord",
    r.notes,
    "",
    "Échographies jointes",
    ...(r.studies?.length ? r.studies.map((s, i) => `${i + 1}. ${studyLine(s)}`) : ["Aucune image. Ne pas interpréter d’échographie pour cet envoi."]),
    "",
    "Équipage",
    ...CREW.map((m) => `${m.id}  ${m.name}  ${word(r.lights[m.id])}  FC ${m.hr}  TA ${m.bp}  SpO2 ${m.spo2} %`),
    "",
    "Copie générée dans le navigateur.",
  ]);
  notifyOk("PDF téléchargé", `${r.id}.pdf enregistré sur cet appareil.`);
}
function ReportSilhouette({ light }: { light: Light }) {
  const states = statesFor(light);
  const body = useZoneZoom(states, light === "ok" ? "" : "heart");
  return (
    <div className="rep-body">
      <BodyFigure states={states} sel={body.sel} onPick={body.pick} zoom={body.zoom} need={body.need} views={false} />
    </div>
  );
}
function ReportDetail({ r, go, studyId, onStudy }: { r: (typeof REPORTS)[number]; go: Go; studyId?: string; onStudy: (id: string) => void }) {
  const wf = (r.workflowStatus ?? (r.unread ? "nouveau" : "vu")) as WorkflowStatus;
  const focus = CREW.find((m) => r.lights[m.id] !== "ok") ?? CREW[0];
  return (
    <article className="rep-detail">
      <header className="rep-head"><div><h1>{r.title}</h1><Latency r={r} /><WorkflowBadge status={wf} assignee={r.assignee ?? "NASA-FS-001"} /></div><div className="btn-row"><button type="button" className="btn btn-secondary" onClick={() => savePdf(r)}><Icon name="download" size={18} /> PDF</button><button className="btn btn-primary" onClick={() => go("/nasa/reponse")}><Icon name="reply" size={18} /> Recommandation</button></div></header>
      <section className="rep-sec synth">
        <div>
          <h2><Icon name="warning" size={18} /> À retenir</h2>
          <ul className="synth-list">{CREW.filter((m) => r.lights[m.id] !== "ok").map((m) => <li key={m.id}><Lamp l={r.lights[m.id]} /><span><b>{m.name}</b> · {retainFor(m.id, m.reason, r)}</span></li>)}<li className="muted"><Lamp l="ok" compact /><span>{CREW.filter((m) => r.lights[m.id] === "ok").length} autres astronautes nominaux.</span></li></ul>
        </div>
        <ReportSilhouette key={r.id} light={r.lights[focus.id]} />
      </section>
      <section className="rep-sec"><h2><Icon name="groups" size={18} /> Résumé équipage</h2><table className="crew-table"><thead><tr><th>Astronaute</th><th>État</th><th>FC</th><th>TA</th><th>SpO₂</th><th>Sommeil</th><th>Motif</th></tr></thead><tbody>{CREW.map((m) => { const l = r.lights[m.id]; return <tr key={m.id} className={l === "ok" ? "muted" : ""}><td><span className="who"><Avatar id={m.id} l={l} /> {m.name}</span></td><td><Lamp l={l} /></td><td className="mono">{m.hr}</td><td className="mono">{m.bp}</td><td className="mono">{m.spo2}%</td><td className="mono">{m.sleep}</td><td>{l === "ok" ? "—" : m.id === "SR" ? "SpO₂ 91 % · 4 min" : m.reason}</td></tr>; })}</tbody></table><Demo /></section>
      <PredictionsSummary />
      <section className="rep-sec"><h2><Icon name="monitoring" size={18} /> Tendances depuis le dernier rapport</h2><div className="trend-grid">{TRENDS.map((t) => <div key={t.id} className="r-card"><p className="eyebrow">{t.label} · {t.unit}</p>{Object.entries(t.series).map(([k, v]) => <div key={k} className="trend-row"><span className="mono">{k}</span><Spark v={v} l={k === "LK" ? "caution" : "ok"} w={150} h={26} /><span className="mono">{String(v[v.length - 1]).replace(".", ",")}</span></div>)}</div>)}</div></section>
      <section className="rep-sec">
        <h2><Icon name="image" size={18} /> Images échographiques jointes · {r.studies?.length ?? 0}</h2>
        <EchoReview studies={r.studies ?? []} selectedId={studyId} onSelect={onStudy} />
      </section>
      <section className="rep-sec"><h2><Icon name="ink_pen" size={18} /> Notes du médecin de bord</h2><blockquote className="cmo-note"><Icon name="ink_pen" size={18} /><p>{r.notes}</p><cite>Nolan Okafor · médecin de bord</cite></blockquote></section>
    </article>
  );
}
export function NasaReply({ go }: { go: Go }) {
  const [prio, setPrio] = useState("routine");
  const dest = ["Médecin de bord", "Lina Kovacs", "Tout l’équipage"];
  const [to, setTo] = useState<string[]>(["Médecin de bord", "Lina Kovacs"]);
  const [fileOn, setFileOn] = useState(true);
  const [queued, setQueued] = useState(false);
  const [verified, setVerified] = useState(false);
  const toggleTo = (name: string) => setTo((cur) => (cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]));
  return (
    <article className="rep-detail">
      <header className="rep-head"><div><h1>Recommandation à l’équipage</h1><p className="latency"><Icon name="schedule_send" size={14} /> {queued ? "En attente du backend — liaison montante non envoyée" : `Brouillon · prochaine fenêtre ${WINDOWS.nextUp}`}</p></div></header>
      <div className="reply-grid">
        <div className="r-card form">
          <label>Destinataires<div className="seg2">{dest.map((name) => <button type="button" key={name} aria-pressed={to.includes(name)} onClick={() => toggleTo(name)}>{name}</button>)}</div></label>
          <label>Priorité<div className="seg2">{[["routine", "Routine"], ["prio", "Prioritaire"], ["urgent", "Urgent (alerte rouge)"]].map(([k, l]) => <button type="button" key={k} aria-pressed={prio === k} onClick={() => setPrio(k)}>{l}</button>)}</div></label>
          <EchoConfirm checked={verified} onChange={setVerified} />
          <label>Recommandation<textarea className="r-text tall" defaultValue={"Écho cardiaque de Lina Kovacs, coupe 4 cavités : VG 4,1 cm, dans les limites. Pas d’épanchement. L’attention reste la FC de repos.\nMaintenir repos 20 min ×2/j et hydratation.\nDécaler les tâches EVA de Lina Kovacs de 24 h.\nRemesurer FC de repos et scan fatigue demain 08:00, rapport attendu à la fenêtre de 13:50."} /></label>
          <label>Protocole joint{fileOn
            ? <div className="attach-row"><Icon name="attach_file" size={18} /> Protocole sommeil — fiche 3 <button type="button" className="icon-btn" aria-label="Retirer" onClick={() => setFileOn(false)}><Icon name="close" size={18} /></button></div>
            : <button type="button" className="btn btn-ghost sm" onClick={() => setFileOn(true)}><Icon name="attach_file" size={16} /> Joindre le protocole sommeil</button>}
          </label>
          <div className="btn-row"><SoundButton sound="reportOut" className="btn btn-primary lg" disabled={!verified || !to.length} title={verified ? undefined : "Cochez la vérification de l’examen avant l’envoi."} onClick={() => { setQueued(true); notifyBackend("Mise en file de la liaison montante vers le véhicule"); }}><Icon name="schedule_send" size={20} /> {queued ? "Toujours en attente du backend" : "Mettre en file d’envoi"}</SoundButton><button className="btn btn-secondary" onClick={() => go("/nasa/rapport/R-127-03")}>Retour au rapport</button></div>
        </div>
        <div className="r-card">
          <h3><Icon name="outbox" size={18} /> File de liaison montante</h3>
          <ul className="log"><li><span className="mono">13:50</span><span><b>Cette réponse</b> · {queued ? "bloquée, backend requis" : prio === "urgent" ? "brouillon prioritaire" : "brouillon"} · {to.length ? to.join(", ") : "aucun destinataire"}</span></li><li><span className="mono">13:50</span><span>Mise à jour planning (Ops)</span></li></ul>
          <p className="r-note">Délai radio Terre–véhicule selon l’environnement : quasi nul en orbite basse, ~1,3 s pour la Lune, 4 à 24 min pour Mars. Une réponse peut arriver après la décision prise à bord.</p>
        </div>
      </div>
    </article>
  );
}
export function NasaLink() {
  const w: [string, string, string][] = [["09:26", "10:05", "En cours"], ["13:50", "14:35", "Programmée"], ["19:10", "19:40", "Programmée"], ["J128 01:55", "02:30", "Programmée"]];
  return (<><Head title="Fenêtres de communication" sub="Les rapports arrivent automatiquement à chaque fenêtre, ou immédiatement sur alerte rouge." aside={<Demo />} />
    <div className="win-track">{w.map(([a, b, s]) => <div key={a} className={`win ${s === "En cours" ? "now" : ""}`}><span className="mono">{a} → {b}</span><strong>{s}</strong></div>)}</div>
    <div className="two-col"><Card title="Liaison actuelle" icon="cell_tower"><dl className="facts"><div><dt>État</dt><dd><Lamp l="ok" compact /> Active</dd></div><div><dt>Fin</dt><dd>{WINDOWS.linkUntil}</dd></div><div><dt>Dernier paquet</dt><dd>il y a 40 s</dd></div></dl></Card><Card title="Règles d’envoi à bord" icon="rule"><ul className="bullets"><li>Rapport résumé à chaque liaison (4×/jour)</li><li>Alerte rouge : envoi immédiat, prioritaire</li><li>Images écho jointes si le médecin de bord les attache</li></ul></Card></div></>);
}
export function NasaInbox({ id, go, view }: { id?: string; go: Go; view: string }) {
  const r = REPORTS.find((x) => x.id === id) ?? REPORTS[0];
  const studies = r.studies ?? [];
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const study = studies.find((s) => s.id === picked) ?? studies[0];
  const seen = CREW.find((m) => m.id === study?.astronautId);
  return (
    <div className={`nasa-layout n01 n01--clinic${view === "reply" || view === "link" ? " is-wide" : ""}`}>
      {(view === "inbox" || view === "report") && <ReportList cur={r.id} go={go} />}
      <div className="nasa-main">
        {view === "reply" ? <NasaReply go={go} /> : view === "link" ? <NasaLink /> : <ReportDetail r={r} go={go} studyId={study?.id} onStudy={setPicked} />}
      </div>
      {view !== "reply" && view !== "link" && (
        <aside className="nasa-extra" aria-label="Contexte sol">
          <Card title="Liaison" icon="satellite_alt">
            <p className="mono big">{WINDOWS.linkUntil}</p>
            <p className="r-note">Fin de fenêtre · suivante {WINDOWS.nextUp}</p>
            <button type="button" className="btn btn-ghost sm" onClick={() => go("/nasa/liaison")}>Détail liaison</button>
          </Card>
          <Card title="File montante" icon="outbox">
            <p>1 recommandation · départ {WINDOWS.nextUp}</p>
            <button type="button" className="btn btn-secondary sm" onClick={() => go("/nasa/reponse")}>Préparer réponse</button>
          </Card>
          <Card title="Archive" icon="history">
            <p className="mono">127 j · 498 rapports</p>
          </Card>
          <Card title="Visionneuse" icon="open_in_full" className="dual-only" aside={<Demo />}>
            {study && seen ? (
              <>
                <Probe live={false} variant={study.zone === "eye" ? "eye" : "heart"} marks={study.annotated} markLabel={study.mark} callout={false} depthCm={study.depthCm} depthLabel={`PROFONDEUR ${study.depthCm} cm · GAIN ${study.gain}`} label={`${seen.name}, ${study.view}`} />
                <p><b>{seen.name}</b> · {seen.id}</p>
                <p className="r-note">{study.view} · {study.captured}</p>
                <p className="mono">{study.measures[0] ? `${study.measures[0].value} ${study.measures[0].unit} · ${study.measures[0].verdict}` : `Clip ${study.duration} · sans mesure`}</p>
              </>
            ) : <p className="r-note">Aucune image dans ce rapport.</p>}
          </Card>
        </aside>
      )}
    </div>
  );
}
