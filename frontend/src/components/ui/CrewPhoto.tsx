/* Photo de dossier, locale uniquement. Aucune image n’est fournie : le bouton donne la capacité d’en choisir une. */
import { useState, useSyncExternalStore } from "react";
import { Icon } from "./Icon";

const EVENT = "pulsar-portrait";
const key = (id: string) => `pulsar.portrait.${id}`;

export function readPortrait(id: string): string | null {
  try { return localStorage.getItem(key(id)); } catch { return null; }
}

function subscribe(onStoreChange: () => void) {
  const fn = () => onStoreChange();
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}

export function usePortrait(id: string) {
  return useSyncExternalStore(subscribe, () => readPortrait(id) ?? "", () => "");
}

export function savePortrait(id: string, data: string | null) {
  try {
    if (data) localStorage.setItem(key(id), data);
    else localStorage.removeItem(key(id));
  } catch { /* quota */ }
  window.dispatchEvent(new Event(EVENT));
}

export function CrewPhotoButton({ crewId, compact = false }: { crewId: string; compact?: boolean }) {
  const photo = usePortrait(crewId);
  const [err, setErr] = useState<string | null>(null);
  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Choisissez une image."); return; }
    if (file.size > 900_000) { setErr("Image trop lourde (900 ko maximum). Elle reste sur cet appareil."); return; }
    const reader = new FileReader();
    reader.onload = () => { savePortrait(crewId, String(reader.result || "")); setErr(null); };
    reader.readAsDataURL(file);
  };
  return (
    <div className={`portrait-ctl${compact ? " is-compact" : ""}`}>
      <label className="btn btn-secondary sm" title={compact ? "Facultatif. La photo reste sur cet appareil, rien n’est envoyé." : undefined}>
        <Icon name="upload" size={16} /> {photo ? "Changer la photo" : "Ajouter une photo"}
        <input
          type="file"
          accept="image/*"
          hidden
          aria-label={photo ? "Changer la photo de dossier" : "Ajouter une photo de dossier"}
          onChange={(e) => { onFile(e.target.files?.[0]); e.currentTarget.value = ""; }}
        />
      </label>
      {photo && <button type="button" className="btn btn-ghost sm" onClick={() => savePortrait(crewId, null)}>Retirer</button>}
      <p className="r-note" role={err ? "alert" : undefined}>{err ?? "Facultatif. La photo reste sur cet appareil, rien n’est envoyé."}</p>
    </div>
  );
}
