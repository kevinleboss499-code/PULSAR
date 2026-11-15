import type { Role } from "@/data/types";

/** Utilisateur connecté (jamais de code/mot de passe ici). */
export type AuthUser = {
  id: string;            // identifiant personnel, ex. "AST-001"
  role: Role;
  displayName: string;
  title: string;
  crewId?: string;       // lien vers le dossier d’équipage (astronautes, médecin de bord)
};

export type Session = {
  user: AuthUser;
  token: string;         // jeton opaque (démo : aléatoire ; prod : renvoyé par l’API)
  issuedAt: number;      // epoch ms
  expiresAt: number;     // epoch ms
};

export type AuthErrorCode = "EMPTY" | "BAD_FORMAT" | "UNKNOWN_ID" | "BAD_CODE" | "LOCKED" | "NETWORK";

export class AuthError extends Error {
  constructor(public code: AuthErrorCode, message: string, public retryInSec?: number) { super(message); this.name = "AuthError"; }
}
