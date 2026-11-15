/* Bouton qui lance une vraie recherche Bluetooth (BlueZ) ou le sélecteur du navigateur. */
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { hasWebBluetooth, holdDevice, listen, requestNearbyDevice } from "./gatt";
import { radioDevices, radioStatus, startRadioScan, stopRadioScan, type RadioDevice } from "./radio";
import { publishReading, useBleReading } from "./store";

export function BleConnect() {
  const reading = useBleReading();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bridge, setBridge] = useState(false);
  const [found, setFound] = useState<RadioDevice[]>([]);
  const supported = hasWebBluetooth();
  const alive = useRef(true);
  const poll = useRef<number | null>(null);

  useEffect(() => {
    alive.current = true;
    radioStatus().then((ok) => { if (alive.current) setBridge(ok); });
    return () => {
      alive.current = false;
      if (poll.current != null) window.clearInterval(poll.current);
      void stopRadioScan();
    };
  }, []);

  const pick = () => {
    setError(null);
    if (bridge) {
      setBusy(true);
      setFound([]);
      void startRadioScan().then(async (failure) => {
        if (!alive.current) return;
        if (failure) {
          setError(failure);
          setBusy(false);
          return;
        }
        const pull = async () => {
          if (!alive.current) return;
          setFound(await radioDevices());
        };
        await pull();
        if (poll.current != null) window.clearInterval(poll.current);
        poll.current = window.setInterval(() => { void pull(); }, 800);
        window.setTimeout(() => {
          if (poll.current != null) window.clearInterval(poll.current);
          poll.current = null;
          if (!alive.current) return;
          setBusy(false);
          void stopRadioScan();
        }, 12_000);
      });
      return;
    }
    if (!supported) {
      setError("Ce navigateur ne donne pas accès au Bluetooth, et la radio de cet ordinateur n’est pas joignable. Ouvrez http://localhost:5173 avec le serveur de développement.");
      return;
    }
    setBusy(true);
    requestNearbyDevice()
      .then(async (device) => {
        holdDevice(device);
        await listen(device, publishReading);
      })
      .catch((err: Error) => {
        if (err.name !== "NotFoundError") setError("Connexion interrompue. L’appareil doit être allumé et à portée.");
      })
      .finally(() => setBusy(false));
  };

  const connect = (device: RadioDevice) => {
    setError(null);
    publishReading({ deviceName: device.name, at: Date.now() });
    setFound([]);
    if (poll.current != null) window.clearInterval(poll.current);
    poll.current = null;
    void stopRadioScan();
    if (!supported) {
      setBusy(false);
      return;
    }
    setBusy(true);
    requestNearbyDevice(device.name)
      .then(async (chosen) => {
        holdDevice(chosen);
        await listen(chosen, publishReading);
      })
      .catch((err: Error) => {
        if (err.name !== "NotFoundError") setError("Connexion interrompue. L’appareil doit être allumé et à portée.");
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className="ble-panel">
      <div className="kit-card-head">
        <button type="button" className="btn btn-secondary sm" onClick={pick} disabled={busy}>
          <Icon name="bluetooth" size={16} /> {busy ? "Recherche…" : "Détecter un appareil"}
        </button>
        <span className={reading ? "chip ok" : "chip"}>
          <Icon name={reading ? "bluetooth_connected" : "bluetooth"} size={14} />
          {reading ? reading.deviceName : bridge || supported ? "Aucun appareil" : "Bluetooth indisponible"}
        </span>
      </div>
      {error && <p className="r-note" role="alert">{error}</p>}
      {found.length > 0 && (
        <ul className="watch-scan-list" aria-label="Appareils Bluetooth à portée">
          {found.map((device) => (
            <li key={device.id}>
              <span>
                <Icon name="bluetooth" size={16} />
                <b className={device.name === device.id ? "mono" : undefined}>{device.name}</b>
                {device.rssi !== 0 && <span className="mono">{device.rssi} dBm</span>}
                <span className="chip ok">Réel</span>
              </span>
              <button type="button" className="btn btn-primary sm" onClick={() => connect(device)}>Connecter</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
