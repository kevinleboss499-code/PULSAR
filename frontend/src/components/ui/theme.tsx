/* Thème clair / sombre — mémorisé (localStorage « pulsar-theme »), sinon préférence système.
   Affichage : bascule « modes » (Espace / Clinique) dans la barre d’outils. */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

export type Theme = "light" | "dark";
const KEY = "pulsar-theme";
const Ctx = createContext<{ theme: Theme; toggle: () => void; setTheme: (t: Theme) => void }>({
  theme: "dark",
  toggle: () => {},
  setTheme: () => {},
});

function initial(): Theme {
  const q = new URLSearchParams(window.location.search).get("theme");
  if (q === "light" || q === "dark") return q;
  const saved = localStorage.getItem(KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initial);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  const setTheme = useCallback((n: Theme) => {
    localStorage.setItem(KEY, n);
    setThemeState(n);
  }, []);
  const toggle = useCallback(() => {
    setThemeState((t) => {
      const n = t === "dark" ? "light" : "dark";
      localStorage.setItem(KEY, n);
      return n;
    });
  }, []);
  return <Ctx.Provider value={{ theme, toggle, setTheme }}>{children}</Ctx.Provider>;
}
export const useTheme = () => useContext(Ctx);

/** Bascule visuelle : icônes seules (sombre / clair). */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-modes" role="group" aria-label="Mode d’affichage">
      <button
        type="button"
        className="theme-modes__btn"
        aria-pressed={theme === "dark"}
        aria-label="Mode sombre"
        onClick={() => setTheme("dark")}
        title="Mode sombre"
      >
        <Icon name="dark_mode" size={16} />
      </button>
      <button
        type="button"
        className="theme-modes__btn"
        aria-pressed={theme === "light"}
        aria-label="Mode clair"
        onClick={() => setTheme("light")}
        title="Mode clair"
      >
        <Icon name="light_mode" size={16} />
      </button>
    </div>
  );
}
