/* Bandeau d’action : confirmation locale, ou rappel qu’il faut le backend. */
import { useSyncExternalStore } from "react";

export type NoticeKind = "ok" | "backend";
export type Notice = { id: number; kind: NoticeKind; title: string; detail: string };

let seq = 0;
let items: Notice[] = [];
const listeners = new Set<() => void>();
const timers = new Map<number, number>();

function emit() { listeners.forEach((l) => l()); }

export function dismissNotice(id: number) {
  const t = timers.get(id);
  if (t) window.clearTimeout(t);
  timers.delete(id);
  items = items.filter((n) => n.id !== id);
  emit();
}

export function pushNotice(n: { kind: NoticeKind; title: string; detail: string }) {
  const item: Notice = { ...n, id: ++seq };
  items = [...items, item].slice(-3);
  emit();
  timers.set(item.id, window.setTimeout(() => dismissNotice(item.id), 6500));
  return item.id;
}

/** L’action ne peut pas aboutir sans l’API (liaison, sonde, capteur distant). */
export function notifyBackend(action: string) {
  pushNotice({
    kind: "backend",
    title: "Backend requis",
    detail: `${action}. Cette action a besoin du serveur. Elle fonctionnera quand l’API sera branchée.`,
  });
}

/** L’action est faite dans le navigateur, en attendant le serveur. */
export function notifyOk(title: string, detail: string) {
  pushNotice({ kind: "ok", title, detail });
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const EMPTY: Notice[] = [];
const snapshot = () => items;

export function useNotices(): Notice[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}
