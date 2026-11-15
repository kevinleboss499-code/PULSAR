/* Parcours fonctionnels : page d’accueil, prédictions et solutions par rôle, gamification, son. */
import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, id: string, code: string) {
  await page.goto("/connexion");
  await page.getByLabel("Identifiant personnel").fill(id);
  await page.getByLabel("Code personnel", { exact: true }).fill(code);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/astronaute|medecin-bord|nasa/);
}

test("page d’accueil publique : sections, CTA vers /connexion", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("pulsar.landing.intro", "1"));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PULSAR");
  await expect(page.getByText("La santé de l’équipage")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cinq dangers du vol spatial habité" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ce dont vous avez besoin", level: 3 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Du poignet à Houston" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trois rôles, un identifiant" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Montre et constantes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vos constantes" })).toBeVisible();
  await page.getByRole("tab", { name: /Distance de la Terre/ }).click();
  await expect(page.locator(".lp-hz-body")).toContainText("Latence");
  await expect(page.locator(".lp-film-sun").first()).toBeVisible();
  await expect(page.locator(".lp-live .recharts-line").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Entrer dans votre espace" })).toBeVisible();
  await page.getByTestId("cta-hero").click();
  await expect(page).toHaveURL(/\/connexion$/);
  await page.locator("a.login-back").click();
  await expect(page).toHaveURL(/\/$/);
});

test("utilisateur connecté : /connexion renvoie vers son tableau de bord, CTA « Mon espace »", async ({ page }) => {
  await login(page, "NASA-FS-001", "905218");
  await page.goto("/connexion");
  await expect(page).toHaveURL(/\/nasa$/);
  await page.goto("/");
  await expect(page.getByTestId("cta-nav")).toHaveText(/Mon espace/);
});

test("astronaute : ses prévisions et solutions uniquement, actions Marquer fait / Escalader", async ({ page }) => {
  await login(page, "AST-001", "482105");
  await page.locator('.r-rail a[href="/astronaute/predictions"]').click();
  await expect(page.getByRole("heading", { level: 1, name: "Vos prévisions" })).toBeVisible();
  await expect(page.locator(".forecast")).toHaveCount(7);
  await expect(page.getByText("prévenez le médecin de bord")).toBeVisible();
  await expect(page.locator(".pred")).toHaveAttribute("data-astronaut", "LK");
  for (const other of ["Alex Morgan", "Sofia Reyes"]) await expect(page.getByText(other)).toHaveCount(0);
  await expect(page.locator(".inspector")).toHaveCount(0); // vue simple, pas d’inspecteur
  const first = page.locator(".sol").first();
  await first.getByRole("button", { name: /Marquer fait/ }).click();
  await expect(first).toHaveAttribute("data-status", "faite");
  const hydra = page.locator('.sol[data-id="RC-LK-02"]');
  await hydra.getByRole("button", { name: /Escalader au médecin de bord/ }).click();
  await expect(hydra).toContainText("Escaladé · médecin de bord");
  // l’astronaute ne peut pas ouvrir les prédictions de l’équipage
  await page.goto("/medecin-bord/predictions/AM");
  await expect(page).toHaveURL(/\/astronaute$/);
  await expect(page.locator(".r-denied")).toBeVisible();
});

test("médecin de bord : prédictions de tout l’équipage, inspecteur, valider / remplacer une solution", async ({ page }) => {
  await login(page, "CMO-001", "731406");
  await page.goto("/medecin-bord/predictions/LK");
  await expect(page.locator(".pred-crew button")).toHaveCount(4);
  await expect(page.locator(".anom-list")).toContainText("Autoencodeur LSTM");
  await expect(page.locator(".contrib-row").first()).toBeVisible();
  await page.locator('.forecast[data-metric="heart_rate"] .forecast-inspect').click();
  await expect(page.locator(".inspector")).toContainText("≥ 100 bpm");
  await expect(page.locator(".lad tr.is-limit").first()).toBeVisible();
  const s1 = page.locator('.sol[data-id="RC-LK-02"]');
  await s1.getByRole("button", { name: "Valider" }).click();
  await expect(s1).toHaveAttribute("data-status", "validee");
  const s2 = page.locator('.sol[data-id="RC-LK-03"]');
  await s2.getByRole("button", { name: /Remplacer/ }).click();
  await s2.getByLabel("Nouvelle consigne").fill("Repos complet jusqu’à 18:00");
  await s2.getByRole("button", { name: "Enregistrer" }).click();
  await expect(s2).toHaveAttribute("data-status", "remplacee");
  await expect(s2).toContainText("Repos complet jusqu’à 18:00");
  await page.locator(".pred-crew button", { hasText: "Alex Morgan" }).click();
  await expect(page).toHaveURL(/predictions\/AM$/);
  await expect(page.locator('.sol[data-id="RC-AM-01"]')).toContainText("abri anti-radiations");
});

test("médecin de bord : conducteur de temps temps réel / fixe", async ({ page }) => {
  await login(page, "CMO-001", "731406");
  await page.goto("/medecin-bord/dossier/LK");
  await page.getByRole("button", { name: /Fixe/ }).click();
  await expect(page.getByTestId("conductor-range")).toBeVisible();
  await page.getByRole("button", { name: /Temps réel/ }).click();
  await expect(page.getByTestId("conductor-range")).toHaveCount(0);
});

test("NASA : le rapport inclut la synthèse des prédictions et anomalies", async ({ page }) => {
  await login(page, "NASA-FS-001", "905218");
  await page.goto("/nasa/rapport/R-127-03");
  await expect(page.getByRole("heading", { name: /Prédictions et anomalies/ })).toBeVisible();
  await expect(page.locator(".pred-table tbody tr")).toHaveCount(4);
  await expect(page.locator('.pred-table tr[data-id="LK"]')).toContainText("FC de repos");
});

