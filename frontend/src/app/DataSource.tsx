/* Indique d’où viennent les données affichées : API FastAPI ou simulateur local (DÉMO). */
import { useDataSource } from "@/api";
import { Demo, Icon } from "@/components/ui";
import { useLang } from "@/i18n";

/** Étiquette à côté d’un titre de carte : « DÉMO » si les données viennent du simulateur. */
export function DataTag() {
  const src = useDataSource();
  const { tr } = useLang();
  return src === "api" ? <span className="chip ok"><Icon name="sensors" size={14} /> {tr("Direct", "Live")}</span> : <Demo title={tr("Données simulées (backend non connecté)", "Simulated data (backend not connected)")} />;
}
