/* Puces biomarqueurs par zone anatomique — autour de la silhouette 3D. */
import { Icon, Lamp } from "@/components/ui";
import type { Light } from "@/data/types";
import { ZONES3D, type ZoneState } from "@/components/body3d";

const STATE_LIGHT: Record<ZoneState, Light> = {
  nominal: "ok",
  medium: "caution",
  high: "warning",
  none: "ok",
};

export function ZoneInsights({
  states,
  onPick,
}: {
  states: Record<string, ZoneState>;
  onPick?: (id: string) => void;
}) {
  const rows = ZONES3D.filter((z) => states[z.id] && states[z.id] !== "none").slice(0, 6);
  return (
    <ul className="zone-insights" aria-label="Indicateurs par zone">
      {rows.map((z) => {
        const st = states[z.id] ?? "nominal";
        const light = STATE_LIGHT[st];
        return (
          <li key={z.id}>
            <button type="button" className={`zone-chip is-${st}`} onClick={() => onPick?.(z.id)}>
              <Lamp l={light} compact />
              <span>
                <strong>{z.label}</strong>
                <small className="mono">{st === "nominal" ? "nominal" : st === "medium" ? "attention" : "alerte"}</small>
              </span>
              <Icon name="chevron_right" size={14} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
