/* Porte d’entrée montre : rien tant que le Bluetooth n’a pas trouvé un appareil. */
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Demo, Icon } from "@/components/ui";
import { useWatchPairing } from "./pairing";

type WatchApi = ReturnType<typeof useWatchPairing>;

export function WatchSection({ crewId, children }: { crewId: string; children: (w: WatchApi) => ReactNode }) {
  const w = useWatchPairing(crewId);
  if (!w.active) return <WatchGate w={w} />;
  return <>{children(w)}</>;
}

function WatchGate({ w }: { w: WatchApi }) {
  const reduce = useReducedMotion();
  const found = w.nearby.length > 0;
  const busy = w.state === "enabling" || (w.state === "scanning" && !found);
  const step = found ? 2 : w.state === "idle" ? 0 : 1;
  const enter = reduce ? false : { opacity: 0, y: 8 };
  return (
    <section className="watch-gate" aria-labelledby="watch-gate-title">
      <div className="watch-gate-inner">
        <ol className="watch-steps" aria-label="Connexion">
          <li className={step >= 1 ? "on" : ""}>Bluetooth</li>
          <li className={step >= 2 ? "on" : ""}>Appareil</li>
          <li>Synchro</li>
        </ol>
        <AnimatePresence mode="wait">
          {w.state === "idle" && (
            <motion.div key="idle" className="watch-gate-copy" initial={enter} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <Icon name="watch" size={28} />
              <h1 id="watch-gate-title">Rien de connecté</h1>
              <p>Activez le Bluetooth. L’application cherche ensuite une montre à proximité.</p>
              <button type="button" className="btn btn-primary" onClick={w.enableBluetooth} data-testid="watch-connect">
                <Icon name="bluetooth" size={18} /> Activer le Bluetooth
              </button>
            </motion.div>
          )}
          {busy && (
            <motion.div key="scan" className="watch-gate-copy" role="status" aria-live="polite" initial={enter} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <span className="bt-ring" aria-hidden="true" />
              <h1 id="watch-gate-title">{w.state === "enabling" ? "Activation du Bluetooth" : "Recherche"}</h1>
              <p>{w.state === "enabling" ? "Bluetooth en cours d’activation…" : "Bluetooth activé. Recherche des montres à proximité."}</p>
              <button type="button" className="btn btn-ghost sm" onClick={w.cancelScan}>Annuler</button>
            </motion.div>
          )}
          {found && (
            <motion.div key="found" className="watch-gate-copy" role="status" aria-live="polite" initial={enter} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <h1 id="watch-gate-title">Montre détectée</h1>
              <p>Choisissez l’appareil, puis la synchro s’ouvre.</p>
              <ul className="watch-scan-list">
                {w.nearby.map((n, i) => (
                  <motion.li key={n.id} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: reduce ? 0 : i * 0.06 }}>
                    <span><Icon name="watch" size={18} /><b>{n.name}</b><Demo /></span>
                    <button type="button" className="btn btn-primary sm" onClick={() => w.pair(n)}>Connecter</button>
                  </motion.li>
                ))}
              </ul>
              <button type="button" className="btn btn-ghost sm" onClick={w.cancelScan}>Annuler</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
