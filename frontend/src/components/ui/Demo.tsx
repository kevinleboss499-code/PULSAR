/* Étiquette « DÉMO » : obligatoire à côté de toute valeur personnelle qui n’est pas une vraie mesure. */
import { useLang } from "@/i18n";

export function Demo({ title }: { title?: string }) {
  const { tr } = useLang();
  const tip = title ?? tr("Valeur de démonstration : non issue d’une mesure réelle", "Demonstration value: not from a real measurement");
  return <span className="demo" title={tip}>{tr("DÉMO", "DEMO")}</span>;
}
