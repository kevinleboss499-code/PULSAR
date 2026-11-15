import { Link } from "react-router";
import { Icon, PageHead } from "@/components/ui";
import { useLang } from "@/i18n";
export function NotFound({ home }: { home: string }) {
  const { tr } = useLang();
  return <><PageHead title={tr("Écran introuvable", "Screen not found")} sub={tr("Cette adresse n’existe pas dans votre espace.", "This address does not exist in your space.")} /><Link className="btn btn-primary" to={home}><Icon name="home" size={18} /> {tr("Retour à l’accueil", "Back to home")}</Link></>;
}
