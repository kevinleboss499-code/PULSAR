/* Icône SVG exportée depuis Figma (cache local `public/figma-icons/`).
   Le jeton ne passe pas par ici : lancer `npm run figma:icons` pour remplir le cache.
   Les icônes d’interface restent dans <Icon> (lucide). */
import { useState } from "react";
import { safeIconName } from "@/figma/iconName";

export function FigmaIcon({
  name,
  label = "",
  className,
  size = 20,
}: {
  name: string;
  /** Texte alternatif. Vide si l’icône est décorative. */
  label?: string;
  className?: string;
  size?: number;
}) {
  const file = safeIconName(name);
  const [failedName, setFailedName] = useState<string | null>(null);
  const missing = !file || failedName === file;
  const cls = className ? `icon ${className}` : "icon";

  if (missing) {
    return (
      <span
        className={`${cls} figma-icon--missing`}
        style={{ width: size, height: size }}
        {...(label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const })}
      />
    );
  }

  return (
    <img
      className={cls}
      src={`/figma-icons/${file}.svg`}
      alt={label}
      width={size}
      height={size}
      decoding="async"
      onError={() => setFailedName(file)}
    />
  );
}
