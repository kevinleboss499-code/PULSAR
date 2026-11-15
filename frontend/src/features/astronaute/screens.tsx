/* Astronaute — tablette personnelle (cabine). Maquettes Figma : page « Astronaute » (1:3), écrans A01–A14.
   L’astronaute ne voit QUE ses propres données : `useMe()` renvoie le membre d’équipage de l’utilisateur connecté. */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Icon, type IconName, Emblem, Demo, Card, Lamp, PageHead as Head, WorkflowBadge, HudDial, CrewPhotoButton } from "@/components/ui";
import { notifyBackend, notifyOk } from "@/components/ui/noticeStore";
import { pushBoard } from "@/features/board/localLog";
import { BodyFigure, statesFor, useZoneZoom } from "@/components/body3d";
import { ClinicAssist, CareTimeline, StatusDonut, ZoneInsights } from "@/components/clinic";
import { useTelemetry } from "@/api";
import { FaceScan } from "./FaceScan";
import { RateScale } from "./RateScale";
import { parseSleepHours, wobble } from "./scanSim";
import { Watch6 } from "@/features/montre/Watch6";
import { WatchSection } from "@/features/montre/WatchGate";
import { useMe } from "@/features/auth/useMe";
import { useGamification, GoalsStrip } from "@/features/gamification";
import { useSound } from "@/features/sound";
import { GameIcon } from "@/features/gamification/glyphs";
import { LiveVitalsChart, RadiationChart } from "@/components/charts";
import { DataTag } from "@/app/DataSource";
import { hasWebBluetooth } from "@/features/ble/gatt";
import { useBleReading } from "@/features/ble/store";
import { BleConnect } from "@/features/ble/BleConnect";
import { SpaceWeatherCard } from "@/features/reference/SpaceWeather";
import { ConductorProvider, TimeConductor } from "@/components/telemetry";
import type { Go } from "@/app/types";
import { bpLights, glucoseLight, heartRateLight, moodLight, sleepLight, spo2Light, temperatureLight, THRESHOLDS as TH } from "@/data/thresholds";
import { useLang } from "@/i18n";

