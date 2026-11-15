import { SpaceFilm } from "./SpaceFilm";

export function HeroScene({ calm }: { calm: boolean }) {
  return <SpaceFilm variant="hero" interactive={!calm} />;
}
