/* Buzzer de l’ESP32-C3, en Wi-Fi seulement (POST http://<ip>/bip).
   Le firmware n’a pas de volume : une salve de 12 bips est le maximum. */
import type { SoundId } from "./engine";

const HARDWARE = new Set<SoundId>(["alarmHigh", "fatiguePim"]);
const FORT = new Set<SoundId>(["fatiguePim"]);

/** Salve maximale vers l’ESP32-C3. À chaque mise de l’appareil digital. */
export function buzzEspFort(): void {
  void fetch("/__buzzer/fort", { method: "POST" }).catch(() => {});
}

export function pingHardwareBuzzer(id: SoundId): void {
  if (!HARDWARE.has(id)) return;
  void fetch(FORT.has(id) ? "/__buzzer/fort" : "/__buzzer/bip", { method: "POST" }).catch(() => {});
}
