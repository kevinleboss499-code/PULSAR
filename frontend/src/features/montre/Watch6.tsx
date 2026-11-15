import "./watch.css";
/* v6 — Montre PULSAR : écrans carrés 198×242 (watchOS) et ronds 454×454 (Wear OS).
   Principes : un regard (< 2 s), une info principale + une action, fond noir OLED,
   état = couleur + icône + mot (NASA-STD-3001 C&W), cibles ≥ 44 pt / 48 dp, retour haptique décrit. */
import { useEffect, useState } from "react";
import { Icon, Emblem, type IconName } from "@/components/ui";
import { notifyBackend, notifyOk } from "@/components/ui/noticeStore";
import { GameIcon } from "@/features/gamification/glyphs";

export type WShape = "square" | "round";
export type WView = "home" | "caution" | "warning" | "reminder" | "breathe" | "sync" | "offline" | "body" | "goals";
/** Complication gamification (CDC § 5.9) : série de régularité + objectif d’équipage. null = désactivée. */
export type WGoals = { streak: number; crew: number } | null;
export const W_VIEWS: [WView, string][] = [
  ["home", "Cadran · accueil"], ["body", "Mini silhouette"], ["caution", "Alerte orange"], ["warning", "Alerte rouge"],
  ["reminder", "Rappel de mesure"], ["breathe", "Respiration"], ["sync", "Synchro tablette"], ["offline", "Hors ligne"], ["goals", "Objectifs (complication)"],
];
const HYP = [2, 3, 2, 1, 2, 3, 3, 2, 1, 2, 3, 2]; // profondeur de sommeil (DÉMO) — barres alignées en bas

function Top({ icon, label, tone, time = "09:41" }: { icon?: IconName; label: string; tone?: "ok" | "caution" | "warning" | "muted" | "accent"; time?: string }) {
  return <div className="wt-top"><span className={`wt-lab t-${tone ?? "muted"}`}>{icon && <Icon name={icon} size={12} />}{label}</span><span className="wt-time">{time}</span></div>;
}
function Haptic({ children }: { children: string }) {
  return <p className="wt-haptic"><Icon name="vibration" size={12} /> {children}</p>;
}
function Mini({ big }: { big?: boolean }) {
  return (
    <svg className={`wt-mini ${big ? "big" : ""}`} viewBox="0 0 60 120" role="img" aria-label="Silhouette : cœur et cerveau en attention, poumons nominaux">
      <g fill="#2b3036">
        <circle cx="30" cy="12" r="9" />
        <rect x="19" y="24" width="22" height="42" rx="9" />
        <path d="M20 29 L10 62" stroke="#2b3036" strokeWidth="7" strokeLinecap="round" />
        <path d="M40 29 L50 62" stroke="#2b3036" strokeWidth="7" strokeLinecap="round" />
        <path d="M25 62 L23 113" stroke="#2b3036" strokeWidth="8.5" strokeLinecap="round" />
        <path d="M35 62 L37 113" stroke="#2b3036" strokeWidth="8.5" strokeLinecap="round" />
      </g>
      <circle cx="30" cy="10" r="4" className="d-caution" />
      <circle cx="34.5" cy="37" r="4" className="d-caution" />
      <circle cx="24.5" cy="36" r="3.2" className="d-ok" />
      <circle cx="30" cy="52" r="3.2" className="d-ok" />
    </svg>
  );
}

