/* Indique d’où viennent les données affichées : API FastAPI ou simulateur local (DÉMO). */
import { useDataSource } from "@/api";
import { Demo, Icon } from "@/components/ui";

/** Étiquette à côté d’un titre de carte : « DÉMO » si les données viennent du simulateur. */
export function DataTag() {
  const src = useDataSource();
  return src === "api" ? <span className="chip ok"><Icon name="sensors" size={14} /> Direct</span> : <Demo title="Données simulées (backend non connecté)" />;
}
