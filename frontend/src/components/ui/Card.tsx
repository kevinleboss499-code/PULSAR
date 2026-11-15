import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
/* Carte de tableau de bord : titre + icône + (option) aside à droite, ex. <Demo />. */
export function Card({ title, icon, glyph, aside, children, className }: { title: string; icon?: IconName; glyph?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`r-card ${className ?? ""}`}>
      <header className="r-card-head"><h3>{glyph ?? (icon ? <Icon name={icon} size={18} /> : null)}{title}</h3>{aside}</header>
      {children}
    </section>
  );
}
