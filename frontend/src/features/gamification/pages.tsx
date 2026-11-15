/* Pages astronaute : /astronaute/objectifs (équipage + XP) et /astronaute/reglages.
   Carte médecin : participation équipage (sans classement).
   Layout bento desktop — régularité uniquement (CDC EF-42/43/44), tokens PULSAR. */
import { Navigate } from "react-router";
import { Card, Icon, PageHead as Head, Avatar, Demo } from "@/components/ui";
import { GameIcon } from "./glyphs";
import { useMe } from "@/features/auth/useMe";
import { SoundSettingsPanel } from "@/features/sound";
import { useGamification, useCrewGamificationSnapshot } from "./store";
import { palierFor } from "./data";
import { BadgesCard, CrewGoalBar, EthicsNote, MissionsCard, RegularityTiles, StreakCard } from "./components";

export function AstroGoals() {
  const ME = useMe();
  const g = useGamification(ME.id);
  const crew = useCrewGamificationSnapshot();
  if (!g.enabled) return <Navigate to="/astronaute/reglages" replace state={{ gamifOff: true }} />;

  const first = ME.name.split(" ")[0];
  const palier = palierFor(crew.goal.pct);

  return (
    <>
      <Head
        title="Objectifs"
        sub="Missions du jour, insignes spatiaux et niveau de constance. Le palier d’équipage est commun."
        aside={<span className="xp-chip"><GameIcon name="bolt" size={16} /> {g.xp} XP</span>}
      />

      <section className="goals-welcome" aria-label="Bienvenue">
        <div className="goals-welcome__text">
          <h2>Bonjour, {first}</h2>
          <p className="r-note">Suivez vos défis de mesure et de routine. La cagnotte XP sert l’objectif commun de l’équipage. <Demo /></p>
        </div>
        <ul className="goals-welcome__widgets">
          <li className="gw-profile">
            <Avatar id={ME.id} />
            <div>
              <strong>{ME.name}</strong>
              <span className="mono">{ME.cabin}</span>
            </div>
          </li>
          <li className="gw-chip">
            <GameIcon name="medal" size={16} />
            <span>Niveau <b>{g.grade.current.label}</b></span>
          </li>
          <li className="gw-chip">
            <GameIcon name="flame" size={16} />
            <span>Série <b className="mono">{g.streak} j</b></span>
          </li>
          <li className="gw-chip">
            <GameIcon name="crew" size={16} />
            <span>Équipage <b className="mono">{crew.goal.pct} %</b></span>
          </li>
        </ul>
      </section>

      <div className="goals-bento">
        <StreakCard g={g} className="goals-bento__streak" />
        <RegularityTiles g={g} />
        <MissionsCard g={g} className="goals-bento__challenges" />
        <BadgesCard g={g} className="goals-bento__badges" />

        <section className="crew-xp-board goals-bento__crew" aria-label="Équipage">
          <div className="crew-xp-head">
            <div>
              <h2>Tous ensemble</h2>
              <p className="r-note">Palier commun <b>{palier.label}</b> — {palier.detail} Ordre des cabines : le niveau se lit, il ne trie personne. <Demo /></p>
            </div>
            <div className="crew-pool">
              <span>Cagnotte équipage</span>
              <strong className="mono">{crew.poolXp}</strong>
              <small>XP · régularité</small>
            </div>
          </div>
          <p className="goal-line"><b className="mono">{crew.goal.pct} %</b> des mesures du jour <span className="muted mono">({crew.goal.done}/{crew.goal.total})</span></p>
          <CrewGoalBar pct={crew.goal.pct} />
          <ul className="crew-xp-list">
            {crew.members.map((m) => (
              <li key={m.id} className={m.id === ME.id ? "is-me" : undefined}>
                <Avatar id={m.id} />
                <div>
                  <strong>{m.name}{m.id === ME.id ? " · vous" : ""}</strong>
                  <span>{m.cabin} · niveau {m.grade}</span>
                </div>
                <div className="crew-xp-meta">
                  <b className="mono">{m.xp} XP</b>
                  <span className="mono">{m.done}/{m.total} mesures</span>
                </div>
                {m.done === m.total ? <Icon name="check_circle" size={18} /> : <span className="chip">En cours</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <EthicsNote />
    </>
  );
}

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id: string }) {
  return (
    <button id={id} type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)}>
      <i />
    </button>
  );
}

export function AstroSettings() {
  const ME = useMe();
  const g = useGamification(ME.id);
  return (
    <>
      <Head title="Réglages" />
      <Card title="Gamification" glyph={<GameIcon name="medal" />}>
        <div className="setting">
          <div><label htmlFor="gamif-switch"><b>Séries, XP, badges et objectifs d’équipage</b></label>
            <p className="r-note">Basés uniquement sur la régularité. Désactivée : Objectifs, bandeau et complication montre disparaissent.</p></div>
          <Switch id="gamif-switch" checked={g.enabled} onChange={g.setEnabled} label="Gamification" />
        </div>
        <p className="mono small" aria-live="polite">{g.enabled ? "Activée" : "Désactivée"}</p>
      </Card>
      <Card title="Confidentialité" icon="lock">
        <p className="r-note">Vos valeurs de santé ne sont visibles que par vous, le médecin de bord et la NASA. Jamais comparées.</p>
      </Card>
      <Card title="Son" icon="volume_up">
        <p className="r-note">Alarmes dans l’app (bandeau). Pause rouge 2 min seulement après lecture.</p>
        <SoundSettingsPanel />
      </Card>
    </>
  );
}

/** Médecin de bord : participation équipage + XP (sans classement). */
export function CrewParticipationCard() {
  const { goal, members, poolXp } = useCrewGamificationSnapshot();
  return (
    <Card title="Objectif d’équipage · participation" glyph={<GameIcon name="crew" />}>
      <p className="goal-line"><b className="mono">{goal.pct} %</b> des mesures · palier <b>{palierFor(goal.pct).label}</b> · cagnotte <b className="mono">{poolXp} XP</b></p>
      <CrewGoalBar pct={goal.pct} />
      <ul className="participation">
        {members.map((m) => (
          <li key={m.id}>
            <Avatar id={m.id} />
            <span>{m.name}</span>
            <span className="mono">{m.done}/{m.total}</span>
            <span className="mono">{m.xp} XP</span>
            {m.done === m.total ? <Icon name="check_circle" size={16} /> : <span className="muted small">en cours</span>}
          </li>
        ))}
      </ul>
      <p className="r-note">Ordre fixe (cabines). Participation et XP de régularité uniquement (CDC EF-43, EF-44).</p>
    </Card>
  );
}
