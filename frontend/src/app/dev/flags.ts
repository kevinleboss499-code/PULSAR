/* Drapeaux de développement. Actifs seulement en `npm run dev` (ou build avec VITE_DEV_TOOLS=true).
   - ?capture=1 : silhouette en image fixe (captures Figma / tests visuels, pas de WebGL)
   - ?stillset  : planche Silhouette 3D (face, ¾, dos) — maquette Figma A14
   - ?wtgrid    : galerie de tous les écrans montre ; ?wt=square|round&v=home… : un écran montre seul
   - ?still=front|34|side|back&theme=dark|light : rendu plein écran pour régénérer public/body3d/*.png */
const q = new URLSearchParams(window.location.search);
const enabled = import.meta.env.DEV || import.meta.env.VITE_DEV_TOOLS === "true";
export const devFlags = {
  enabled,
  capture: enabled && (q.has("capture") || q.has("still2d")),
  stillset: enabled && q.has("stillset"),
  wtgrid: enabled && q.has("wtgrid"),
  wt: enabled ? q.get("wt") : null,
  wtView: q.get("v"),
  wtLive: q.has("live"),
  still: enabled ? q.get("still") : null,
  scan: enabled ? q.get("scan") : null,
};
/** Une page de dev est-elle demandée ? (évite de charger son code sinon) */
export const hasDevPage = devFlags.enabled && (devFlags.stillset || devFlags.wtgrid || !!devFlags.wt || !!devFlags.still);
