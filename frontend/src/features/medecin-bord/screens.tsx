/* Médecin de bord — tablette médicale / écran d’infirmerie + sonde d’échographie.
   Maquettes Figma : page « Médecin de bord » (1:4), écrans M01–M11. Voit TOUT l’équipage. */
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName, Demo, Card, Lamp, Spark, Avatar, PageHead as Head, WorkflowBadge, HudDial, CrewPhotoButton } from "@/components/ui";
import { notifyBackend, notifyOk } from "@/components/ui/noticeStore";
import { BodyFigure, ZoneLegend, statesFor, useZoneZoom, zoneBrief } from "@/components/body3d";
import { ClinicAssist, CareTimeline, StatusDonut, ZoneInsights } from "@/components/clinic";
import { CREW, ECHO_ZONES, ECHO_STEPS, TRENDS, WINDOWS } from "@/data/demo/crew";
import type { Light, Member } from "@/data/types";
import type { Go } from "@/app/types";
import { Probe } from "./Probe";
import { EchoDock, useEchoExam } from "./EchoDock";
import { AiAlerts } from "./AiAlerts";
import { SoundButton } from "@/features/sound";
import { CrewParticipationCard } from "@/features/gamification";
import { LiveVitalsChart, RadiationChart } from "@/components/charts";
import { ConductorProvider, TimeConductor } from "@/components/telemetry";
import { AstronautLad } from "@/features/predictions";
import { DataTag } from "@/app/DataSource";
import { SpaceWeatherCard } from "@/features/reference/SpaceWeather";
import { pushBoard, useJournal } from "@/features/board/localLog";
import { bpLights, spo2Light } from "@/data/thresholds";
import { useLang } from "@/i18n";
const SEV: Record<Light, number> = { ok: 0, caution: 1, warning: 2 };
function CrewTile({ m, go }: { m: Member; go: Go }) {
  const spark = TRENDS[0].series[m.id] ?? [m.hr];
  return (
    <button type="button" className={`crew-tile t-${m.light}`} onClick={() => go(`/medecin-bord/dossier/${m.id}`)}>
      <div className="ct-top">
        <Avatar id={m.id} l={m.light} />
        <div><strong>{m.name}</strong><span className="mono">{m.id} · {m.role}</span></div>
        <Lamp l={m.light} />
      </div>
      <p>{m.reason}</p>
      <div className="ct-metrics">
        <dl>
          <div><dt>FC</dt><dd>{m.hr}<small>bpm</small></dd></div>
          <div><dt>SpO₂</dt><dd>{m.spo2}<small>%</small></dd></div>
          <div><dt>TA</dt><dd>{m.bp}</dd></div>
          <div><dt>Sommeil</dt><dd>{m.sleep}</dd></div>
        </dl>
        <Spark v={spark} l={m.light} w={88} h={28} />
      </div>
      <span className="ct-sync"><Icon name="watch" size={14} /> {m.sync}</span>
    </button>
  );
}
export function CmoBoard({ go }: { go: Go }) {
  const { t } = useLang();
  const events = useJournal();
  const n = (l: Light) => CREW.filter((m) => m.light === l).length;
  const priority = [...CREW].sort((a, b) => SEV[b.light] - SEV[a.light])[0];
  const sys = Number(priority.bp.split("/")[0]) || 120;
  const zones = statesFor(priority.light);
  const body = useZoneZoom(zones, priority.light === "ok" ? "" : "heart", priority.id);
  return (
    <div className="m01 m01--clinic m01--saas">
      <section className="ops-board" aria-label="Surveillance équipage">
        <header className="ops-head">
          <h1>{t.dash.cmo}</h1>
          <div className="lamp-sum"><Lamp l="ok" /><b className="mono">{n("ok")}</b><Lamp l="caution" /><b className="mono">{n("caution")}</b><Lamp l="warning" /><b className="mono">{n("warning")}</b><Demo /></div>
        </header>

        <div className={`ops-split m01-patient${priority.light !== "ok" ? " is-priority" : ""}`} aria-label={`Priorité ${priority.name}`}>
          <div className="m01-patient-profile">
            <Avatar id={priority.id} l={priority.light} />
            <div>
              <h2>{priority.name}</h2>
              <p className="mono">{priority.id} · {priority.role} · {priority.cabin}</p>
              <Lamp l={priority.light} />
              <WorkflowBadge status="vu" assignee="CMO-001" />
            </div>
            <p className="m01-patient-reason">{priority.reason}</p>
            <div className="btn-row">
              <button type="button" className="btn btn-primary" onClick={() => go(`/medecin-bord/dossier/${priority.id}`)}>Dossier</button>
              <button type="button" className="btn btn-secondary" onClick={() => go("/medecin-bord/echographie/1")}><Icon name="monitor_heart" size={16} /> Écho</button>
              <button type="button" className="btn btn-ghost" onClick={() => go(`/medecin-bord/predictions/${priority.id}`)}>Prévisions</button>
            </div>
          </div>
          <div className="m01-patient-dials" aria-label="Constantes prioritaires">
            <HudDial label="Pouls" value={priority.hr} unit="bpm" pct={priority.hr / 130} light={priority.light} />
            <HudDial label="SpO₂" value={priority.spo2} unit="%" pct={priority.spo2 / 100} light={spo2Light(priority.spo2)} />
            <HudDial label="Temp." value={priority.temp} unit="°C" pct={0.55} light="ok" />
            <HudDial label="Tension" value={priority.bp} unit="mmHg" pct={sys / 180} light={bpLights(sys, Number(priority.bp.split("/")[1]) || 80)} />
          </div>
          <div className="m01-patient-body">
            <BodyFigure states={zones} sel={body.sel} onPick={body.pick} zoom={body.zoom} need={body.need} views={false} />
            <ZoneInsights states={zones} onPick={body.pick} />
            <Demo />
          </div>
        </div>

        <div className="ops-split m01-ops-mid">
          <ClinicAssist
            title="Aide clinique"
            onOpen={() => go(`/medecin-bord/predictions/${priority.id}`)}
            items={[
              {
                id: "prio",
                light: priority.light,
                title: priority.light === "ok" ? "Aucun cas prioritaire" : `Focus · ${priority.id}`,
                detail: priority.reason,
                meta: `Dérive · ${priority.sync}`,
              },
              {
                id: "link",
                light: "ok",
                title: "Liaison sol ouverte",
                detail: `Fenêtre jusqu’à ${WINDOWS.linkUntil} · prochaine montante ${WINDOWS.nextUp}.`,
                meta: "MCC Houston",
              },
            ]}
            footer={<div className="clinic-assist-embed"><AiAlerts astronautId={priority.id} /></div>}
          />
          <StatusDonut
            title="Flux équipage"
            center={`${CREW.length}`}
            slices={[
              { id: "ok", label: "Nominaux", value: n("ok"), color: "var(--ok)" },
              { id: "caution", label: "Attention", value: n("caution"), color: "var(--medium)" },
              { id: "warning", label: "Alerte", value: n("warning"), color: "var(--high)" },
            ]}
          />
          <CareTimeline
            title="Plan de soins · priorité"
            steps={[
              { id: "c1", time: "09:05", title: "Écho cardiaque", detail: `${priority.id} · faite`, done: true, icon: "monitor_heart" },
              { id: "c2", time: "09:38", title: "Revue FC repos", detail: `${priority.hr} bpm`, light: priority.light, icon: "vital_signs" },
              { id: "c3", time: "10:00", title: "Hydratation + repos", detail: "500 mL · 20 min", icon: "self_improvement" },
              { id: "c4", time: WINDOWS.nextUp, title: "Rapport sol", detail: "File montante", icon: "satellite_alt" },
            ]}
          />
        </div>

        <div className="ops-split cmo-layout">
          <div className="crew-grid m01-grid" role="list">
            {[...CREW].sort((a, b) => SEV[b.light] - SEV[a.light]).map((m) => <CrewTile key={m.id} m={m} go={go} />)}
          </div>
          <aside className="cmo-side">
            <Card title="Journal" icon="history">
              <ul className="log log--dense">{events.slice(0, 6).map((e) => <li key={e.t + e.text}><span className="mono">{e.t}</span><Lamp l={e.light} compact /><span><b>{e.who}</b> · {e.text}</span></li>)}</ul>
              <button type="button" className="btn btn-ghost sm" onClick={() => go("/medecin-bord/journal")}>Journal complet</button>
            </Card>
            <CrewParticipationCard />
            <SpaceWeatherCard />
          </aside>
        </div>
      </section>
    </div>
  );
}
export function CmoCrew({ id, go }: { id?: string; go: Go }) {
  const m = CREW.find((c) => c.id === id) ?? CREW[1];
  const zones = statesFor(m.light);
  const body = useZoneZoom(zones, m.light === "ok" ? "" : "heart", m.id);
  return (
    <>
      <Head title={m.name} sub={m.role} aside={<div className="btn-row"><Lamp l={m.light} /><button className="btn btn-secondary" onClick={() => go(`/medecin-bord/predictions/${m.id}`)}><Icon name="insights" size={18} /> Prédictions</button><button className="btn btn-primary" onClick={() => go("/medecin-bord/echographie/1")}><Icon name="monitor_heart" size={18} /> Examen échographique</button></div>} />
      <div className="dossier-photo">
        <Avatar id={m.id} l={m.light} />
        <div>
          <CrewPhotoButton crewId={m.id} />
        </div>
      </div>
      <nav className="crew-tabs" aria-label="Autres membres">{CREW.map((c) => <button key={c.id} aria-current={c.id === m.id ? "page" : undefined} onClick={() => go(`/medecin-bord/dossier/${c.id}`)}><Avatar id={c.id} l={c.light} />{c.name.split(" ")[0]}</button>)}</nav>
      <div className="crew-detail">
        <Card title="Constantes" icon="vital_signs" aside={<Demo />}>
          <div className="vit">{([["FC repos", `${m.hr} bpm`, TRENDS[0].series[m.id]], ["Sommeil", m.sleep, TRENDS[1].series[m.id]], ["Humeur", `${m.mood}/5`, TRENDS[2].series[m.id]]] as [string, string, number[]][]).map(([l, v, s]) => <div key={l}><span>{l}</span><strong>{v}</strong><Spark v={s} l={m.light} /></div>)}
            <div><span>Tension</span><strong>{m.bp}</strong></div><div><span>SpO₂</span><strong>{m.spo2} %</strong></div><div><span>Température</span><strong>{m.temp} °C</strong></div></div>
        </Card>
        <Card title="Silhouette 3D" icon="accessibility_new"><BodyFigure states={zones} sel={body.sel} onPick={body.pick} zoom={body.zoom} need={body.need} /><ZoneLegend /></Card>
        <CmoNotes m={m} />
      </div>
      <ConductorProvider>
      <TimeConductor />
      <div className="two-col crew-live">
        <Card title="Capteurs · temps réel" icon="monitor_heart" aside={<DataTag />} className="dense"><LiveVitalsChart astronautId={m.id} /></Card>
        <Card title="Dernières valeurs disponibles" icon="monitoring" className="dense"><AstronautLad astronautId={m.id} /></Card>
        <Card title="Alertes du modèle (dérive)" icon="notification_important" aside={<DataTag />} className="dense"><AiAlerts astronautId={m.id} /></Card>
        <Card title="Rayonnement · dosimètre" icon="radiology" aside={<DataTag />} className="dense"><RadiationChart astronautId={m.id} height={130} /></Card>
      </div>
      </ConductorProvider>
    </>
  );
}
const ECHO_PREP: { icon: IconName; title: string; text: string }[] = [
  { icon: "accessibility_new", title: "Patient", text: "Sanglé au poste médical, torse dégagé." },
  { icon: "tablet", title: "Tablette", text: "Fixée sur le bras articulé." },
  { icon: "videocam", title: "Enregistrement", text: "Vidéo activée pour le sol." },
];

