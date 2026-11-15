/* Montre du compte : déjà reliée en Wi-Fi à l’ESP32-C3. Pas de recherche Bluetooth. */
import type { ReactNode } from "react";

export type WifiWatch = {
  watchName: string;
  disconnect: () => void;
};

export function WatchSection({ children }: { crewId: string; children: (w: WifiWatch) => ReactNode }) {
  return <>{children({ watchName: "ESP32-C3 · Wi-Fi", disconnect: () => {} })}</>;
}