/** Accueil A01 — télémétrie SaaS clinique : vitaux + corps 3D + aide + frise + donut régularité. */
export function AstroHome({ go }: { go: Go }) {
  const { t } = useLang();
  const ME = useMe();
  const gamif = useGamification(ME.id);
  const tel = useTelemetry(ME.id, { limit: 24, intervalMs: 2000 });
  const last = tel.data?.[tel.data.length - 1];
  const hr = last?.heartRate ?? ME.hr;
  const spo2 = last ? Math.round(last.spo2) : ME.spo2;
  const hrLight = heartRateLight(hr);
  const spo2State = spo2Light(spo2);
  const sleepH = parseSleepHours(ME.sleep);
  const sleepState = sleepLight(sleepH);
  const sys = Number(ME.bp.split("/")[0]) || 120;
  const bpState = bpLights(sys, Number(ME.bp.split("/")[1]) || 80);
  const cautionHr = hrLight !== "ok";
  const zones = statesFor(ME.light);
  const body = useZoneZoom(zones, cautionHr ? "heart" : "");
  const done = gamif.enabled ? Math.min(3, 1 + (gamif.streak > 0 ? 1 : 0) + (cautionHr ? 0 : 1)) : 2;
  const left = 3 - done;

  return (
    <div className="a01 a01--clinic a01--saas">
      <section className="ops-board" aria-label="Tableau de bord personnel">
        <header className="ops-head">
          <h1>{t.dash.astro}</h1>
          <div className="ops-head-side">
            <Lamp l={ME.light} />
            <CrewPhotoButton crewId={ME.id} compact />
          </div>
        </header>

        {cautionHr && (
          <aside className="a01-alert" role="status">
            <Lamp l="caution" />
            <div>
              <p><strong>1 point d’attention</strong> — pouls de repos {hr} bpm</p>
              <p className="r-note">En hausse depuis 3 jours. Le médecin de bord est informé. <Demo /></p>
            </div>
            <button type="button" className="btn btn-ghost sm" onClick={() => go("/astronaute/silhouette")}>Pourquoi ?</button>
          </aside>
        )}

        {gamif.enabled && <GoalsStrip g={gamif} />}

        <div className="ops-split a01-dial-row" aria-label="Constantes">
          <HudDial label="Pouls" value={hr} unit="bpm" pct={hr / 130} light={hrLight} delta={cautionHr ? "+12 / 3 j" : "stable"} onSelect={() => go("/astronaute/silhouette")} />
          <HudDial label="SpO₂" value={spo2} unit="%" pct={spo2 / 100} light={spo2State} delta={spo2State === "ok" ? "nominal" : "bas"} onSelect={() => go("/astronaute/silhouette")} />
          <HudDial label="Temp." value={ME.temp} unit="°C" pct={0.55} light="ok" delta="nominal" onSelect={() => go("/astronaute/kits")} />
          <HudDial label="Tension" value={ME.bp} unit="mmHg" pct={sys / 180} light={bpState} delta={bpState === "ok" ? "ok" : "élevée"} onSelect={() => go("/astronaute/kits")} />
          <HudDial label="Sommeil" value={ME.sleep} pct={sleepH / 9} light={sleepState} delta={sleepState === "ok" ? "ok" : "court"} onSelect={() => go("/astronaute/bien-etre")} />
        </div>

        <div className="ops-split a01-ops-main">
          <section className="a01-figure" aria-labelledby="a01-sil">
            <header className="a01-card-h">
              <h2 id="a01-sil"><Icon name="accessibility_new" size={18} /> Corps</h2>
              <Demo />
            </header>
            <div className="a01-figure-stage">
              <BodyFigure states={zones} sel={body.sel} onPick={body.pick} zoom={body.zoom} need={body.need} views={false} />
            </div>
            <div className="btn-row a01-figure-actions">
              <button type="button" className="btn btn-primary sm" onClick={() => go("/astronaute/silhouette")}>
                <Icon name="accessibility_new" size={16} /> Silhouette
              </button>
              <button type="button" className="btn btn-secondary sm" onClick={() => go("/astronaute/scan")}>
                <Icon name="face" size={16} /> Scan
              </button>
              <button type="button" className="btn btn-ghost sm" onClick={() => go("/astronaute/predictions")}>
                <Icon name="insights" size={16} /> Prévisions
              </button>
            </div>
          </section>

          <ClinicAssist
            title="Aide clinique"
            onOpen={() => go("/astronaute/predictions")}
            items={[
              ...(cautionHr ? [{
                id: "hr",
                light: "caution" as const,
                title: "Pouls de repos en hausse",
                detail: `${hr} bpm · tendance 3 jours. Le médecin de bord est informé.`,
                meta: "Règle seuil · DÉMO",
              }] : [{
                id: "ok",
                light: "ok" as const,
                title: "Constantes dans les plages",
                detail: "Aucune dérive majeure détectée sur la fenêtre cabine.",
                meta: "Surveillance passive",
              }]),
              {
                id: "sleep",
                light: sleepState,
                title: sleepState === "ok" ? "Sommeil nominal" : "Sommeil court",
                detail: `${ME.sleep} · indicatif CDC ≥ 7 h · attention sous ${TH.sleep.orange} h.`,
                meta: "Routine bien-être",
              },
            ]}
          />
          <section className="a01-card" aria-labelledby="a01-todo">
            <header className="a01-card-h">
              <h2 id="a01-todo"><Icon name="checklist" size={18} /> À faire</h2>
            </header>
            <ul className="a01-todo">
              <li>
                <span className="a01-task">
                  <Icon name="bloodtype" size={18} />
                  <span><strong>Glycémie à jeun</strong><span className="mono">Aujourd’hui</span></span>
                </span>
                <button type="button" className="btn btn-primary sm" onClick={() => go("/astronaute/kits")}>Mesurer</button>
              </li>
              <li>
                <span className="a01-task">
                  <Icon name="face" size={18} />
                  <span><strong>Scan fatigue</strong><span className="mono">Caméra</span></span>
                </span>
                <button type="button" className="btn btn-secondary sm" onClick={() => go("/astronaute/scan")}>Scanner</button>
              </li>
              <li className="is-done">
                <span className="a01-task">
                  <Icon name="blood_pressure" size={18} />
                  <span><strong>Tension</strong><span className="mono">{ME.bp}</span></span>
                </span>
                <span className="a01-done"><Icon name="check_circle" size={18} /> Fait</span>
              </li>
            </ul>
          </section>
        </div>

        <div className="a01-zones">
          <ZoneInsights states={zones} onPick={body.pick} />
        </div>

        <div className="ops-split a01-ops-foot">
          <CareTimeline
            steps={[
              { id: "t1", time: "07:50", title: "Tension", detail: ME.bp, done: true, icon: "blood_pressure" },
              { id: "t2", time: "09:00", title: "Glycémie à jeun", detail: "Kit · en attente", icon: "bloodtype" },
              { id: "t3", time: "10:30", title: "Scan fatigue", detail: "Caméra tablette", icon: "face" },
              { id: "t4", time: "14:00", title: "Respiration 4-4", detail: "~5 min", icon: "self_improvement", light: cautionHr ? "caution" : "ok" },
            ]}
          />
          <StatusDonut
            title="Régularité du jour"
            center={`${done}/3`}
            slices={[
              { id: "done", label: "Fait", value: done, color: "var(--ok)" },
              { id: "left", label: "Reste", value: Math.max(0, left), color: "var(--line-strong)" },
            ]}
          />
          <section className="a01-live" aria-label="Courbe live">
            <header className="a01-card-h">
              <h2><Icon name="monitoring" size={18} /> FC · SpO₂ live</h2>
              <DataTag />
            </header>
            <ConductorProvider>
              <LiveVitalsChart astronautId={ME.id} height={112} />
            </ConductorProvider>
            <div className="btn-row">
              <button type="button" className="btn btn-secondary sm" onClick={() => go("/astronaute/montre")}><Icon name="watch" size={16} /> Montre</button>
              <button type="button" className="btn btn-primary sm" onClick={() => go("/astronaute/bien-etre")}><Icon name="play_arrow" size={16} /> Bien-être</button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export { AstroBody } from "./SilhouetteBoard";
export function AstroScan({ go }: { go: Go }) {
  const ME = useMe();
  return (
    <div className="scan-page">
      <Head title="Scan visage" />
      <aside className="resp-block" aria-label="Responsabilité">
        <div className="resp-block-top">
          <h3>Responsabilité</h3>
          <WorkflowBadge status="nouveau" assignee="CMO-001" />
        </div>
        <dl className="resp-grid">
          <div><dt>Réalisé par</dt><dd>{ME.name} · {ME.id}</dd></div>
          <div><dt>Destinataire</dt><dd>Médecin de bord (CMO-001)</dd></div>
          <div><dt>Transmission</dt><dd>Après validation</dd></div>
          <div><dt>Confidentialité</dt><dd>Équipage médical uniquement · image non enregistrée</dd></div>
        </dl>
        <p className="r-note">Le médecin de bord accuse réception et peut escalader vers le sol (NASA). <Demo /></p>
      </aside>
      <FaceScan name={ME.name} crewId={ME.id} sleep={ME.sleep} go={go} />
    </div>
  );
}
export function AstroKits() {
  const ME = useMe();
  const gami = useGamification(ME.id);
  const { play } = useSound();
  const [glu, setGlu] = useState("92");
  const [src, setSrc] = useState<"bt" | "manual">("bt");
  const [meal, setMeal] = useState<"jeun" | "repas">("jeun");
  const [sys, setSys] = useState(128);
  const [dia, setDia] = useState(82);
  const [pulse, setPulse] = useState(92);
  const reading = useBleReading();
  const liveRadio = hasWebBluetooth();
  const record = (mission: string, text: string, light: "ok" | "caution" | "warning") => {
    pushBoard({ who: ME.id, text, light });
    const fresh = gami.enabled && gami.markDone(mission);
    play("ack");
    notifyOk("Mesure enregistrée", fresh ? "Notée dans le journal médical. Régularité du jour mise à jour." : "Notée dans le journal médical de cet appareil.");
  };
  useEffect(() => {
    if (!reading) return;
    if (reading.glucoseMgDl != null) setGlu(String(reading.glucoseMgDl));
    if (reading.systolic != null) setSys(reading.systolic);
    if (reading.diastolic != null) setDia(reading.diastolic);
    if (reading.pulse != null) setPulse(reading.pulse);
    else if (reading.heartRate != null) setPulse(reading.heartRate);
  }, [reading]);
  useEffect(() => {
    if (src !== "bt" || liveRadio || reading) return;
    const tick = () => {
      setSys(wobble(128, 6, 12));
      setDia(wobble(82, 4, 15));
      setPulse(wobble(92, 5, 8));
    };
    tick();
    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, [src, liveRadio, reading]);
  const g = Number(glu);
  const fasting = meal === "jeun";
  const gluBand = fasting ? TH.glucose_fasting : TH.glucose_post;
  const gluHigh = gluBand.rougeHigh;
  const gluCaution = gluBand.orangeHigh;
  const gluWord = !g ? "Saisissez la valeur affichée sur le lecteur."
    : g < gluBand.rougeLow ? "Très basse — 15 g de sucre, prévenez le médecin de bord."
    : g < gluBand.orangeLow ? "Basse — 15 g de sucre, remesurez dans 15 min. Le médecin de bord est prévenu."
    : g > gluHigh ? "Haute — remesurez, puis prévenez le médecin de bord."
    : g > gluCaution ? (fasting ? "Au-dessus de la plage à jeun (70–99). Remesurez. Le médecin de bord est prévenu." : "Au-dessus de la plage après repas (70–140). Remesurez. Le médecin de bord est prévenu.")
    : fasting ? "Dans la plage à jeun (70–99). Routine habituelle." : "Dans la plage après repas (70–140). Routine habituelle.";
  const gluLight = glucoseLight(g, meal);
  const bpLight = bpLights(sys, dia);
  const bpWord = bpLight === "warning" ? "Tension haute — reposez-vous, puis prévenez le médecin."
    : bpLight === "caution" ? "Au-dessus de votre plage cabine."
    : "Dans la plage cabine.";
  return (
    <>
      <Head title="Mesures guidées" sub="Un kit = une carte. Lisez la valeur, enregistrez, c’est transmis au médecin de bord." />
      <BleConnect />
      <aside className="resp-block" aria-label="Responsabilité">
        <div className="resp-block-top">
          <h3>Responsabilité</h3>
          <WorkflowBadge status="nouveau" assignee="CMO-001" />
        </div>
        <dl className="resp-grid">
          <div><dt>Opérateur</dt><dd>Astronaute connecté</dd></div>
          <div><dt>Revue</dt><dd>Médecin de bord</dd></div>
          <div><dt>Dossier</dt><dd>Journal + prochain rapport sol</dd></div>
        </dl>
      </aside>
      <div className="kit-board">
        <article className="kit-card">
          <header className="kit-card-head">
            <span className="kit-ico tone-accent"><Icon name="bloodtype" size={24} /></span>
            <div>
              <h2>Glycémie</h2>
              <p>Lecteur Bluetooth · à jeun ou après repas</p>
            </div>
            <span className={reading ? "chip ok" : "chip"}><Icon name="bluetooth" size={14} /> {reading?.deviceName ?? (liveRadio ? "En attente" : "Démo")}</span>
          </header>
          <div className="kit-readout">
            <label className="kit-value">
              <span>Valeur</span>
              <input inputMode="numeric" value={glu} onChange={(e) => setGlu(e.target.value.replace(/\D/g, ""))} aria-label="Glycémie en mg/dL" />
              <small>mg/dL</small>
            </label>
            <p className="kit-status">
              {gluLight !== "ok" && <Lamp l={gluLight} compact />} {gluWord}
            </p>
            {!!g && <RateScale label="Glycémie" value={g} unit="mg/dL" min={40} max={220} caution={gluCaution} high={gluHigh} />}
          </div>
          <div className="kit-actions">
            <div className="dash-tabs" role="radiogroup" aria-label="Moment">
              <button type="button" role="radio" aria-checked={meal === "jeun"} onClick={() => setMeal("jeun")}>À jeun</button>
              <button type="button" role="radio" aria-checked={meal === "repas"} onClick={() => setMeal("repas")}>Après repas</button>
            </div>
            <button type="button" className="btn btn-primary" disabled={!g} onClick={() => record("m-glu", `Glycémie ${g} mg/dL (${meal === "jeun" ? "à jeun" : "après repas"})`, gluLight === "ok" ? "ok" : gluLight === "warning" ? "warning" : "caution")}>Enregistrer{gami.enabled ? " (+25 XP)" : ""}</button>
          </div>
        </article>

        <article className="kit-card">
          <header className="kit-card-head">
            <span className="kit-ico tone-ok"><Icon name="blood_pressure" size={24} /></span>
            <div>
              <h2>Tension</h2>
              <p>Tensiomètre · Bluetooth ou saisie</p>
            </div>
            <div className="dash-tabs" role="radiogroup" aria-label="Source">
              <button type="button" role="radio" aria-checked={src === "bt"} onClick={() => setSrc("bt")}>Bluetooth</button>
              <button type="button" role="radio" aria-checked={src === "manual"} onClick={() => setSrc("manual")}>Manuel</button>
            </div>
          </header>
          {src === "bt" ? (
            <div className="kit-readout kit-bp">
              <div>
                <span>Systolique / diastolique</span>
                <strong className="mono">{sys}<span>/</span>{dia}</strong>
                <small>mmHg · direct</small>
              </div>
              <div>
                <span>Pouls</span>
                <strong className="mono">{pulse}</strong>
                <small>bpm</small>
              </div>
              {reading ? <span className="chip ok">Mesure réelle</span> : <Demo />}
            </div>
          ) : (
            <div className="kit-readout kit-bp-manual">
              <label className="kit-value"><span>Systolique</span><input inputMode="numeric" value={String(sys)} onChange={(e) => setSys(Number(e.target.value.replace(/\D/g, "")) || 0)} aria-label="Systolique en mmHg" /><small>mmHg</small></label>
              <label className="kit-value"><span>Diastolique</span><input inputMode="numeric" value={String(dia)} onChange={(e) => setDia(Number(e.target.value.replace(/\D/g, "")) || 0)} aria-label="Diastolique en mmHg" /><small>mmHg</small></label>
            </div>
          )}
          <p className="kit-status">{bpLight !== "ok" && <Lamp l={bpLight} compact />} {bpWord}</p>
          <RateScale label="Systolique" value={sys} unit="mmHg" min={80} max={180} caution={TH.bp_systolic.orange} high={TH.bp_systolic.rouge} />
          <ol className="kit-steps">
            <li><b>1</b> Assis, bras à hauteur du cœur, 5 min de repos</li>
            <li><b>2</b> Brassard 2 cm au-dessus du coude</li>
            <li><b>3</b> Ne parlez pas pendant la mesure</li>
          </ol>
          <button type="button" className="btn btn-primary" disabled={!sys || !dia} onClick={() => record("m-bp", `Tension ${sys}/${dia} mmHg${src === "bt" ? ` · pouls ${pulse} bpm` : " · saisie manuelle"}`, bpLight)}>Enregistrer la tension</button>
        </article>

        <TempMoodCards record={record} />
      </div>
    </>
  );
}
function TempMoodCards({ record }: { record: (mission: string, text: string, light: "ok" | "caution" | "warning") => void }) {
  const reading = useBleReading();
  const [temp, setTemp] = useState("36.7");
  const [mood, setMood] = useState(4);
  useEffect(() => {
    if (reading?.temperatureC != null) setTemp(String(reading.temperatureC));
  }, [reading]);
  const c = Number(temp.replace(",", "."));
  const tempState = temperatureLight(c);
  const moodState = moodLight(mood);
  const tempWord = !Number.isFinite(c) || c <= 0
    ? "Saisissez la température en °C."
    : tempState === "warning" && c >= TH.temperature.rougeHigh
      ? "Fièvre — prise en charge par le médecin de bord, tout de suite."
      : tempState === "warning"
        ? "Température très basse — prévenir le médecin de bord, tout de suite."
        : tempState === "caution"
          ? "Hors plage 36,1–37,2 °C. Remesurez. L’astronaute et le médecin de bord sont prévenus."
          : "Dans la plage indicative (36,1–37,2 °C). Continuer la routine.";
  const moodWord = moodState === "warning"
    ? "Humeur à 1 — prévenir le médecin de bord maintenant."
    : moodState === "caution"
      ? "Humeur basse. Notez-la. Si cela dure, le médecin de bord fait le point."
      : "Humeur dans votre plage habituelle. Continuer la routine.";
  return (
    <>
      <article className="kit-card">
        <header className="kit-card-head">
          <span className="kit-ico tone-ok"><Icon name="thermometer" size={24} /></span>
          <div>
            <h2>Température</h2>
            <p>Thermomètre · saisie ou Bluetooth</p>
          </div>
          {reading?.temperatureC != null ? <span className="chip ok">Mesure réelle</span> : <Demo />}
        </header>
        <div className="kit-readout">
          <label className="kit-value">
            <span>Valeur</span>
            <input inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value.replace(/[^\d.,]/g, ""))} aria-label="Température en degrés Celsius" />
            <small>°C</small>
          </label>
          <p className="kit-status"><Lamp l={tempState} /> {tempWord}</p>
          {Number.isFinite(c) && c > 0 && (
            <RateScale label="Température" value={c} unit="°C" min={34} max={40} caution={TH.temperature.orangeHigh} high={TH.temperature.rougeHigh} />
          )}
        </div>
        <button type="button" className="btn btn-primary" disabled={!Number.isFinite(c) || c <= 0} onClick={() => record("m-temp", `Température ${c.toFixed(1)} °C`, tempState)}>Enregistrer la température</button>
      </article>
      <article className="kit-card">
        <header className="kit-card-head">
          <span className="kit-ico tone-accent"><Icon name="mood" size={24} /></span>
          <div>
            <h2>Humeur</h2>
            <p>Échelle de 1 à 5 · pas de norme médicale</p>
          </div>
          <Demo />
        </header>
        <div className="dash-tabs" role="radiogroup" aria-label="Humeur du jour, de 1 à 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={mood === n} onClick={() => setMood(n)}>{n}</button>
          ))}
        </div>
        <p className="kit-status"><Lamp l={moodState} /> {moodWord}</p>
        <p className="r-note">1 très basse · 5 très bonne. Comparée à vos jours habituels. <Demo /></p>
        <button type="button" className="btn btn-primary" onClick={() => record("m-mood", `Humeur ${mood}/5`, moodState)}>Enregistrer l’humeur</button>
      </article>
    </>
  );
}

