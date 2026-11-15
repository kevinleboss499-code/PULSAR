/* Contexte d’authentification : session courante + login/logout. Ne parle qu’à `authService`. */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { authService, type AuthService } from "./authService";
import type { AuthUser, Session } from "./types";

type AuthCtx = {
  user: AuthUser | null;
  session: Session | null;
  login: (identifier: string, code: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children, service = authService }: { children: ReactNode; service?: AuthService }) {
  const [session, setSession] = useState<Session | null>(() => service.restore());
  const login = useCallback(async (identifier: string, code: string) => { const s = await service.login(identifier, code); setSession(s); return s.user; }, [service]);
  const logout = useCallback(async () => { await service.logout(); setSession(null); }, [service]);
  const value = useMemo(() => ({ user: session?.user ?? null, session, login, logout }), [session, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return c;
}
