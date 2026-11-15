/* Appairage montre : Bluetooth à activer, puis un appareil, puis la synchro.
   Persistance localStorage par astronaute. L’état « en cours » est partagé entre les hooks ouverts. */
import { useCallback, useEffect, useRef, useState } from "react";

export type WatchPairState = "idle" | "enabling" | "scanning" | "paired" | "offline";

export type NearbyWatch = { id: string; name: string; rssi: number };

export type WatchPairing = {
  state: WatchPairState;
  watchId: string | null;
  watchName: string | null;
  pairedAt: string | null;
};

const key = (crewId: string) => `pulsar.watch.${crewId}`;

const EMPTY: WatchPairing = { state: "idle", watchId: null, watchName: null, pairedAt: null };

const listeners = new Set<() => void>();
function emit() { listeners.forEach((fn) => fn()); }

export function loadPairing(crewId: string): WatchPairing {
  try {
    const raw = JSON.parse(localStorage.getItem(key(crewId)) || "null");
    if (!raw || typeof raw !== "object") return { ...EMPTY };
    return {
      state: raw.watchId ? "paired" : "idle",
      watchId: raw.watchId ?? null,
      watchName: raw.watchName ?? null,
      pairedAt: raw.pairedAt ?? null,
    };
  } catch {
    return { ...EMPTY };
  }
}

function save(crewId: string, p: WatchPairing) {
  localStorage.setItem(key(crewId), JSON.stringify({ watchId: p.watchId, watchName: p.watchName, pairedAt: p.pairedAt }));
  emit();
}

/** Montres fictives découvertes au scan (DÉMO). */
export function mockNearby(crewId: string): NearbyWatch[] {
  return [
    { id: `WT-${crewId}-A`, name: `PULSAR Watch · ${crewId}`, rssi: -48 },
    { id: `WT-${crewId}-B`, name: "PULSAR Watch · cabine", rssi: -67 },
  ];
}

export function useWatchPairing(crewId: string) {
  const [p, setP] = useState<WatchPairing>(() => (typeof localStorage === "undefined" ? EMPTY : loadPairing(crewId)));
  const [nearby, setNearby] = useState<NearbyWatch[]>([]);
  const timers = useRef<number[]>([]);
  const scanning = useRef(false);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => {
    setP(loadPairing(crewId));
    setNearby([]);
    scanning.current = false;
    return () => { clearTimers(); scanning.current = false; };
  }, [crewId]);

  useEffect(() => {
    const pull = () => {
      if (scanning.current) return;
      setP(loadPairing(crewId));
    };
    listeners.add(pull);
    return () => { listeners.delete(pull); };
  }, [crewId]);

  const enableBluetooth = useCallback(() => {
    clearTimers();
    scanning.current = true;
    setNearby([]);
    setP({ ...EMPTY, state: "enabling" });
    const t1 = window.setTimeout(() => {
      setP((cur) => (cur.state === "enabling" ? { ...cur, state: "scanning" } : cur));
      const t2 = window.setTimeout(() => setNearby(mockNearby(crewId)), 1100);
      timers.current.push(t2);
    }, 700);
    timers.current.push(t1);
  }, [crewId]);

  const pair = useCallback((w: NearbyWatch) => {
    clearTimers();
    scanning.current = false;
    const next: WatchPairing = { state: "paired", watchId: w.id, watchName: w.name, pairedAt: new Date().toISOString() };
    save(crewId, next);
    setP(next);
    setNearby([]);
  }, [crewId]);

  const disconnect = useCallback(() => {
    clearTimers();
    scanning.current = false;
    save(crewId, { ...EMPTY });
    setP({ ...EMPTY });
    setNearby([]);
  }, [crewId]);

  const cancelScan = useCallback(() => {
    clearTimers();
    scanning.current = false;
    setNearby([]);
    setP(loadPairing(crewId));
  }, [crewId]);

  return { ...p, nearby, enableBluetooth, pair, disconnect, cancelScan, active: p.state === "paired" && !!p.watchId };
}
