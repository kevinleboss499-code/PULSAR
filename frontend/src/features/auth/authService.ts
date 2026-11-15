/* Service d’authentification — POINT DE BRANCHEMENT DU BACKEND.
   L’interface `AuthService` est la seule chose dont dépend l’interface utilisateur.
   - DemoAuthService : comptes de démo locaux (src/data/demo/users.ts), session dans localStorage.  ← actif par défaut
   - HttpAuthService : squelette pour une vraie API (activé si VITE_AUTH_API_URL est défini).
   Pour passer en production : implémenter HttpAuthService côté serveur (POST /auth/login, POST /auth/logout,
   GET /auth/me), supprimer src/data/demo/users.ts, et renvoyer un message d’erreur générique
   (« Identifiant ou code incorrect ») pour ne pas révéler quels identifiants existent. */
import { DEMO_USERS } from "@/data/demo/users";
import { AuthError, type AuthUser, type Session } from "./types";
import { roleFromId } from "./roles";

export interface AuthService {
  /** Vérifie identifiant + code. Lève AuthError en cas d’échec. */
  login(identifier: string, code: string): Promise<Session>;
  logout(): Promise<void>;
  /** Session mémorisée encore valide, sinon null (appelé au démarrage). */
  restore(): Session | null;
}

export const SESSION_KEY = "pulsar.session";
const SESSION_HOURS = 12;
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

export const normalizeId = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

function save(s: Session) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
function read(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as Session | null;
    if (!s || !s.user || typeof s.expiresAt !== "number" || s.expiresAt < Date.now()) { localStorage.removeItem(SESSION_KEY); return null; }
    return s;
  } catch { localStorage.removeItem(SESSION_KEY); return null; }
}
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** ⚠️ DÉMO — vérification locale, aucune sécurité réelle (le code source contient les codes). */
export class DemoAuthService implements AuthService {
  private fails = 0;
  private lockedUntil = 0;

  async login(identifier: string, code: string): Promise<Session> {
    const id = normalizeId(identifier);
    const c = code.trim();
    if (!id || !c) throw new AuthError("EMPTY", "Renseignez votre identifiant et votre code personnel.");
    const role = roleFromId(id);
    if (!role) throw new AuthError("BAD_FORMAT", "Format d’identifiant inattendu. Exemple : AST-001, CMO-001 ou NASA-FS-001 (voir votre badge).");
    const left = Math.ceil((this.lockedUntil - Date.now()) / 1000);
    if (left > 0) throw new AuthError("LOCKED", `Trop d’essais. Réessayez dans ${left} s.`, left);
    await delay(350); // latence réseau simulée
    const u = DEMO_USERS.find((x) => x.id === id);
    if (!u || u.code !== c) {
      this.fails += 1;
      if (this.fails >= MAX_ATTEMPTS) { this.fails = 0; this.lockedUntil = Date.now() + LOCK_SECONDS * 1000; throw new AuthError("LOCKED", `Trop d’essais. Réessayez dans ${LOCK_SECONDS} s.`, LOCK_SECONDS); }
      const rest = MAX_ATTEMPTS - this.fails;
      if (!u) throw new AuthError("UNKNOWN_ID", `Identifiant inconnu. Vérifiez votre badge. (${rest} essai${rest > 1 ? "s" : ""} restant${rest > 1 ? "s" : ""})`);
      throw new AuthError("BAD_CODE", `Code incorrect pour ${id}. (${rest} essai${rest > 1 ? "s" : ""} restant${rest > 1 ? "s" : ""})`);
    }
    this.fails = 0;
    const user: AuthUser = { id: u.id, role, /* rôle déduit de l’identifiant */ displayName: u.displayName, title: u.title, crewId: u.crewId };
    const now = Date.now();
    const s: Session = { user, token: `demo.${crypto.randomUUID()}`, issuedAt: now, expiresAt: now + SESSION_HOURS * 3600_000 };
    save(s);
    return s;
  }
  async logout() { localStorage.removeItem(SESSION_KEY); }
  restore() { return read(); }
}

/** Squelette pour la vraie API (non utilisé tant que VITE_AUTH_API_URL n’est pas défini). */
export class HttpAuthService implements AuthService {
  constructor(private baseUrl: string) {}
  async login(identifier: string, code: string): Promise<Session> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ identifier: normalizeId(identifier), code }) });
    } catch { throw new AuthError("NETWORK", "Serveur injoignable. Vérifiez le réseau de bord."); }
    if (res.status === 429) throw new AuthError("LOCKED", "Trop d’essais. Réessayez plus tard.");
    if (!res.ok) throw new AuthError("BAD_CODE", "Identifiant ou code incorrect.");
    const s = (await res.json()) as Session;
    save(s);
    return s;
  }
  async logout() { try { await fetch(`${this.baseUrl}/auth/logout`, { method: "POST", credentials: "include" }); } finally { localStorage.removeItem(SESSION_KEY); } }
  restore() { return read(); }
}

const API = import.meta.env.VITE_AUTH_API_URL as string | undefined;
export const authService: AuthService = API ? new HttpAuthService(API) : new DemoAuthService();
export const IS_DEMO_AUTH = !API;
