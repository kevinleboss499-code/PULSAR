/* Silhouette 3D de la page d’accueil (chargée à la demande) : cliquer une zone affiche sa fonction. */
import { BodyFigure, statesFor, useZoneZoom, zoneBrief } from "@/components/body3d";
import { REGIONS } from "@/data/demo/regions";

export default function BodyDemo() {
  const states = statesFor("caution");
  const body = useZoneZoom(states, "heart");
  const reg = REGIONS.find((r) => r.id === body.sel) ?? REGIONS[0];
  return (
    <div className="lp-body">
      <BodyFigure states={states} sel={body.sel} onPick={body.pick} zoom={body.zoom} need={body.need ?? zoneBrief(states, reg.id)} />
      <div className="lp-body-info" aria-live="polite"><p className="eyebrow">{reg.label}</p><p>{reg.fn}</p></div>
    </div>
  );
}
