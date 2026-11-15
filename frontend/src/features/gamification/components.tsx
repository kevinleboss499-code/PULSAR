/* Gamification coopérative (CDC § 5.9) : série de régularité, missions du jour, objectif d’équipage, badges.
   Sobre : pas de confettis, pas de glow ; animations Motion discrètes (respect de prefers-reduced-motion). */
import { Link } from "react-router";
import { motion } from "motion/react";
import { Card, Icon } from "@/components/ui";
import { BADGE_FAMILIES, gradeHint } from "./data";
import { badgeGlyph, GameIcon, type GameIconName } from "./glyphs";
import type { useGamification } from "./store";
import { useSound } from "@/features/sound";

type G = ReturnType<typeof useGamification>;

const WEEKDAY = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const XP_PER_MISSION = 25;

/** Calendrier hebdomadaire (7 jours) : coché / en cours / manqué — régularité uniquement. */
export function StreakWeek({ g }: { g: G }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const ago = 6 - i;
    const d = new Date(today);
    d.setDate(today.getDate() - ago);
    const ok = ago === 0 ? g.measuresComplete : !g.missedDaysAgo.includes(ago) && ago <= g.streak;
    return {
      ago,
      label: WEEKDAY[d.getDay()],
      date: d.getDate(),
      ok,
      today: ago === 0,
    };
  });
  return (
    <ol className="streak-week" aria-label="Régularité des 7 derniers jours">
      {days.map((d) => (
        <li key={d.ago} className={d.ok ? "ok" : d.today ? "today" : "miss"} title={d.today ? "Aujourd’hui" : `Il y a ${d.ago} j`}>
          <span className="sw-label">{d.label}</span>
          <span className="sw-mark" aria-hidden="true">
            {d.ok ? <Icon name="check" size={14} /> : d.today ? null : null}
          </span>
          <span className="sw-date mono">{d.date}</span>
          <span className="visually-hidden">
            {d.today ? "Aujourd’hui" : `Il y a ${d.ago} jours`} : {d.ok ? "toutes les mesures faites" : d.today ? "en cours" : "incomplet"}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Historique compact 14 jours (sous le calendrier). */
export function StreakDays({ g }: { g: G }) {
  const days = Array.from({ length: 14 }, (_, i) => 13 - i);
  return (
    <ol className="streak-days" aria-label="Régularité des 14 derniers jours">
      {days.map((d) => {
        const ok = d === 0 ? g.measuresComplete : !g.missedDaysAgo.includes(d) && d <= g.streak;
        return (
          <li key={d} className={ok ? "ok" : d === 0 ? "today" : "miss"} title={d === 0 ? "Aujourd’hui" : `Il y a ${d} j`}>
            <span className="visually-hidden">{d === 0 ? "Aujourd’hui" : `Il y a ${d} jours`} : {ok ? "toutes les mesures faites" : d === 0 ? "en cours" : "incomplet"}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function StreakCard({ g, className }: { g: G; className?: string }) {
  return (
    <Card title="Série de régularité" glyph={<GameIcon name="flame" />} className={className}>
      <div className="streak-hero">
        <p className="streak-big">
          <motion.b key={g.streak} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>{g.streak}</motion.b>
          {" "}jours de suite
        </p>
        <p className="r-note">{g.measuresComplete ? "Toutes les mesures du jour sont faites : la série continue." : "Faites toutes les mesures du jour pour prolonger la série."}</p>
      </div>
      <StreakWeek g={g} />
      <p className="eyebrow streak-hist-label">14 derniers jours</p>
      <StreakDays g={g} />
    </Card>
  );
}

/** Tuiles bento de régularité — jamais de valeurs de santé (EF-42). */
export function RegularityTiles({ g }: { g: G }) {
  const missionsDone = g.missions.filter((m) => m.done).length;
  const badgesGot = g.badges.filter((b) => b.value >= b.goal).length;
  const tiles = [
    { id: "missions", icon: <GameIcon name="missions" size={18} />, label: "Missions du jour", value: `${missionsDone}/${g.missions.length}`, hint: "mesures + routines" },
    { id: "xp", icon: <GameIcon name="bolt" size={18} />, label: "XP régularité", value: `${g.xp}`, hint: "+25 / mission · +5 / jour de série" },
    { id: "badges", icon: <GameIcon name="medal" size={18} />, label: "Badges obtenus", value: `${badgesGot}/${g.badges.length}`, hint: "jalons de constance" },
    { id: "crew", icon: <GameIcon name="crew" size={18} />, label: "Objectif équipage", value: `${g.crew.pct} %`, hint: `${g.crew.done}/${g.crew.total} mesures` },
  ] as const;
  return (
    <ul className="goals-metrics" aria-label="Indicateurs de régularité">
      {tiles.map((t) => (
        <li key={t.id} className="goals-metric">
          <span className="gm-ico">{t.icon}</span>
          <span className="gm-label">{t.label}</span>
          <strong className="gm-value mono">{t.value}</strong>
          <span className="gm-hint">{t.hint}</span>
        </li>
      ))}
    </ul>
  );
}

export function MissionsCard({ g, className }: { g: G; className?: string }) {
  const n = g.missions.filter((m) => m.done).length;
  const pct = Math.round((n / g.missions.length) * 100);
  const { play } = useSound();
  return (
    <Card
      title="Défis du jour"
      glyph={<GameIcon name="missions" />}
      aside={<span className="chip mono" data-testid="missions-count">{n}/{g.missions.length}</span>}
      className={className}
    >
      <p className="goal-line challenges-progress">
        <b className="mono">{pct} %</b> complété
      </p>
      <CrewGoalBar pct={pct} />
      <ul className="missions">
        {g.missions.map((m) => (
          <motion.li layout key={m.id} className={m.done ? "done" : ""}>
            <button type="button" role="checkbox" aria-checked={m.done} onClick={() => { if (g.toggle(m.id)) play("badge"); }}>
              <span className="mi-box">{m.done && <Icon name="check" size={16} />}</span>
              <Icon name={m.icon} size={18} />
              <span className="mi-body">
                <span className="mi-label">{m.label}</span>
                <span className="mi-kind mono">{m.kind === "mesure" ? "mesure" : "routine"} · {m.when}</span>
              </span>
              <span className="mi-xp mono">{m.done ? "fait" : `+${XP_PER_MISSION} XP`}</span>
            </button>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}

export function CrewGoalBar({ pct }: { pct: number }) {
  return <span className="goal-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Objectif d’équipage"><motion.i initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.35, ease: "easeOut" }} /></span>;
}

export function CrewGoalCard({ g }: { g: G }) {
  return (
    <Card title="Objectif d’équipage" glyph={<GameIcon name="crew" />}>
      <p className="goal-line"><b className="mono">{g.crew.pct} %</b> des mesures du jour faites par l’équipage <span className="muted mono">({g.crew.done}/{g.crew.total})</span></p>
      <CrewGoalBar pct={g.crew.pct} />
      <p className="r-note">Objectif commun : 100 % avant 21:00. Chacun y contribue ; aucun classement individuel.</p>
    </Card>
  );
}

/** Médaille plate : disque + ruban. Le symbole passe en encre d’accent quand l’insigne est obtenu. */
function Medal({ name, goal, showCount }: { name: GameIconName; goal: number; earned: boolean; showCount: boolean }) {
  return (
    <span className="bd-medal">
      <svg viewBox="0 0 80 108" aria-hidden="true">
        <path className="bd-ribbon" d="M28 58 H52 V104 L40 90 L28 104 Z" />
        <circle className="bd-disc" cx="40" cy="34" r="30" />
        <circle className="bd-inner" cx="40" cy="34" r="23" />
      </svg>
      <span className="bd-mark">
        {showCount ? <b className={goal >= 100 ? "mono bd-num bd-num--long" : "mono bd-num"}>{goal}</b> : <GameIcon name={name} size={26} />}
      </span>
    </span>
  );
}

export function BadgesCard({ g, className }: { g: G; className?: string }) {
  return (
    <Card title="Insignes de mission" glyph={<GameIcon name="medal" />} className={className}>
      <div className="grade-block">
        <p className="grade-now">Niveau <b>{g.grade.current.label}</b></p>
        <p className="r-note">{gradeHint(g.grade)}</p>
        <ol className="grade-steps" aria-label="Niveaux de constance">
          {g.grade.levels.map((level) => (
            <li key={level.id} className={g.grade.earned >= level.min ? "got" : ""} aria-current={level.id === g.grade.current.id ? "step" : undefined}>
              {level.label}
            </li>
          ))}
        </ol>
      </div>
      <div className="badge-groups">
        {BADGE_FAMILIES.map((family) => (
          <section key={family.id} aria-label={family.label}>
            <p className="eyebrow">{family.label}</p>
            <ul className="badges">
              {g.badges.filter((b) => b.family === family.id).map((b) => {
                const got = b.value >= b.goal;
                const pct = b.goal === 0 ? 0 : b.value / b.goal;
                return (
                  <li key={b.id} className={got ? "got" : pct > 0 ? "is-on" : ""} data-earned={got}>
                    <Medal name={badgeGlyph(b.id)} goal={b.goal} earned={got} showCount={b.family === "serie"} />
                    <b>{b.label}</b>
                    <span className="bd-detail">{b.detail}</span>
                    <span className="bd-prog">{got ? <><Icon name="check_circle" size={14} /> Obtenu</> : <span className="mono">{b.value}/{b.goal}</span>}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  );
}

export function EthicsNote() {
  return (
    <p className="disclaimer" role="note"><Icon name="verified_user" size={16} /><span><b>Règles :</b> séries et badges ne dépendent que de la régularité (mesures faites, routines suivies), jamais de vos valeurs de santé. Aucune comparaison entre membres. Vous pouvez désactiver la gamification dans <Link to="/astronaute/reglages">Réglages</Link>.</span></p>
  );
}

/** Bandeau compact pour l’accueil astronaute. */
export function GoalsStrip({ g }: { g: G }) {
  const n = g.missions.filter((m) => m.done).length;
  return (
    <Link className="goals-strip" to="/astronaute/objectifs" data-testid="goals-strip">
      <span><GameIcon name="bolt" size={16} /> <b className="mono">{g.xp} XP</b></span>
      <span><GameIcon name="medal" size={16} /> Niveau <b>{g.grade.current.label}</b></span>
      <span><GameIcon name="flame" size={16} /> Série <b className="mono">{g.streak} j</b></span>
      <span><GameIcon name="missions" size={16} /> Missions <b className="mono">{n}/{g.missions.length}</b></span>
      <span><GameIcon name="crew" size={16} /> Équipage <b className="mono">{g.crew.pct} %</b></span>
      <Icon name="chevron_right" size={16} />
    </Link>
  );
}
