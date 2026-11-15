/* Noms de fichiers sûrs pour les SVG mis en cache depuis Figma.
   Partagé par le script Node (scripts/figma/icons.ts) et par <FigmaIcon>. */

const SAFE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Nom de fichier (sans extension) : minuscules, tirets, pas de chemin. */
export function safeIconName(raw: string): string | null {
  const name = raw
    .replace(/\u0153|\u0152/g, "oe")
    .replace(/\u00e6|\u00c6/g, "ae")
    .replace(/\u00df/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return SAFE_NAME.test(name) ? name : null;
}

/** Identifiant de nœud Figma `12:34`, ou forme d’URL `12-34`. */
export function figmaNodeId(raw: string): string | null {
  const trimmed = raw.trim();
  const id = /^\d+:\d+$/.test(trimmed) ? trimmed : /^\d+-\d+$/.test(trimmed) ? trimmed.replace("-", ":") : null;
  if (!id || id.length > 40) return null;
  return id;
}