export function CmoEcho({ step: s0, go }: { step?: string; go: Go }) {
  const asked = Math.min(6, Math.max(1, Number(s0) || 1));
  const { exam, patch, reset } = useEchoExam();
  const step = Math.min(asked, exam.reached);
  const [zone, setZone] = useState(exam.zone);
  const [tool, setTool] = useState<IconName>("edit");
  const z = ECHO_ZONES.find((x) => x.id === zone) ?? ECHO_ZONES[0];
  const checksOk = exam.checks.every(Boolean);
  const noteOk = exam.note.trim().length > 0;
  useEffect(() => {
    if (asked !== step) go(`/medecin-bord/echographie/${step}`);
  }, [asked, step, go]);

  const pickZone = (id: string) => {
    if (!ECHO_ZONES.some((x) => x.id === id)) return;
    setZone(id);
    patch({ zone: id });
  };
  const toggleCheck = (i: number) => {
    const checks = [...exam.checks] as [boolean, boolean, boolean];
    checks[i] = !checks[i];
    patch({ checks });
  };
  const ready = exam.linked && (step === 1 ? checksOk : step === 3 ? exam.placed : step === 5 ? noteOk : true);
  const linking = step === 1 && !exam.linked;
  const hint = !exam.linked
    ? "Reliez la sonde (USB-C) avant de passer à l’étape suivante."
    : step === 1 && !checksOk
      ? "Cochez les trois points de la checklist cabine."
      : step === 1
        ? "Liaison établie. Vous pouvez choisir la zone."
        : step === 2
          ? `Zone retenue : ${z.label}.`
          : step === 3 && !exam.placed
            ? "Confirmez que la sonde est en place."
            : step === 3
              ? "Sonde en place. L’image peut s’afficher."
              : step === 4
                ? "Capturez l’image avant d’annoter."
                : step === 5 && !noteOk
                  ? "Ajoutez un commentaire avant de joindre l’image."
                  : step === 5
                    ? "Le commentaire part avec les images."
                    : `Liaison sol active jusqu’à ${WINDOWS.linkUntil}.`;
  const goStep = (n: number) => {
    patch({ reached: Math.max(exam.reached, n) });
    go(`/medecin-bord/echographie/${n}`);
  };
  const send = () => {
    pushBoard({ who: "NO", light: "ok", text: "Échographie · Lina Kovacs · images jointes au dossier local" });
    notifyBackend("Envoi du rapport au sol (liaison satellite)");
    reset();
    go("/medecin-bord/journal");
  };
  const tools: { id: IconName; label: string }[] = [
    { id: "straighten", label: "Règle" },
    { id: "arrow_forward", label: "Flèche" },
    { id: "edit", label: "Trait" },
    { id: "label", label: "Étiquette" },
  ];
  const primaryLabel = ["Continuer", "Guider le positionnement", "Voir l’image", "Capturer", "Joindre au dossier", "Envoyer avec le rapport"][step - 1];
  return (
    <div className="echo-flow">
      <header className="echo-top">
      <Head title={["Connecter la sonde", "Choisir la zone", "Positionnement guidé", "Image en direct", "Annoter", "Joindre et envoyer"][step - 1]} aside={<Lamp l="caution" />} />
      <WorkflowBadge status={step >= 6 ? "resolu" : step >= 4 ? "pris_en_charge" : step >= 2 ? "vu" : "nouveau"} assignee="CMO-001" />
      <ol className="stepper" aria-label="Étapes de l’examen">{ECHO_STEPS.map((l, i) => {
        const n = i + 1;
        const locked = n > exam.reached;
        const done = n < exam.reached && n !== step;
        return (
          <li key={l} className={done ? "done" : n === step ? "now" : ""}>
            <button type="button" aria-current={n === step ? "step" : undefined} disabled={locked} title={locked ? "Terminez l’étape en cours avant d’avancer." : undefined} onClick={() => go(`/medecin-bord/echographie/${n}`)}>
              <span>{done ? <Icon name="check" size={14} /> : n}</span>{l}
            </button>
          </li>
        );
      })}</ol>
      </header>
      <div className="echo-flow-body">
      {step === 1 && (
        <div className="echo-work is-even">
          <Card title="Sonde portable" icon="link" aside={exam.linked ? <span className="chip ok"><Icon name="check_circle" size={14} /> Reliée</span> : <span className="chip"><Icon name="link_off" size={14} /> En attente</span>}>
            <dl className="facts">
              <div><dt>Connexion</dt><dd>{exam.linked ? "USB-C · tablette médicale" : "Non reliée"}</dd></div>
              <div><dt>Batterie sonde</dt><dd>{exam.linked ? <>{exam.battery} % <Demo /></> : "—"}</dd></div>
              <div><dt>Préréglage</dt><dd>Cardiaque · 2–4 MHz</dd></div>
              <div><dt>Gel</dt><dd>Sachet stérile · fixer le patient (sangles)</dd></div>
            </dl>
          </Card>
          <Card title="Avant de commencer" icon="checklist">
            <ul className="echo-prep">
              {ECHO_PREP.map((item, i) => (
                <li key={item.title} data-on={exam.checks[i] ? "true" : "false"}>
                  <label>
                    <input type="checkbox" checked={exam.checks[i]} onChange={() => toggleCheck(i)} />
                    <span className="echo-prep-ic" aria-hidden="true"><Icon name={item.icon} size={20} /></span>
                    <span>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="r-note">Checklist cabine — à cocher avant de continuer.</p>
          </Card>
        </div>
      )}
      {step === 2 && (<div className="echo-work is-even"><Card title="Zone d’examen" icon="accessibility_new"><BodyFigure states={statesFor("caution")} sel={zone} onPick={pickZone} zoom need={zoneBrief(statesFor("caution"), zone)} /></Card><Card title={z.label} icon="target"><ul className="zone-list">{ECHO_ZONES.map((x) => <li key={x.id}><button aria-pressed={x.id === zone} onClick={() => pickZone(x.id)}><strong>{x.label}</strong><span>{x.why}</span></button></li>)}</ul></Card></div>)}
      {step === 3 && (
        <div className="echo-work is-even">
          <Card title="Où poser la sonde" icon="target">
            <BodyFigure states={statesFor("caution")} sel={zone} probe views={false} zoom need={zoneBrief(statesFor("caution"), zone)} initial={["kidneys", "muscles"].includes(zone) ? "back" : "front"} />
          </Card>
          <Card title={`${z.label} · consigne`} icon="pan_tool">
            <p className="big-line">{z.probe}</p>
            <ol className="steps">
              <li>Inclinez doucement jusqu’à voir les 4 cavités</li>
              <li>Gardez la sonde immobile 3 s</li>
              <li>Le cadre devient cyan quand l’image est exploitable</li>
            </ol>
            <label className="echo-confirm">
              <input type="checkbox" checked={exam.placed} onChange={() => patch({ placed: !exam.placed })} />
              <span>Sonde posée selon la consigne, patient immobile.</span>
            </label>
          </Card>
        </div>
      )}
      {step === 4 && (
        <div className="echo-work">
          <div className="echo-stage-img">
            <div className="echo-frame ok"><Probe /><span className="rec"><i /> EN DIRECT · 00:42</span></div>
          </div>
          <div className="echo-modules">
            <Card title="Contrôles" icon="tune">
              <dl className="facts">
                <div><dt>Zone</dt><dd>{z.label}</dd></div>
                <div><dt>Profondeur</dt><dd>14 cm</dd></div>
                <div><dt>Gain</dt><dd>52 %</dd></div>
                <div><dt>Qualité</dt><dd><Lamp l="ok" compact /> Exploitable</dd></div>
              </dl>
            </Card>
            <Card title="Enregistrement" icon="videocam">
              <p className="r-note">Clip de 6 s joint au dossier, en plus de l’image capturée.</p>
              <button type="button" className="btn btn-secondary" onClick={() => notifyBackend("Enregistrement d’un clip de 6 s (sonde d’échographie)")}>Enregistrer un clip 6 s</button>
            </Card>
          </div>
        </div>
      )}
      {step === 5 && (
        <div className="echo-work">
          <div className="echo-stage-img">
            <div className="echo-frame"><Probe live={false} marks /></div>
          </div>
          <div className="echo-modules">
            <Card title="Outils" icon="ink_pen">
              <div className="tools">{tools.map((t) => <button type="button" key={t.id} className="icon-btn" aria-label={t.label} aria-pressed={tool === t.id} onClick={() => setTool(t.id)}><Icon name={t.id} /></button>)}</div>
              <p className="r-note">Outil {tools.find((t) => t.id === tool)?.label} — repère posé sur l’image de démo.</p>
            </Card>
            <Card title="Commentaire" icon="edit_note">
              <textarea className="r-text" value={exam.note} aria-label="Commentaire" onChange={(e) => patch({ note: e.target.value })} />
            </Card>
          </div>
        </div>
      )}
      {step === 6 && (
        <div className="echo-work is-even">
          <Card title="Pièces jointes" icon="attach_file">
            <div className="thumbs"><Probe live={false} marks /><Probe live={false} /></div>
            <p className="r-note">2 images + 1 clip · dossier de Lina Kovacs · <Demo /></p>
          </Card>
          <Card title="Envoi au sol" icon="outbox">
            <dl className="facts">
              <div><dt>Destinataire</dt><dd>Chirurgiens de vol · MCC Houston</dd></div>
              <div><dt>Liaison</dt><dd><Icon name="satellite_alt" size={14} /> Active jusqu’à {WINDOWS.linkUntil}</dd></div>
              <div><dt>Délai estimé</dt><dd>~14 min (bande passante)</dd></div>
            </dl>
            <p className="r-note">Si la liaison tombe, l’envoi part à la prochaine fenêtre ({WINDOWS.nextUp}).</p>
          </Card>
        </div>
      )}
      </div>
      <EchoDock linked={exam.linked} battery={exam.battery} hint={hint} onBack={step > 1 ? () => go(`/medecin-bord/echographie/${step - 1}`) : undefined}>
        {step === 6 ? (
          <SoundButton sound="reportOut" className="btn btn-primary" disabled={!ready} title={ready ? undefined : hint} onClick={send}><Icon name="send" size={18} /> {primaryLabel}</SoundButton>
        ) : (
          <button type="button" className="btn btn-primary" disabled={!linking && !ready} title={!linking && !ready ? hint : undefined} onClick={() => (linking ? patch({ linked: true }) : ready && goStep(step + 1))}>
            <Icon name={linking ? "link" : step === 4 ? "photo_camera" : "arrow_forward"} size={18} />
            {linking ? "Établir la liaison" : primaryLabel}
          </button>
        )}
      </EchoDock>
    </div>
  );
}
export function CmoLog() {
  const events = useJournal();
  return (<><Head title="Événements de l’équipage" /><Card title="Aujourd’hui · J127" icon="history"><ul className="log">{events.map((e) => <li key={e.t + e.text}><span className="mono">{e.t}</span><Lamp l={e.light} compact /><span><b>{e.who}</b> · {e.text}</span></li>)}</ul></Card></>);
}

function CmoNotes({ m }: { m: Member }) {
  const key = `pulsar.cmo-note.${m.id}`;
  const fallback = m.light === "ok" ? "" : "Tachycardie de repos modérée, sommeil court. Écho cardiaque prévue. Repos 20 min + hydratation 500 mL.";
  const [text, setText] = useState(() => localStorage.getItem(key) ?? fallback);
  const [forId, setForId] = useState(m.id);
  const dirty = useRef(false);
  if (forId !== m.id) {
    setForId(m.id);
    dirty.current = false;
    setText(localStorage.getItem(`pulsar.cmo-note.${m.id}`) ?? (m.light === "ok" ? "" : "Tachycardie de repos modérée, sommeil court. Écho cardiaque prévue. Repos 20 min + hydratation 500 mL."));
  }
  return (
    <Card title="Notes du médecin de bord" icon="ink_pen">
      <textarea
        className="r-text"
        value={text}
        aria-label="Notes"
        onChange={(e) => { setText(e.target.value); dirty.current = true; localStorage.setItem(key, e.target.value); }}
        onBlur={() => { if (!dirty.current) return; dirty.current = false; notifyOk("Note enregistrée", "Conservée sur cet appareil. Elle partira avec le prochain rapport quand le backend sera branché."); }}
      />
      <p className="r-note">Les notes restent sur cet appareil. L’envoi au sol part avec le backend.</p>
    </Card>
  );
}
