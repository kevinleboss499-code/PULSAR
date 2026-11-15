/* Lecture échographique côté Houston : identité, coupe et mesure sur la même pièce,
   pour ne pas confondre un clip, un autre astronaute ou une autre zone. */
import { Demo, Lamp, Avatar } from "@/components/ui";
import type { EchoStudy, Light } from "@/data/types";
import { CREW, REPORTS } from "@/data/demo/crew";
import { Probe } from "@/features/medecin-bord/Probe";

type ReportLike = { id?: string; lights: Record<string, Light>; studies?: EchoStudy[] };

export function retainFor(memberId: string, reason: string, report: ReportLike): string {
  if (memberId === "SR" && report.lights[memberId] === "warning") {
    return "SpO₂ 91 % pendant 4 min, remesurée à 98 % — événement clos à bord.";
  }
  const still = report.studies?.find((s) => s.astronautId === memberId && s.kind === "still");
  if (!still) return reason;
  const measure = still.measures[0];
  const read = measure
    ? `${measure.label} ${measure.value} ${measure.unit}, ${measure.verdict.toLowerCase()} (${measure.range}).`
    : still.finding;
  return `${reason} — ${still.view} jointe. ${read} Avis demandé.`;
}

export function studyLine(study: EchoStudy): string {
  const who = CREW.find((m) => m.id === study.astronautId);
  const kind = study.kind === "clip" ? `clip ${study.duration ?? ""}`.trim() : "image fixe";
  const measure = study.measures[0];
  const read = measure
    ? `${measure.label} ${measure.value} ${measure.unit}, ${measure.verdict.toLowerCase()} (${measure.range})`
    : "sans mesure";
  return `${who?.name ?? study.astronautId} (${study.astronautId}) · ${kind} · ${study.view} · ${study.captured} · ${read}`;
}

function depthOf(study: EchoStudy) {
  return `${study.depthCm} cm`;
}

export function EchoReview({
  studies,
  selectedId,
  onSelect,
}: {
  studies: EchoStudy[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const study = studies.find((s) => s.id === selectedId) ?? studies[0];
  return (
    <div data-testid="echo-review">
      <p className="r-note">Aide à la lecture, pas un diagnostic. <Demo /></p>
      {!study ? (
        <p className="r-note">Aucune image dans ce rapport. Ne pas interpréter d’échographie pour cet envoi.</p>
      ) : (
        <div className="echo-review">
          <ul className="echo-pick" aria-label="Pièces échographiques">
            {studies.map((item) => {
              const who = CREW.find((m) => m.id === item.astronautId);
              const measure = item.measures[0];
              return (
                <li key={item.id}>
                  <button type="button" aria-pressed={item.id === study.id} onClick={() => onSelect(item.id)}>
                    <span className="echo-kind">{item.kind === "clip" ? `Clip ${item.duration}` : "Image fixe"}</span>
                    <strong>{who?.name ?? item.astronautId}</strong>
                    <span>{item.view}</span>
                    <span className="mono">{measure ? `${measure.value} ${measure.unit}` : "Sans mesure"} · {item.captured}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <StudyOpen study={study} />
        </div>
      )}
    </div>
  );
}

function StudyOpen({ study }: { study: EchoStudy }) {
  const member = CREW.find((m) => m.id === study.astronautId);
  const kind = study.kind === "clip" ? `Clip ${study.duration}` : "Image fixe";
  const measure = study.measures[0];
  return (
    <div className="echo-stage">
      <div>
        <div className={`echo-frame ${study.quality === "ok" ? "ok" : ""}`}>
          <Probe
            live={false}
            variant={study.zone === "eye" ? "eye" : "heart"}
            marks={study.annotated}
            markLabel={study.mark}
            callout={false}
            depthCm={study.depthCm}
            depthLabel={`PROFONDEUR ${depthOf(study)} · GAIN ${study.gain}`}
            label={`Échographie simulée, ${member?.name ?? study.astronautId}, ${study.view}, ${kind}`}
          />
          <span className="echo-badge">{kind}</span>
        </div>
        <p className="echo-cap">
          <b>{member?.name}</b> · {member?.id} · {member?.cabin}
          <span>{study.view} · {study.captured}</span>
        </p>
      </div>
      <div className="echo-dossier" data-testid="echo-dossier">
        {member && (
          <div className="echo-who">
            <Avatar id={member.id} />
            <div>
              <strong>{member.name}</strong>
              <span className="mono">{member.id} · {member.role} · {member.cabin}</span>
            </div>
          </div>
        )}
        <dl className="facts">
          <div><dt>Coupe</dt><dd>{study.view}</dd></div>
          <div><dt>Type</dt><dd>{kind}</dd></div>
          <div><dt>Acquisition</dt><dd className="mono">{study.captured}</dd></div>
          <div><dt>Opérateur</dt><dd>{study.operator}</dd></div>
          <div><dt>Préréglage</dt><dd>{study.preset}</dd></div>
          <div><dt>Profondeur</dt><dd className="mono">{depthOf(study)}</dd></div>
          <div><dt>Gain</dt><dd className="mono">{study.gain}</dd></div>
          <div><dt>Qualité</dt><dd><Lamp l={study.quality} compact /> {study.qualityLabel}</dd></div>
        </dl>
        {measure ? (
          <div className="echo-measure">
            <p className="eyebrow">Mesure retenue</p>
            <p className="echo-measure-name">{measure.label}</p>
            <p className="mono echo-measure-val">{measure.value} {measure.unit}</p>
            <p>Limites <span className="mono">{measure.range}</span></p>
            <p><Lamp l={measure.light} compact /> {measure.verdict}</p>
          </div>
        ) : (
          <p className="r-note">Aucune mesure sur ce clip. Ne pas relever de diamètre ici : la mesure est sur l’image fixe de la même coupe.</p>
        )}
        <p>{study.finding}</p>
        {study.legend && <p className="echo-legend">{study.legend}</p>}
      </div>
    </div>
  );
}

/** Rappel verrouillé avant la recommandation du rapport R-127-03. */
export function EchoConfirm({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const report = REPORTS.find((r) => r.id === "R-127-03");
  const still = report?.studies?.find((s) => s.kind === "still");
  const member = CREW.find((m) => m.id === still?.astronautId);
  const measure = still?.measures[0];
  if (!still || !member || !measure) return null;
  return (
    <div className="echo-target" data-testid="echo-target">
      <p><b>{member.name}</b> · {member.id} · {member.cabin}</p>
      <p>{still.view} · image fixe · {still.captured}</p>
      <p>{measure.label} <span className="mono">{measure.value} {measure.unit}</span> · {measure.verdict.toLowerCase()} ({measure.range})</p>
      <p className="r-note">Le clip de 6 s de la même coupe ne porte pas de mesure.</p>
      <label className="echo-confirm">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>J’ai vérifié l’identité, la coupe et la mesure ci-dessus avant l’envoi.</span>
      </label>
    </div>
  );
}
