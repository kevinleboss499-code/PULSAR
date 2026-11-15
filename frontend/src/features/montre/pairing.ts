/* Appairage montre : Bluetooth à activer, puis un appareil, puis la synchro.
   Persistance localStorage par astronaute. L’état « en cours » est partagé entre les hooks ouverts. */
import { useCallback, useEffect, useRef, useState } from "react";
import { disconnect as disconnectBle, hasWebBluetooth, holdDevice, listen, requestNearbyDevice, takeDevice } from "@/features/ble/gatt";
import { radioDevices, radioStatus, startRadioScan, stopRadioScan } from "@/features/ble/radio";
import { clearReading, publishReading } from "@/features/ble/store";

export type WatchPairState = "idle" | "enabling" | "scanning" | "paired" | "offline";

export type NearbyWatch = { id: string; name: string; rssi: number; live?: boolean };

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
  const [error, setError] = useState<string | null>(null);
  const [bridge, setBridge] = useState(false);
  const [radioPending, setRadioPending] = useState(true);
  const timers = useRef<number[]>([]);
  const scanning = useRef(false);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => {
    let live = true;
    setRadioPending(true);
    radioStatus().then((ok) => {
      if (!live) return;
      setBridge(ok);
      setRadioPending(false);
    });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    setP(loadPairing(crewId));
    setNearby([]);
    scanning.current = false;
    return () => {
      clearTimers();
      scanning.current = false;
      void stopRadioScan();
    };
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
    setError(null);
    setP({ ...EMPTY, state: "enabling" });
    const useMock = () => {
      const t1 = window.setTimeout(() => {
        setP((cur) => (cur.state === "enabling" ? { ...cur, state: "scanning" } : cur));
        const t2 = window.setTimeout(() => setNearby(mockNearby(crewId)), 1100);
        timers.current.push(t2);
      }, 700);
      timers.current.push(t1);
    };
    const useBrowser = () => {
      requestNearbyDevice().then((device) => {
        if (!scanning.current) return;
        holdDevice(device);
        setNearby([{ id: device.id, name: device.name || "Appareil Bluetooth", rssi: 0, live: true }]);
        setP((cur) => ({ ...cur, state: "scanning" }));
      }).catch((err: Error) => {
        scanning.current = false;
        if (err.name === "NotFoundError") {
          setP(loadPairing(crewId));
          return;
        }
        setError("Le Bluetooth du navigateur n’a pas pu lister les appareils. Vérifiez qu’il est allumé, puis réessayez.");
        setP(loadPairing(crewId));
      });
    };
    void radioStatus().then(async (ok) => {
      if (!scanning.current) return;
      setBridge(ok);
      setRadioPending(false);
      if (ok) {
        const failure = await startRadioScan();
        if (!scanning.current) {
          void stopRadioScan();
          return;
        }
        if (failure) {
          scanning.current = false;
          setError(failure);
          setP(loadPairing(crewId));
          return;
        }
        setP((cur) => ({ ...cur, state: "scanning" }));
        const tick = window.setInterval(() => {
          void radioDevices().then((list) => {
            if (!scanning.current) return;
            setNearby(list.map((d) => ({ id: d.id, name: d.name, rssi: d.rssi, live: true })));
          });
        }, 800);
        timers.current.push(tick);
        return;
      }
      if (hasWebBluetooth()) {
        useBrowser();
        return;
      }
      useMock();
    });
  }, [crewId]);

  const pair = useCallback((w: NearbyWatch) => {
    clearTimers();
    scanning.current = false;
    void stopRadioScan();
    const next: WatchPairing = { state: "paired", watchId: w.id, watchName: w.name, pairedAt: new Date().toISOString() };
    save(crewId, next);
    setP(next);
    setNearby([]);
    const held = takeDevice(w.id);
    const open = (device: NonNullable<ReturnType<typeof takeDevice>>) => {
      listen(device, publishReading).catch(() => {
        setError("Appareil choisi, mais aucune mesure standard n’a pu être lue (pouls, SpO₂, tension, glycémie ou température).");
      });
    };
    if (held) {
      open(held);
      return;
    }
    if (w.live && hasWebBluetooth()) {
      requestNearbyDevice(w.name).then((device) => {
        holdDevice(device);
        open(device);
      }).catch((err: Error) => {
        if (err.name === "NotFoundError") return;
        setError("Appareil détecté. La lecture des mesures a été annulée.");
      });
    }
  }, [crewId]);

  const disconnect = useCallback(() => {
    clearTimers();
    scanning.current = false;
    if (p.watchId) disconnectBle(p.watchId);
    clearReading();
    save(crewId, { ...EMPTY });
    setP({ ...EMPTY });
    setNearby([]);
    setError(null);
  }, [crewId, p.watchId]);

  const cancelScan = useCallback(() => {
    clearTimers();
    scanning.current = false;
    void stopRadioScan();
    setNearby([]);
    setP(loadPairing(crewId));
  }, [crewId]);

  return { ...p, nearby, error, enableBluetooth, pair, disconnect, cancelScan, active: p.state === "paired" && !!p.watchId, liveRadio: hasWebBluetooth() || bridge, radioPending };
}
