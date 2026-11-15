/* Routeur principal.
   /                     → page d’accueil publique (présentation de PULSAR)
   /connexion            → connexion (identifiant personnel + code) ; /login redirige ici
   /astronaute/*         → tableau de bord Astronaute (rôle « astronaute »)
   /medecin-bord/*       → tableau de bord Médecin de bord (rôle « medecin-bord »)
   /nasa/*               → tableau de bord NASA Houston (rôle « nasa »)
   Chaque espace est protégé par <RequireRole> et chargé à la demande (code splitting). */
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { MotionConfig } from "motion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NoticeHost, ThemeProvider } from "@/components/ui";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { RequireRole } from "@/features/auth/RequireRole";
import { LoginPage } from "@/features/auth/LoginPage";
import { homeFor } from "@/features/auth/roles";
import { LangProvider, useLang } from "@/i18n";
import { hasDevPage } from "./dev/flags";
import { SoundProvider } from "@/features/sound";
const LandingPage = lazy(() => import("@/features/landing/LandingPage"));
const DevPages = lazy(() => import("./dev/DevPages"));

const AstronauteApp = lazy(() => import("@/features/astronaute/AstronauteApp"));
const MedecinBordApp = lazy(() => import("@/features/medecin-bord/MedecinBordApp"));
const NasaApp = lazy(() => import("@/features/nasa/NasaApp"));

function Fallback() { const { user } = useAuth(); return <Navigate to={user ? homeFor(user.role) : "/"} replace />; }
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 1000 } } });
function Loading() {
  const { t } = useLang();
  return <p className="app-loading" role="status">{t.loading}</p>;
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
      <MotionConfig reducedMotion="user">
        <NoticeHost />
        {hasDevPage ? <Suspense fallback={null}><DevPages /></Suspense> : (
          <QueryClientProvider client={queryClient}>
          <AuthProvider>
          <SoundProvider>
            <BrowserRouter>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/connexion" element={<LoginPage />} />
                  <Route path="/login" element={<Navigate to="/connexion" replace />} />
                  <Route path="/astronaute/*" element={<RequireRole role="astronaute"><AstronauteApp /></RequireRole>} />
                  <Route path="/medecin-bord/*" element={<RequireRole role="medecin-bord"><MedecinBordApp /></RequireRole>} />
                  <Route path="/nasa/*" element={<RequireRole role="nasa"><NasaApp /></RequireRole>} />
                  <Route path="*" element={<Fallback />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </SoundProvider>
          </AuthProvider>
          </QueryClientProvider>
        )}
      </MotionConfig>
      </LangProvider>
    </ThemeProvider>
  );
}
