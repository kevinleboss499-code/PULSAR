/* Test de fumée : chaque identifiant de démo → son tableau de bord, gardes de route, erreurs, déconnexion. */
import { expect, test, type Page } from "@playwright/test";
import { DEMO_USERS } from "../src/data/demo/users";

const HOME = { astronaute: "/astronaute", "medecin-bord": "/medecin-bord", nasa: "/nasa" } as const;
const HEADING = { astronaute: "Votre état aujourd’hui", "medecin-bord": "Surveillance équipage", nasa: "Bilan programmé · J127 · 3/4" } as const;

async function login(page: Page, id: string, code: string) {
  await page.goto("/connexion");
  await page.getByLabel("Identifiant personnel").fill(id);
  await page.getByLabel("Code personnel", { exact: true }).fill(code);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test("sans session, toute page protégée renvoie vers /connexion", async ({ page }) => {
  for (const p of ["/astronaute", "/medecin-bord/dossier/LK", "/nasa/reponse"]) {
    await page.goto(p);
    await expect(page).toHaveURL(/\/connexion$/);
  }
});

for (const u of DEMO_USERS) {
  test(`${u.id} (${u.role}) → son tableau de bord uniquement, puis déconnexion`, async ({ page }) => {
    await login(page, u.id, u.code);
    await expect(page).toHaveURL(new RegExp(`${HOME[u.role]}$`));
    await expect(page.locator(".r-user")).toContainText(u.displayName);
    await expect(page.locator(".r-user")).toContainText(u.id);
    await expect(page.getByRole("heading", { level: 1, name: HEADING[u.role] })).toBeVisible();
    // Garde : les autres espaces sont interdits → retour sur son propre espace
    for (const other of Object.values(HOME).filter((h) => h !== HOME[u.role])) {
      await page.goto(other);
      await expect(page).toHaveURL(new RegExp(`${HOME[u.role]}$`));
      await expect(page.locator(".r-denied")).toBeVisible();
    }
    // Session persistée (localStorage) : rechargement = toujours connecté
    await page.reload();
    await expect(page.locator(".r-user")).toContainText(u.displayName);
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/connexion$/);
    expect(await page.evaluate(() => localStorage.getItem("pulsar.session"))).toBeNull();
  });
}

test("astronaute : ne voit que ses données + accès montre", async ({ page }) => {
  await login(page, "AST-002", "130742");
  await expect(page.locator(".r-user")).toContainText("Alex");
  await expect(page.getByText("Lina Kovacs")).toHaveCount(0);
  await page.locator('.r-rail a[href="/astronaute/montre"]').click();
  await expect(page.getByRole("heading", { name: "Rien de connecté" })).toBeVisible();
  await expect(page.locator(".watch-prev")).toHaveCount(0);
  await page.getByTestId("watch-connect").click();
  await expect(page.getByRole("button", { name: "Connecter", exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Connecter", exact: true }).first().click();
  await expect(page.locator(".watch-prev")).toBeVisible();
  await expect(page.locator(".live-chart .recharts-line").first()).toBeVisible();
  await page.getByRole("link", { name: /Voir les écrans de la montre/ }).click();
  await expect(page).toHaveURL(/\/astronaute\/montre\/ecrans$/);
  await expect(page.getByRole("heading", { name: "Écrans de la montre" })).toBeVisible();
});

test("médecin de bord : voit tout l’équipage et ouvre un dossier", async ({ page }) => {
  await login(page, "CMO-001", "731406");
  await expect(page.locator(".crew-tile")).toHaveCount(4);
  await page.locator(".crew-tile", { hasText: "Lina Kovacs" }).click();
  await expect(page).toHaveURL(/\/medecin-bord\/dossier\/LK$/);
  await expect(page.getByRole("heading", { level: 1, name: "Lina Kovacs" })).toBeVisible();
  await expect(page.locator(".crew-live .recharts-line").first()).toBeVisible();
  await expect(page.locator(".alert-list li").first()).toBeVisible();
});

test("accueil : un seul écran de connexion, sans choix de profil ni comptes de démo", async ({ page }) => {
  await page.goto("/login"); // ancienne adresse → /connexion
  await expect(page).toHaveURL(/\/connexion$/);
  await expect(page.locator("#login-id")).toBeVisible();
  await expect(page.locator("#login-code")).toBeVisible();
  await expect(page.getByText(/Choix du profil|Comptes de démonstration/)).toHaveCount(0);
  for (const id of ["AST-001", "CMO-001", "NASA-FS-001"]) await expect(page.getByText(id, { exact: false })).toHaveCount(0);
  await expect(page.locator("main button, form button")).toHaveCount(2); // afficher/masquer le code + valider
});

test("NASA : liste des rapports et réponse", async ({ page }) => {
  await login(page, "NASA-FS-002", "618847");
  await expect(page.locator(".rep")).toHaveCount(4);
  await page.locator('.r-rail a[href="/nasa/reponse"]').click();
  await expect(page).toHaveURL(/\/nasa\/reponse$/);
});

test("erreurs de connexion : vide, format, identifiant inconnu, code faux", async ({ page }) => {
  await page.goto("/connexion");
  const submit = page.getByRole("button", { name: "Se connecter" });
  const err = page.locator("#login-error");
  await submit.click();
  await expect(err).toHaveAttribute("data-code", "EMPTY");
  await page.getByLabel("Identifiant personnel").fill("lina");
  await page.getByLabel("Code personnel", { exact: true }).fill("123456");
  await submit.click();
  await expect(err).toHaveAttribute("data-code", "BAD_FORMAT");
  await page.getByLabel("Identifiant personnel").fill("AST-999");
  await submit.click();
  await expect(err).toHaveAttribute("data-code", "UNKNOWN_ID");
  await page.getByLabel("Identifiant personnel").fill("ast-001");
  await page.getByLabel("Code personnel", { exact: true }).fill("000000");
  await submit.click();
  await expect(err).toHaveAttribute("data-code", "BAD_CODE");
  await expect(page.getByLabel("Code personnel", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL(/\/connexion$/);
});