export function Watch6({ shape, view: initial = "home", frozen = false, goals }: { shape: WShape; view?: WView; frozen?: boolean; goals?: WGoals }) {
  const gl = goals === undefined ? { streak: 12, crew: 70 } : goals; // galerie : valeurs DÉMO
  const [view, setView] = useState<WView>(initial);
  const [sec, setSec] = useState(42);
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => { setView(initial); }, [initial]);
  useEffect(() => {
    if (frozen || view !== "breathe") return;
    const t = window.setInterval(() => setSec((s) => (s <= 0 ? 60 : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [view, frozen]);
  const go = (v: WView) => () => { setFlash(null); setView(v); };
  const phaseIn = (60 - sec) % 8 < 4;
  return (
    <div className={`wt wt-${shape} v-${view}`} data-view={view}>
      {(view === "caution" || view === "warning") && <i className={`wt-band ${view}`} aria-hidden="true" />}
      <div className="wt-in">
        {view === "home" && (<>
          <Top icon="warning" label="ATTENTION" tone="caution" />
          <button className="wt-hero" onClick={go("body")} aria-label="Pouls de repos 94 bpm, en hausse — voir la silhouette">
            <span className="wt-k"><Icon name="favorite" size={14} /> POULS REPOS</span>
            <span className="wt-big">94<small>bpm</small></span>
            <span className="wt-sub t-caution"><Icon name="arrow_upward" size={11} /> +20 en 3 j</span>
          </button>
          <button className="wt-row" onClick={go("body")} aria-label="Sommeil 5 h 10">
            <Icon name="bedtime" size={14} /><b>5h10</b><svg className="wt-hyp" viewBox="0 0 70 18" aria-hidden="true">{HYP.map((h, i) => <rect key={i} x={i * 6} y={18 - h * 6} width={4} height={h * 6} rx={1.5} />)}</svg>
          </button>
          {gl ? <button className="wt-foot wt-comp" onClick={go("goals")} aria-label={`Série ${gl.streak} jours, objectif d’équipage ${gl.crew} %`}><GameIcon name="flame" size={12} /><b>{gl.streak} j</b><GameIcon name="crew" size={12} /><b>{gl.crew} %</b><em>DÉMO</em></button>
            : <button className="wt-foot" onClick={go("sync")}><i className="dot ok" /> Tablette · 2 min <em>DÉMO</em></button>}
        </>)}

        {view === "body" && (<>
          <Top icon="accessibility_new" label="CORPS" />
          <div className="wt-bodyrow"><Mini /><ul className="wt-legend">
            <li><i className="d-caution" />Cœur<span>pouls ↑</span></li>
            <li><i className="d-caution" />Sommeil<span>5h10</span></li>
            <li><i className="d-ok" />Poumons<span>SpO₂ 97</span></li>
          </ul></div>
          <p className="wt-note">Détail sur la tablette</p>
          <button className="wt-btn ghost" onClick={go("home")}>Retour</button>
        </>)}

        {view === "caution" && (<>
          <Top icon="warning" label="ATTENTION" tone="caution" />
          <p className="wt-title">Pouls de repos élevé</p>
          <p className="wt-text">94 bpm · en hausse depuis 3 jours</p>
          <Haptic>2 impulsions · 1 fois</Haptic>
          <button className="wt-btn" onClick={go("breathe")}><Icon name="air" size={14} /> Respirer 1 min</button>
          <button className="wt-btn ghost" onClick={go("home")}>Plus tard</button>
        </>)}

        {view === "warning" && (<>
          <Top icon="error" label="ALERTE" tone="warning" />
          <p className="wt-title">Pouls 138 bpm au repos</p>
          <p className="wt-text">Asseyez-vous. Médecin de bord prévenu.</p>
          <Haptic>Répété toutes les 10 s · jusqu’à OK</Haptic>
          <button className="wt-btn red" onClick={go("home")}><Icon name="check" size={14} /> J’ai vu</button>
          <button className="wt-btn ghost" onClick={() => notifyBackend("Appel au médecin de bord depuis la montre")}><Icon name="call" size={14} /> Médecin de bord</button>
        </>)}

        {view === "reminder" && (<>
          <Top icon="event_repeat" label="RAPPEL" tone="accent" time="07:30" />
          <span className="wt-ico"><Icon name="blood_pressure" size={22} /></span>
          <p className="wt-title">Tension artérielle</p>
          <p className="wt-text">Kit tensiomètre · assise 2 min</p>
          <Haptic>1 impulsion légère</Haptic>
          <div className="wt-two"><button className="wt-btn ghost" onClick={() => { setFlash("Rappel dans 15 min"); window.setTimeout(() => { setFlash(null); setView("home"); }, 1200); }}>+15 min</button><button className="wt-btn" onClick={() => { setFlash("Mesure lancée"); notifyOk("Mesure lancée", "Le kit tension est sur la tablette, écran Kits."); window.setTimeout(() => { setFlash(null); setView("home"); }, 1200); }}>Commencer</button></div>
          {flash && <p className="wt-text" role="status">{flash}</p>}
        </>)}

        {view === "breathe" && (<>
          <Top icon="air" label="RESPIRATION" tone="accent" />
          <div className={`wt-breath ${frozen ? "" : phaseIn ? "in" : "out"}`} aria-hidden="true"><i /><i /></div>
          <p className="wt-title" aria-live="polite">{phaseIn ? "Inspirez · 4 s" : "Expirez · 4 s"}</p>
          <p className="wt-text mono">0:{String(sec).padStart(2, "0")} · cycle 3 / 6</p>
          <Haptic>Tapotement à chaque phase</Haptic>
          <button className="wt-btn ghost" onClick={go("home")}>Terminer</button>
        </>)}

        {view === "sync" && (<>
          <Top icon="bluetooth_connected" label="SYNCHRO" tone="ok" />
          <div className="wt-link"><Icon name="watch" size={20} /><i /><i /><i /><Icon name="tablet" size={20} /></div>
          <p className="wt-title">Tablette à jour</p>
          <ul className="wt-list">
            <li><Icon name="check" size={12} />Pouls<span>186 pts</span></li>
            <li><Icon name="check" size={12} />Sommeil<span>5h10</span></li>
            <li><Icon name="battery_5_bar" size={12} />Batterie<span>64 %</span></li>
          </ul>
          <p className="wt-note">il y a 2 min · cabine 2</p>
          <button className="wt-btn ghost" onClick={go("home")}>Retour</button>
        </>)}

        {view === "goals" && gl && (<>
          <Top icon="award" label="OBJECTIFS" tone="accent" />
          <span className="wt-k"><GameIcon name="flame" size={12} /> SÉRIE RÉGULARITÉ</span>
          <span className="wt-big">{gl.streak}<small>jours</small></span>
          <p className="wt-text">Équipage · mesures du jour</p>
          <span className="wt-goal"><i style={{ width: `${gl.crew}%` }} /></span>
          <p className="wt-text mono">{gl.crew} % · objectif 100 %</p>
          <button className="wt-btn ghost" onClick={go("home")}>Retour</button>
        </>)}

        {view === "offline" && (<>
          <Top icon="cloud_off" label="HORS LIGNE" tone="muted" />
          <span className="wt-ico off"><Icon name="link_off" size={22} /></span>
          <p className="wt-title">Tablette injoignable</p>
          <p className="wt-text">Depuis 38 min · 41 mesures gardées sur la montre</p>
          <p className="wt-okline"><Icon name="check_circle" size={12} /> Alertes rouges actives (vibreur)</p>
          <button className="wt-btn ghost" onClick={go("sync")}><Icon name="sync" size={14} /> Réessayer</button>
        </>)}
      </div>
      {shape === "round" && view === "home" && <svg className="wt-arc" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" /><circle className="v" cx="50" cy="50" r="48" strokeDasharray="223.2 301.6" transform="rotate(-90 50 50)" /></svg>}
      {view === "home" && <span className="wt-emb"><Emblem size={shape === "round" ? 22 : 12} /></span>}
    </div>
  );
}

/* galerie : toutes les vues, deux formats */
export function WatchGallery() {
  return (
    <div className="wt-gallery">
      <header><Emblem size={28} /><div><h1>Écrans de la montre</h1><p>Carrée 198×242 (watchOS) · ronde 454×454 (Wear OS)</p></div></header>
      {(["square", "round"] as WShape[]).map((s) => (
        <section key={s}><h2>{s === "square" ? "Montre carrée · 198×242" : "Montre ronde · 454×454"}</h2>
          <div className="wt-row-g">{W_VIEWS.map(([v, l]) => <figure key={v}><Watch6 shape={s} view={v} frozen /><figcaption>{l}</figcaption></figure>)}</div>
        </section>
      ))}
    </div>
  );
}