const WELL_ITEMS: { icon: IconName; title: string; time: string; why: string; kind: "breath" | "sleep" | "ared" | "mind" | "call"; seconds?: number; mission?: string }[] = [
  { icon: "air", title: "Respiration 4-4", time: "5 min", why: "Calme le pouls avant le sommeil", kind: "breath", seconds: 5 * 60, mission: "r-breath" },
  { icon: "bedtime", title: "Routine de sommeil", time: "10 min", why: "Lumière ambrée, écran éteint 30 min avant", kind: "sleep", seconds: 10 * 60 },
  { icon: "fitness_center", title: "Résistance (ARED)", time: "30 min", why: "Protège os et muscles en microgravité", kind: "ared", seconds: 30 * 60, mission: "r-ex" },
  { icon: "groups", title: "Appel famille", time: "Fenêtre 13:50", why: "Isolement et confinement", kind: "call" },
  { icon: "spa", title: "Pleine conscience", time: "8 min", why: "Humeur et concentration", kind: "mind", seconds: 8 * 60 },
];

export function AstroWellbeing() {
  const ME = useMe();
  const gami = useGamification(ME.id);
  const { play } = useSound();
  const [run, setRun] = useState<{ id: string; title: string; left: number; total: number; mission?: string; breath?: boolean } | null>(null);

  const ended = useRef(false);
  useEffect(() => { ended.current = false; }, [run?.id]);
  useEffect(() => {
    if (!run || run.left <= 0) return;
    const id = window.setInterval(() => setRun((r) => (r ? { ...r, left: r.left - 1 } : r)), 1000);
    return () => window.clearInterval(id);
  }, [run?.id]);

  const finish = (done: boolean) => {
    if (!run || ended.current) return;
    ended.current = true;
    const mission = run.mission;
    const title = run.title;
    setRun(null);
    if (!done && run.left > 0) return;
    const fresh = !!mission && gami.enabled && gami.markDone(mission);
    if (fresh) play("badge");
    notifyOk("Séance terminée", fresh ? `${title} — routine cochée pour la régularité du jour.` : `${title} — notée sur cet appareil.`);
    pushBoard({ who: ME.id, light: "ok", text: `Bien-être · ${title} · séance terminée` });
  };

  useEffect(() => {
    if (run && run.left <= 0) finish(true);
  }, [run?.left]);

  const start = (item: (typeof WELL_ITEMS)[number]) => {
    if (item.kind === "call") {
      notifyBackend("Appel famille (liaison vers la Terre)");
      return;
    }
    setRun({ id: item.kind, title: item.title, left: item.seconds ?? 60, total: item.seconds ?? 60, mission: item.mission, breath: item.kind === "breath" });
  };

  const phaseIn = run?.breath ? Math.floor((run.total - run.left) / 4) % 2 === 0 : true;
  const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      <Head title="Vos exercices du jour" sub="Choisis selon votre sommeil, votre humeur et votre planning." />
      <div className="well-hero r-card">
        <div className={`breath-dot${run?.breath ? (phaseIn ? " is-in" : " is-out") : ""}`} aria-hidden="true"><Icon name={run ? "air" : "air"} size={36} /></div>
        {run ? (
          <div>
            <h2>{run.title}</h2>
            <p className="session-time" aria-live="polite">{clock(Math.max(0, run.left))}</p>
            <p>{run.breath ? (phaseIn ? "Inspirez · 4 s" : "Expirez · 4 s") : "La séance tourne sur cet appareil."}</p>
          </div>
        ) : (
          <div>
            <h2>Respiration 4-4 · 5 min</h2>
            <p>Inspirez 4 s, expirez 4 s. La montre suit votre pouls pendant l’exercice. Son uniquement en cas d’alerte. <Demo /></p>
          </div>
        )}
        {run
          ? <button type="button" className="btn btn-primary lg" onClick={() => finish(true)}><Icon name="stop" size={18} /> Terminer</button>
          : <button type="button" className="btn btn-primary lg" onClick={() => start(WELL_ITEMS[0])}><Icon name="play_arrow" /> Commencer</button>}
      </div>
      <ul className="well-list">{WELL_ITEMS.map((item) => (
        <li key={item.title}>
          <button type="button" className="well-pick r-card" aria-pressed={run?.id === item.kind} onClick={() => start(item)}>
            <Icon name={item.icon} size={28} /><strong>{item.title}</strong><span className="mono">{item.time}</span><p>{item.why}</p>
          </button>
        </li>
      ))}</ul>
      <p className="r-note"><GameIcon name="flame" size={16} /> Série : {gami.enabled ? `${gami.streak} jours` : "gamification désactivée"} · <Demo /></p>
    </>
  );
}
export function AstroWatch() {
  const ME = useMe();
  const gamif = useGamification(ME.id);
  const reading = useBleReading();
  const wg = gamif.enabled ? { streak: gamif.streak, crew: gamif.crew.pct } : null;
  return (
    <WatchSection crewId={ME.id}>
      {(watch) => (
        <>
          <Head title="Synchronisation" aside={<span className="watch-linked"><span className="chip ok"><Icon name="bluetooth_connected" size={16} /> Connectée</span><button type="button" className="btn btn-ghost sm" onClick={watch.disconnect}>Déconnecter</button></span>} />
          <ConductorProvider><TimeConductor />
          <div className="two-col">
            <Card title="Pouls et SpO₂ · temps réel" icon="favorite" aside={<DataTag />}>
              {reading && <p className="r-note">Bluetooth · {reading.deviceName}{reading.heartRate != null ? ` · ${reading.heartRate} bpm` : ""}{reading.spo2 != null ? ` · SpO₂ ${reading.spo2} %` : ""} · mesure réelle</p>}
              <LiveVitalsChart astronautId={ME.id} />
            </Card>
            <Card title="Sommeil (automatique)" icon="bedtime" aside={<Demo />}><div className="kpis one"><div><strong>{ME.sleep}</strong><span>nuit dernière · objectif 7 h</span><svg className="hypno" viewBox="0 0 240 48" preserveAspectRatio="none" aria-hidden="true">{[3, 2, 1, 2, 3, 2, 1, 1, 2, 3, 2, 3].map((h, i) => <rect key={i} x={i * 20 + 2} y={48 - h * 14} width={16} height={h * 14} rx={2} />)}</svg></div></div></Card>
            <Card title="Rayonnement · dosimètre" icon="radiology" aside={<DataTag />}><RadiationChart astronautId={ME.id} /></Card>
            <SpaceWeatherCard />
            <Card title="Aperçu de la montre (interactif)" icon="watch" aside={<Demo />}><div className="watch-prev"><Watch6 shape="square" goals={wg} /><Watch6 shape="round" view="caution" goals={wg} /></div><p className="muted small">Touchez le pouls pour la mini-silhouette, l’alerte pour la respiration.</p></Card>
            <Card title="Historique de synchro" icon="sync">
              <ul className="log">{[["09:39", "Synchro auto · 186 points de pouls"], ["07:12", "Nuit importée · 5h10"], ["J126 22:40", "Synchro auto · 1 040 points"]].map(([t, x]) => <li key={t}><span className="mono">{t}</span>{x}</li>)}</ul>
              <Link className="btn btn-ghost" to="/astronaute/montre/ecrans">Voir les écrans de la montre <Icon name="arrow_forward" size={18} /></Link>
            </Card>
          </div></ConductorProvider>
        </>
      )}
    </WatchSection>
  );
}
export function AstroReminders({ go }: { go: Go }) {
  const rows: [string, IconName, string, boolean, string | null][] = [
    ["07:30", "blood_pressure", "Tension (kit)", true, null],
    ["07:45", "bloodtype", "Glycémie à jeun", false, "/astronaute/kits"],
    ["08:00", "face", "Scan fatigue", false, "/astronaute/scan"],
    ["12:30", "mood", "Humeur", false, "/astronaute/kits"],
    ["18:00", "fitness_center", "Résistance ARED", false, "/astronaute/bien-etre"],
    ["21:30", "thermometer", "Température", false, "/astronaute/kits"],
  ];
  const next = rows.findIndex((r) => !r[3]);
  return (
    <>
      <Head title="Routine de la journée" sub="Alignée sur le planning de mission. La montre vibre à l’heure prévue." />
      <ol className="timeline">{rows.map(([t, , l, d, to], i) => (
        <li key={t} className={d ? "is-done" : i === next ? "is-now" : ""}>
          <span className="tl-mark" aria-hidden="true">{d ? <Icon name="check" size={16} /> : null}</span>
          <span className="mono">{t}</span>
          <strong>{l}</strong>
          {d ? <span className="visually-hidden">Fait</span> : (
            <button type="button" className="btn btn-secondary sm" onClick={() => (to ? go(to) : notifyBackend(`Mesure « ${l} » (capteur)`))}>Faire</button>
          )}
        </li>
      ))}</ol>
    </>
  );
}
/* Mode bras (sortie / EVA) : 4 actions géantes, utilisables avec des gants */
export function ArmMode({ go }: { go: Go }) {
  const ME = useMe();
  return (
    <main className="arm">
      <header><Emblem size={36} /><Lamp l={ME.light} /><span className="mono">{ME.hr} BPM</span><button className="arm-x" onClick={() => go("/astronaute")} aria-label="Quitter le mode bras"><Icon name="close" size={28} /></button></header>
      <div className="arm-grid">
        <button type="button" onClick={() => go("/astronaute/kits")}><Icon name="favorite" size={44} /><strong>Mes constantes</strong></button>
        <button type="button" onClick={() => go("/astronaute/bien-etre")}><Icon name="air" size={44} /><strong>Respirer</strong></button>
        <button type="button" onClick={() => go("/astronaute/rappels")}><Icon name="notifications" size={44} /><strong>Rappels</strong></button>
        <button type="button" className="arm-sos" onClick={() => notifyBackend("Appel au médecin de bord")}><Icon name="emergency" size={44} /><strong>Appeler le médecin de bord</strong></button>
      </div>
    </main>
  );
}
