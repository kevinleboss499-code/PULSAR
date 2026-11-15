/* Silhouette santé 3D (MakeHuman CC0). Rendu WebGL interactif (Body3D, chargé à la demande) ;
   en mode capture (Figma / captures d’écran, ?capture=1 en dev) : image fixe pré-rendue + zones HTML. */
import { lazy, Suspense, useEffect, useState } from "react";
import { devFlags } from "@/app/dev/flags";
import { ZONES3D, VIEW_LABEL, type View, type ZoneState, type Proj } from "./zones";
import { ZoneHud } from "./ZoneHud";
import STILLS from "./stills.json";
const Body3D = lazy(() => import("./Body3D").then((m) => ({ default: m.Body3D })));
const STILL_MODE = devFlags.capture;
export function curTheme(): "dark" | "light" { return document.documentElement.dataset.theme === "light" ? "light" : "dark"; }
export function BodyStill({ states, sel, onPick, view, onView, probe, zoom, need }: { states: Record<string, ZoneState>; sel?: string; onPick?: (id: string) => void; view: View; onView?: (v: View) => void; probe?: boolean; zoom?: boolean; need?: string }) {
  const P = (STILLS as unknown as Record<string, Proj>)[view] ?? {};
  const hit = sel ? P[sel] : undefined;
  const focused = !!(zoom && sel && hit);
  return (
    <div className={`body3d still${focused ? " is-zoom" : ""}`}>
      <div className="still-stage" style={focused ? { transform: "scale(2.6)", transformOrigin: `${hit![0]}% ${hit![1]}%` } : undefined}>
        <img src={`/body3d/body-${view}-${curTheme()}.png`} alt={`Silhouette 3D, vue ${VIEW_LABEL[view]}`} draggable={false} />
        {ZONES3D.map((z) => { const p = P[z.id]; if (!p || !p[2]) return null; return (
          <button key={z.id} style={{ left: `${p[0]}%`, top: `${p[1]}%` }} className={`hot3d abs st-${states[z.id] ?? "none"} ${z.id === sel ? "on" : ""} ${["brain", "lungs", "skin"].includes(z.id) ? "lft" : ""}`} aria-pressed={z.id === sel} aria-label={z.label} onClick={() => onPick?.(z.id)}><i /><span>{z.label}</span></button>); })}
        {probe && sel && P[sel] && <span className="probe-pin" style={{ left: `${P[sel][0]}%`, top: `${P[sel][1]}%` }} aria-hidden="true" />}
      </div>
      {focused && need && hit![2] && <ZoneHud key={sel} x={hit![0]} y={hit![1]} label={need} tone={states[sel!] ?? "none"} />}
      {onView && <div className="view-seg" role="radiogroup" aria-label="Vue du corps">{(Object.keys(VIEW_LABEL) as View[]).map((v) => <button key={v} role="radio" aria-checked={view === v} onClick={() => onView(v)}>{VIEW_LABEL[v]}</button>)}</div>}
    </div>
  );
}
export function BodyFigure({ states, sel, onPick, views = true, probe, initial = "front", zoom, need }: { states: Record<string, ZoneState>; sel?: string; onPick?: (id: string) => void; views?: boolean; probe?: boolean; initial?: View; zoom?: boolean; need?: string }) {
  const [view, setView] = useState<View>(initial);
  useEffect(() => {
    if (!zoom || !sel) return;
    const z = ZONES3D.find((x) => x.id === sel);
    if (z) setView(z.dir === 1 ? "front" : "back");
  }, [zoom, sel]);
  const onView = views ? setView : undefined;
  return (
    <div className={`body-fig${zoom && sel ? " is-focus" : ""}`}>
      {STILL_MODE || probe ? <BodyStill states={states} sel={sel} onPick={onPick} view={view} onView={onView} probe={probe} zoom={zoom} need={need} />
        : <Suspense fallback={<BodyStill states={states} sel={sel} view={view} zoom={zoom} need={need} />}><Body3D states={states} sel={sel} onPick={onPick} view={view} onView={onView} theme={curTheme()} zoom={zoom} need={need} /></Suspense>}
    </div>
  );
}
export function ZoneLegend() {
  return <ul className="zone-legend" aria-label="Légende des couleurs"><li><i className="st-nominal" /> Dans la plage</li><li><i className="st-medium" /> Attention</li><li><i className="st-high" /> Alerte</li><li><i className="st-none" /> Pas de mesure directe</li></ul>;
}
