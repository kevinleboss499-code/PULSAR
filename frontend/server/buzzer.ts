/* Relais vers le buzzer ESP32 : POST http://<ip>/bip (timeout 2 s).
   L’IP vient de l’environnement du serveur de dev, jamais du navigateur. */

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;

export function buzzerIp(raw: string | undefined): string {
  const ip = (raw ?? "").trim() || "192.168.137.232";
  if (!IPV4.test(ip)) return "192.168.137.232";
  const ok = ip.split(".").every((part) => {
    const n = Number(part);
    return n >= 0 && n <= 255 && String(n) === part;
  });
  return ok ? ip : "192.168.137.232";
}

/** Salve : plusieurs POST /bip d’affilée. Le firmware n’a pas de volume, la répétition porte plus fort. */
export async function bipFort(ip: string, times = 8): Promise<{ ok: boolean; text?: string; error?: string; beeps: number }> {
  let beeps = 0;
  let last: { ok: boolean; text?: string; error?: string } = { ok: false, error: "ESP32 injoignable" };
  for (let i = 0; i < times; i++) {
    last = await bipEsp(ip);
    if (!last.ok) break;
    beeps += 1;
  }
  return { ...last, ok: beeps > 0, beeps };
}

export async function bipEsp(ip: string): Promise<{ ok: boolean; text?: string; error?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2000);
  try {
    const res = await fetch(`http://${ip}/bip`, { method: "POST", signal: ctrl.signal });
    const text = await res.text();
    return res.ok ? { ok: true, text } : { ok: false, text, error: `HTTP ${res.status}` };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return { ok: false, error: aborted ? "Délai dépassé (2 s)" : "ESP32 injoignable" };
  } finally {
    clearTimeout(timer);
  }
}
