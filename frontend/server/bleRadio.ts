/* Recherche Bluetooth réelle via BlueZ (bluetoothctl), uniquement pour le serveur de dev Vite.
   Le navigateur ne peut pas lister les appareils tout seul hors Web Bluetooth. */
import { existsSync } from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";

export type SeenDevice = { id: string; name: string; rssi: number; named: boolean };

const ANSI = /\u001b\[[0-9;]*m/g;
const MAC_NAME = /^[0-9A-F]{2}([:-][0-9A-F]{2}){5}$/i;

const devices = new Map<string, SeenDevice>();
let scanProc: ChildProcess | null = null;
let starting: Promise<{ ok: boolean; error?: string }> | null = null;
let owned = false;

export function radioAvailable(): boolean {
  return (existsSync("/bin/bluetoothctl") || existsSync("/usr/bin/bluetoothctl"))
    && (existsSync("/bin/stdbuf") || existsSync("/usr/bin/stdbuf"));
}

export function isScanning(): boolean {
  return scanProc !== null && scanProc.exitCode === null && !scanProc.killed;
}

export function listDevices(): { id: string; name: string; rssi: number }[] {
  return [...devices.values()]
    .sort((a, b) => {
      if (a.named !== b.named) return a.named ? -1 : 1;
      return (b.rssi || -200) - (a.rssi || -200);
    })
    .slice(0, 20)
    .map(({ id, name, rssi }) => ({ id, name, rssi }));
}

function displayName(id: string, raw: string): { name: string; named: boolean } {
  const trimmed = raw.trim();
  const dashed = id.replace(/:/g, "-");
  if (!trimmed || MAC_NAME.test(trimmed) || trimmed.toUpperCase() === id.toUpperCase() || trimmed.toUpperCase() === dashed.toUpperCase()) {
    return { name: id, named: false };
  }
  return { name: trimmed, named: true };
}

/** Interprète une ligne bluetoothctl (codes couleur déjà retirés). */
export function ingestLine(line: string) {
  const text = line.replace(ANSI, "").trim();
  const hit = text.match(/^\[(NEW|CHG)\] Device ([0-9A-F:]{17}) (.*)$/i);
  if (!hit) return;
  const id = hit[2].toUpperCase();
  const rest = hit[3];
  const cur = devices.get(id) ?? { id, name: id, rssi: 0, named: false };
  if (hit[1].toUpperCase() === "NEW") {
    const shown = displayName(id, rest);
    if (shown.named || !cur.named) {
      cur.name = shown.name;
      cur.named = shown.named;
    }
  }
  const rssi = rest.match(/RSSI:.*\((-?\d+)\)/);
  if (rssi) cur.rssi = Number(rssi[1]);
  const named = rest.match(/^(?:Name|Alias): (.*)$/);
  if (named) {
    const shown = displayName(id, named[1]);
    if (shown.named) {
      cur.name = shown.name;
      cur.named = true;
    }
  }
  devices.set(id, cur);
}

function exec(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("bluetoothctl", args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (chunk: Buffer) => { err += chunk.toString("utf8"); });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(err.trim() || `bluetoothctl ${args.join(" ")}`))));
  });
}

async function doStart(): Promise<{ ok: boolean; error?: string }> {
  if (!radioAvailable()) return { ok: false, error: "La recherche Bluetooth n’est pas disponible sur cet ordinateur." };
  if (isScanning()) return { ok: true };
  devices.clear();
  try {
    await exec(["power", "on"]);
  } catch {
    return { ok: false, error: "Impossible d’allumer le Bluetooth. Vérifiez qu’il n’est pas bloqué." };
  }
  const child = spawn("stdbuf", ["-oL", "bluetoothctl", "--timeout", "45", "scan", "on"], { stdio: ["ignore", "pipe", "pipe"] });
  scanProc = child;
  owned = true;
  let buf = "";
  child.stdout.on("data", (chunk: Buffer) => {
    buf += chunk.toString("utf8");
    const lines = buf.split(/\r?\n/);
    buf = lines.pop() ?? "";
    for (const line of lines) ingestLine(line);
  });
  child.on("exit", () => {
    if (scanProc === child) scanProc = null;
  });
  child.on("error", () => {
    if (scanProc === child) scanProc = null;
  });
  return { ok: true };
}

export function startScan(): Promise<{ ok: boolean; error?: string }> {
  if (isScanning()) return Promise.resolve({ ok: true });
  if (starting) return starting;
  starting = doStart().finally(() => { starting = null; });
  return starting;
}

export function stopScan() {
  if (!owned) return;
  owned = false;
  if (scanProc && scanProc.exitCode === null) scanProc.kill("SIGINT");
  scanProc = null;
  const off = spawn("bluetoothctl", ["scan", "off"], { stdio: "ignore" });
  off.on("error", () => {});
}
