import type { ReactNode } from "react";
/* En-tête d’écran : titre (Hubot Sans), sous-titre, aside (voyant, actions). */
export function PageHead({ title, sub, aside }: { title: string; sub?: string; aside?: ReactNode }) {
  return <div className="r-head"><div><h1>{title}</h1>{sub && <p className="r-sub">{sub}</p>}</div>{aside}</div>;
}
