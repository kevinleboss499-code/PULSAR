/* Interface du son : bandeau d’alarmes (visuel toujours présent), panneau de réglages (dans l’app / bandeau — pas d’icône chrome). */
import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/ui";
import { useSound, type Alarm } from "./SoundProvider";
import { CATEGORY_LABEL, LOCKED, SILENT, SNOOZE_MS, setCategory, type SoundCategory } from "./settings";
import { SOUND_LABEL, type SoundId } from "./engine";

const LVL = { rouge: { cls: "warning", icon: "error", word: "Alerte" }, orange: { cls: "caution", icon: "warning", word: "Attention" }, info: { cls: "info", icon: "info", word: "Info" } } as const;

function Countdown({ until }: { until: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(i); }, []);
  const s = Math.max(0, Math.round((until - now) / 1000));
  return <span className="mono">{Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}</span>;
}

function AlarmRow({ a }: { a: Alarm }) {
  const { acknowledge, snooze, markSeen } = useSound();
  const l = LVL[a.level];
  const paused = a.snoozedUntil != null && a.snoozedUntil > Date.now();
  const canSnooze = a.level === "orange" || (a.level === "rouge" && a.seen);
  useEffect(() => { if (!a.seen) markSeen(a.id); }, [a.id, a.seen, markSeen]);
  return (
    <motion.li layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`alarm alarm-${l.cls}`} data-level={a.level} data-seen={a.seen ? "1" : "0"} role={a.level === "rouge" ? "alert" : "status"}>
      <span className={`lamp lamp-${l.cls === "info" ? "ok" : l.cls}`}><Icon name={l.icon} size={16} /><b>{l.word}</b></span>
      <span className="alarm-txt">
        <b>{a.title}</b>
        {a.detail && <small className="mono">{a.detail}</small>}
        {paused && <small className="alarm-snd" aria-live="polite"><Icon name="volume_off" size={12} /> Pause <Countdown until={a.snoozedUntil!} /></small>}
      </span>
      <span className="btn-row">
        {a.level !== "info" && !paused && canSnooze && <button type="button" className="btn btn-ghost sm" onClick={() => snooze(a.id)} aria-label={`Pause ${SNOOZE_MS / 60000} min`}><Icon name="snooze" size={16} /><span className="hide-sm">Pause</span></button>}
        <button type="button" className="btn btn-primary sm" onClick={() => acknowledge(a.id)}><Icon name="check" size={16} /> Acquitter</button>
      </span>
    </motion.li>
  );
}

