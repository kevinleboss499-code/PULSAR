/* ⚠️ COMPTES DE DÉMONSTRATION — FRONT-END UNIQUEMENT.
   Les codes sont en clair ici pour la démo NASA Space Apps. En production, ce fichier DISPARAÎT :
   les identifiants sont vérifiés par le serveur (voir src/features/auth/authService.ts → HttpAuthService),
   les codes sont hachés côté serveur et jamais livrés au navigateur. */
import type { Role } from "@/data/types";

export type DemoUser = {
  /** Identifiant personnel saisi à la connexion (badge). */
  id: string;
  /** Code personnel de démonstration (6 chiffres). */
  code: string;
  role: Role;
  displayName: string;
  /** Fonction affichée sous le nom. */
  title: string;
  /** Lien vers le dossier de l’équipage (src/data/demo/crew.ts) — astronautes et médecin de bord. */
  crewId?: string;
};

/** Compte canonique ouvert quand on choisit un rôle, sans identifiant ni code. */
export const ROLE_ENTRY: Record<Role, string> = {
  astronaute: "AST-001",
  "medecin-bord": "CMO-001",
  nasa: "NASA-FS-001",
};

export const DEMO_USERS: DemoUser[] = [
  { id: "AST-001", code: "482105", role: "astronaute", displayName: "Lina Kovacs", title: "Ingénieure de vol", crewId: "LK" },
  { id: "AST-002", code: "130742", role: "astronaute", displayName: "Alex Morgan", title: "Commandant", crewId: "AM" },
  { id: "AST-003", code: "559031", role: "astronaute", displayName: "Nolan Okafor", title: "Scientifique · médecin de bord", crewId: "NO" },
  { id: "AST-004", code: "246813", role: "astronaute", displayName: "Sofia Reyes", title: "Pilote", crewId: "SR" },
  { id: "CMO-001", code: "731406", role: "medecin-bord", displayName: "Dr Nolan Okafor", title: "Médecin de bord (CMO) · astronaute", crewId: "NO" },
  { id: "NASA-FS-001", code: "905218", role: "nasa", displayName: "Dr Maya Chen", title: "Flight surgeon · MCC Houston" },
  { id: "NASA-FS-002", code: "618847", role: "nasa", displayName: "Dr Daniel Brooks", title: "Flight surgeon · MCC Houston" },
];
