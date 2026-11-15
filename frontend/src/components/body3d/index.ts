/* Silhouette santé 3D — importer depuis "@/components/body3d".
   Body3D (three.js) est chargé à la demande par BodyFigure : ne pas l’importer directement dans un écran. */
export { BodyFigure, BodyStill, ZoneLegend, curTheme } from "./BodyFigure";
export { VitalFloats, type VitalFloatItem } from "./VitalFloats";
export { zoneBrief, useZoneZoom } from "./zoom";
export { ZONES3D, VIEW_LABEL, VIEW_ANGLE, STILL_STATES, statesFor, type View, type ZoneState, type Proj } from "./zones";
