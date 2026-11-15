/// <reference types="vite/client" />
interface ImportMetaEnv {
  /** "true" pour activer les planches de dev (?stillset, ?wtgrid, ?wt, ?still) dans un build de production. */
  readonly VITE_DEV_TOOLS?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
interface ImportMetaEnv {
  /** URL de l’API d’authentification réelle. Absente → comptes de démo (DemoAuthService). */
  readonly VITE_AUTH_API_URL?: string;
}
interface ImportMetaEnv {
  /** URL du backend FastAPI (défaut http://localhost:8000). */
  readonly VITE_API_URL?: string;
  /** "true" = simulateur local uniquement (aucun appel réseau). */
  readonly VITE_USE_MOCK?: string;
}
