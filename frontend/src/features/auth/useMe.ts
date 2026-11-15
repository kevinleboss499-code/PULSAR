/* Astronaute connecté → SON dossier d’équipage uniquement (jamais celui des autres). */
import { CREW } from "@/data/demo/crew";
import type { Member } from "@/data/types";
import { localizeMember, useLang } from "@/i18n";
import { useAuth } from "./AuthProvider";

export function useMe(): Member {
  const { user } = useAuth();
  const { lang } = useLang();
  const me = CREW.find((m) => m.id === user?.crewId);
  if (!me) throw new Error(`Aucun dossier d’équipage pour ${user?.id ?? "?"}`);
  return localizeMember(me, lang);
}
