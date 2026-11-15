import { Link } from "react-router";
import { Icon, PageHead } from "@/components/ui";
export function NotFound({ home }: { home: string }) {
  return <><PageHead title="Écran introuvable" sub="Cette adresse n’existe pas dans votre espace." /><Link className="btn btn-primary" to={home}><Icon name="home" size={18} /> Retour à l’accueil</Link></>;
}
