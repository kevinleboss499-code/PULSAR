import { defineConfig, devices } from "@playwright/test";

// Test de fumée : connexion avec chaque identifiant de démo → bon tableau de bord, garde des routes, déconnexion.
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4173", viewport: { width: 1194, height: 834 }, locale: "fr-FR" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1194, height: 834 } } }],
  webServer: { command: "npm run build && npm run preview -- --port 4173 --strictPort", env: { VITE_USE_MOCK: "true" }, url: "http://localhost:4173", reuseExistingServer: true, timeout: 180_000 },
});
