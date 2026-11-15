/* Tableau « dernière valeur disponible » (LAD), inspiré d’Open MCT (sans reprise de code) :
   une ligne par indicateur : nom · heure · valeur · unité · seuils ; ligne colorée UNIQUEMENT hors limite
   (jaune = attention, rouge = alerte), toujours avec icône + flèche de sens (au-dessus / au-dessous). Valeur périmée signalée. */
import { Icon } from "@/components/ui";

export type LadRow = { key: string; name: string; time?: string; value: number | string | null; unit?: string; orange?: number; rouge?: number; direction?: "above" | "below"; staleSec?: number };

export function limitOf(r: LadRow): "ok" | "caution" | "warning" {
  if (typeof r.value !== "number" || !r.direction) return "ok";
  const past = (t?: number) => t != null && (r.direction === "above" ? (r.value as number) >= t : (r.value as number) <= t);
  return past(r.rouge) ? "warning" : past(r.orange) ? "caution" : "ok";
}

export function LadTable({ rows, caption, staleAfterSec = 600 }: { rows: LadRow[]; caption?: string; staleAfterSec?: number }) {
  return (
    <table className="lad">
      {caption && <caption className="visually-hidden">{caption}</caption>}
      <thead><tr><th scope="col">Indicateur</th><th scope="col">Heure (UTC)</th><th scope="col" className="num">Valeur</th><th scope="col">Unité</th><th scope="col" className="num">Seuil orange</th><th scope="col" className="num">Seuil rouge</th></tr></thead>
      <tbody>
        {rows.map((r) => {
          const lim = limitOf(r);
          const stale = r.staleSec != null && r.staleSec > staleAfterSec;
          return (
            <tr key={r.key} className={`${lim !== "ok" ? `is-limit is-limit--${lim}` : ""} ${stale ? "is-stale" : ""}`} data-limit={lim}>
              <th scope="row">
                {lim !== "ok" && <span className="lad-lim"><Icon name={lim === "warning" ? "error" : "warning"} size={14} /><Icon name={r.direction === "below" ? "arrow_downward" : "arrow_upward"} size={12} /><span className="visually-hidden">{lim === "warning" ? "Alerte" : "Attention"}, {r.direction === "below" ? "sous" : "au-dessus de"} la limite</span></span>}
                {r.name}
              </th>
              <td className="mono">{r.time ?? "—"}{stale && <span className="lad-stale"> · périmée</span>}</td>
              <td className="num mono">{r.value ?? "—"}</td>
              <td className="muted">{r.unit}</td>
              <td className="num mono muted">{r.orange != null ? `${r.direction === "below" ? "≤" : "≥"} ${r.orange}` : "—"}</td>
              <td className="num mono muted">{r.rouge != null ? `${r.direction === "below" ? "≤" : "≥"} ${r.rouge}` : "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