test("NASA : l’échographie nomme le patient, la coupe et la mesure", async ({ page }) => {
  await login(page, "NASA-FS-001", "905218");
  await page.goto("/nasa/rapport/R-127-03");
  const echo = page.getByTestId("echo-review");
  await expect(echo).toContainText("Lina Kovacs");
  await expect(echo).toContainText("Coupe apicale 4 cavités");
  await expect(echo.getByTestId("echo-dossier")).toContainText("4,1 cm");
  await expect(echo.getByTestId("echo-dossier")).toContainText("Dans les limites");
  await expect(echo.getByTestId("echo-dossier")).toContainText("3,5–5,6 cm");
  await echo.getByRole("button", { name: /Clip 6 s/ }).click();
  await expect(echo.getByTestId("echo-dossier")).toContainText("Aucune mesure sur ce clip");
  await expect(echo.getByTestId("echo-dossier")).not.toContainText("4,1 cm");
  await page.goto("/nasa/rapport/R-126-01");
  await expect(page.getByTestId("echo-review")).toContainText("Alex Morgan");
  await expect(page.getByTestId("echo-review")).toContainText("Nerf optique");
  await expect(page.getByTestId("echo-review")).not.toContainText("Lina Kovacs");
  await page.goto("/nasa/rapport/R-126-A1");
  await expect(page.getByTestId("echo-review")).toContainText("Aucune image");
  await expect(page.getByTestId("echo-review")).not.toContainText("Lina Kovacs");
  await page.goto("/nasa/reponse");
  const send = page.getByRole("button", { name: /Mettre en file/ });
  await expect(send).toBeDisabled();
  await expect(page.getByTestId("echo-target")).toContainText("Lina Kovacs");
  await expect(page.getByTestId("echo-target")).toContainText("4,1 cm");
  await page.getByRole("checkbox", { name: /identité, la coupe et la mesure/ }).check();
  await expect(send).toBeEnabled();
});

test("gamification : missions, série, objectif d’équipage ; désactivation persistante", async ({ page }) => {
  await login(page, "AST-002", "130742");
  await expect(page.getByTestId("goals-strip")).toBeVisible();
  await page.locator('.r-rail a[href="/astronaute/objectifs"]').click();
  await expect(page.locator(".badges li")).toHaveCount(10);
  await expect(page.getByText("Sept orbites")).toBeVisible();
  await expect(page.locator(".grade-now")).toContainText("Argent");
  await expect(page.getByText("jamais de vos valeurs de santé")).toBeVisible();
  await expect(page.getByTestId("missions-count")).toHaveText("2/7");
  await page.getByRole("checkbox", { name: /Glycémie à jeun/ }).click();
  await expect(page.getByTestId("missions-count")).toHaveText("3/7");
  await page.locator('.r-rail a[href="/astronaute/reglages"]').click();
  await page.getByRole("switch", { name: "Gamification" }).click();
  await expect(page.locator('.r-rail a[href="/astronaute/objectifs"]')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("switch", { name: "Gamification" })).toHaveAttribute("aria-checked", "false");
  await page.goto("/astronaute");
  await expect(page.getByTestId("goals-strip")).toHaveCount(0);
  await page.goto("/astronaute/objectifs");
  await expect(page).toHaveURL(/\/astronaute\/reglages$/);
  await page.goto("/astronaute/montre");
  await expect(page.locator(".wt-comp")).toHaveCount(0);
});

test("médecin de bord : participation à l’objectif d’équipage, sans valeurs de santé", async ({ page }) => {
  await login(page, "CMO-001", "731406");
  const card = page.locator(".r-card", { hasText: "Objectif d’équipage · participation" });
  await expect(card).toBeVisible();
  await expect(card.locator(".participation li")).toHaveCount(4);
  await expect(card).not.toContainText("bpm");
});

test("son : alarme orange visuelle silencieuse + rouge non coupable", async ({ page }) => {
  await login(page, "CMO-001", "731406");
  await expect(page.locator('.alarm[data-level="orange"]').first()).toBeVisible(); // visuel toujours présent
  await page.getByTestId("sound-menu").click();
  await page.getByTestId("sound-mute").click();
  await expect(page.getByTestId("sound-mute")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator('input[data-cat="alarmHigh"]')).toBeDisabled();
  await expect(page.locator('input[data-cat="badge"]')).toHaveCount(0); // hors rouge : pas de case son
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("pulsar.sound") || "{}"));
  expect(saved.muted).toBe(true);
  expect(saved.categories?.alarmHigh !== false).toBe(true);
  await page.getByTestId("sound-menu").click();
  await page.locator(".sound-tests summary").click();
  await page.getByTestId("sound-test-red").scrollIntoViewIfNeeded();
  await page.getByTestId("sound-test-red").click({ force: true });
  await page.keyboard.press("Escape"); // ferme le panneau son
  await expect(page.getByRole("dialog", { name: "Réglages du son" })).toHaveCount(0);
  const red = page.locator('.alarm[data-level="rouge"]');
  await expect(red).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window.__pulsarSoundLog ?? []).filter((e) => e.id === "alarmHigh").length)).toBeGreaterThan(0); // joue malgré la sourdine
  await red.getByRole("button", { name: /Pause 2 min/ }).click();
  await expect(red).toContainText("Pause");
  await red.getByRole("button", { name: "Acquitter" }).click();
  await expect(red).toHaveCount(0);
});