/** Bandeau compact (1 alerte prioritaire + compteur) — style patient monitor / MCC. */
export function AlarmBanner() {
  const { alarms, unlocked } = useSound();
  const [cfg, setCfg] = useState(false);
  const [openAll, setOpenAll] = useState(false);
  if (!alarms.length && !cfg) return null;
  const ranked = [...alarms].sort((a, b) => (a.level === "rouge" ? 0 : 1) - (b.level === "rouge" ? 0 : 1));
  const shown = openAll ? ranked : ranked.slice(0, 1);
  const more = ranked.length - shown.length;
  return (
    <section className="alarm-banner" aria-label="Alarmes et son">
      {!!shown.length && <ul><AnimatePresence initial={false}>{shown.map((a) => <AlarmRow key={a.id} a={a} />)}</AnimatePresence></ul>}
      {more > 0 && (
        <button type="button" className="btn btn-ghost sm" onClick={() => setOpenAll(true)}>
          + {more} autre{more > 1 ? "s" : ""} alarme{more > 1 ? "s" : ""}
        </button>
      )}
      {openAll && ranked.length > 1 && (
        <button type="button" className="btn btn-ghost sm" onClick={() => setOpenAll(false)}>Réduire</button>
      )}
      {!unlocked && !!alarms.length && <p className="alarm-unlock"><Icon name="volume_off" size={14} /> Touchez l’écran pour activer le son. <button type="button" className="btn btn-ghost sm" data-testid="sound-settings-open" onClick={() => setCfg(true)}>Réglages</button></p>}
      {(unlocked || cfg) && (
        <div className="alarm-cfg">
          <button type="button" className="btn btn-ghost sm" data-testid="sound-settings-open" aria-expanded={cfg} onClick={() => setCfg((v) => !v)}>
            {cfg ? "Fermer les réglages du son" : "Réglages du son"}
          </button>
          <AnimatePresence>
            {cfg && (
              <motion.div className="sound-inline" role="dialog" aria-label="Réglages du son" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <SoundSettingsPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

/** Panneau de réglages du son (persistant) — pages Réglages ou bandeau. */
export function SoundSettingsPanel({ demo = true }: { demo?: boolean }) {
  const { settings: s, update, play, raise } = useSound();
  const vid = useId();
  const cats = (Object.keys(CATEGORY_LABEL) as SoundCategory[]).filter((c) => !SILENT.includes(c));
  return (
    <div className="sound-panel" data-testid="sound-panel">
      <div className="setting">
        <div><b>Sourdine générale</b><p className="r-note">N’affecte pas l’alarme rouge / extrême (un seul bip à l’apparition, puis silence). Pas de son hors connexion. Orange et le reste : muets.</p></div>
        <button type="button" role="switch" aria-checked={s.muted} aria-label="Sourdine" className="switch" data-testid="sound-mute" onClick={() => update({ ...s, muted: !s.muted })}><i /></button>
      </div>
      <div className="setting">
        <label htmlFor={vid}><b>Volume</b></label>
        <input id={vid} type="range" min={0} max={100} step={5} value={Math.round(s.volume * 100)} style={{ ["--pct" as string]: `${Math.round(s.volume * 100)}%` }} onChange={(e) => update({ ...s, volume: Number(e.target.value) / 100 })} aria-valuetext={`${Math.round(s.volume * 100)} %`} data-testid="sound-volume" />
        <span className="mono">{Math.round(s.volume * 100)} %</span>
      </div>
      <fieldset className="sound-cats">
        <legend className="eyebrow">Son d’alerte</legend>
        <p className="r-note">Seul le rouge / extrême sonne. Orange, notifications, fatigue modérée et navigation restent muets.</p>
        {cats.map((c) => {
          const locked = LOCKED.includes(c);
          return (
            <label key={c} className={locked ? "locked" : ""}>
              <input type="checkbox" checked={s.categories[c]} disabled={locked || SILENT.includes(c)} onChange={(e) => update(setCategory(s, c, e.target.checked))} data-cat={c} />
              <span>{CATEGORY_LABEL[c]}{locked && <small> · toujours active (acquitter ou pause 2 min après vu)</small>}</span>
            </label>
          );
        })}
      </fieldset>
      {demo && (
        <details className="sound-tests">
          <summary>Écouter l’alarme rouge</summary>
          <div className="btn-row">
            <button type="button" className="btn btn-ghost sm" onClick={() => play("alarmHigh")}>{SOUND_LABEL.alarmHigh}</button>
            <button type="button" className="btn btn-ghost sm" onClick={() => play("fatiguePim")}>{SOUND_LABEL.fatiguePim}</button>
            <button className="btn btn-secondary sm" data-testid="sound-test-red" onClick={() => raise({ id: `TEST-${Date.now()}`, level: "rouge", title: "Test d’alarme rouge", detail: "Simulation (DÉMO) — acquittez pour arrêter" })}><Icon name="error" size={16} /> Simuler une alarme rouge</button>
          </div>
        </details>
      )}
    </div>
  );
}

/** Accès aux réglages son depuis la barre d’outils (état muet visible). */
export function SoundMenu() {
  const { settings } = useSound();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onPtr = (e: PointerEvent) => {
      const wrap = document.querySelector(".sound-menu-wrap");
      const t = e.target as Node | null;
      if (wrap && t && !wrap.contains(t)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPtr);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPtr);
    };
  }, [open]);
  const muted = settings.muted;
  return (
    <div className="sound-menu-wrap">
      <button
        type="button"
        className={`tool-btn${open ? " is-open" : ""}${muted ? " is-muted" : ""}`}
        data-testid="sound-menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={muted ? "volume_off" : "volume_up"} size={16} />
        <span>Son</span>
        {muted && <small className="tool-btn__meta">Sourdine</small>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="sound-menu-pop"
            role="dialog"
            aria-label="Réglages du son"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <header className="sound-menu-pop__head">
              <Icon name="volume_up" size={18} />
              <div>
                <b>Réglages du son</b>
                <p>Alarmes IEC · la rouge reste active</p>
              </div>
            </header>
            <SoundSettingsPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Bouton qui joue un son d’événement au clic. */
export function SoundButton({ sound, onClick, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { sound: SoundId }) {
  const { play } = useSound();
  return <button {...rest} onClick={(e) => { play(sound); onClick?.(e); }}>{children}</button>;
}
