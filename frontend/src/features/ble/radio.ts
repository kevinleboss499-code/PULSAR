/* Client du pont BlueZ servi par Vite en développement (`/__ble/*`). */

export type RadioDevice = { id: string; name: string; rssi: number };

async function readJson(path: string, init?: RequestInit): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(path, { ...init, headers: { Accept: "application/json", ...(init?.headers ?? {}) } });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (!type.includes("json")) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function radioStatus(): Promise<boolean> {
  const body = await readJson("/__ble/status");
  return body?.ok === true;
}

export async function startRadioScan(): Promise<string | null> {
  const body = await readJson("/__ble/start", { method: "POST" });
  if (!body) return "La recherche Bluetooth n’a pas répondu.";
  if (body.ok === true) return null;
  return typeof body.error === "string" ? body.error : "La recherche Bluetooth a échoué.";
}

export async function radioDevices(): Promise<RadioDevice[]> {
  const body = await readJson("/__ble/devices");
  const list = body?.devices;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.name !== "string") return [];
    return [{ id: row.id, name: row.name, rssi: typeof row.rssi === "number" ? row.rssi : 0 }];
  });
}

export async function stopRadioScan(): Promise<void> {
  await readJson("/__ble/stop", { method: "POST" });
}
