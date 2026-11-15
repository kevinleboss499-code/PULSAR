/* Étiquette « DÉMO » : obligatoire à côté de toute valeur personnelle qui n’est pas une vraie mesure. */
export function Demo({ title = "Valeur de démonstration : non issue d’une mesure réelle" }: { title?: string }) {
  return <span className="demo" title={title}>DÉMO</span>;
}
