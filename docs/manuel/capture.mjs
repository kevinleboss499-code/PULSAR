/**
 * Captures des écrans PULSAR pour le manuel PDF.
 * Prérequis : `npm run dev` dans frontend/ (http://localhost:5173).
 * Lancer depuis frontend/ : node ../docs/manuel/capture.mjs
 */
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire("d:/PULSAR-PROJECT/frontend/package.json");
const { chromium } = require("playwright");

const BASE = process.env.PULSAR_URL || "http://localhost:5173";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "captures");
const VIEW = { width: 1280, height: 820 };

async function prep(page, { theme = "dark", lang = "fr" } = {}) {
  await page.addInitScript(({ theme, lang }) => {
    try {
      localStorage.setItem("pulsar-theme", theme);
      localStorage.setItem("pulsar.lang", lang);
      localStorage.setItem("pulsar.nav", "open");
      sessionStorage.setItem("pulsar.landing.intro", "1");
    } catch { /* ignore */ }
  }, { theme, lang });
}

async function settle(page, ms = 700) {
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(ms);
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  console.log("ok", name);
}

async function go(page, url, wait = 900) {
  await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
  await settle(page, wait);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function shotScroll(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await shot(page, `${name}-haut`);
  const tall = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 140);
  if (!tall) return;
  await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.88)));
  await page.waitForTimeout(350);
  await shot(page, `${name}-suite`);
  const more = await page.evaluate(() => window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 100);
  if (!more) return;
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);
  await shot(page, `${name}-bas`);
}

async function login(page, id, code) {
  await go(page, "/connexion", 400);
  await page.getByLabel("Identifiant personnel").fill(id);
  await page.getByLabel("Code personnel", { exact: true }).fill(code);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((u) => !u.pathname.includes("connexion"), { timeout: 20000 });
  await settle(page, 900);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--disable-dev-shm-usage"],
  }).catch(async () => chromium.launch());
  const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1, locale: "fr-FR" });
  await prep(page);

  await go(page, "/", 500);
  await shot(page, "00-accueil-hero");
  for (const id of ["mission", "parcours", "roles", "demo"]) {
    const el = page.locator(`#${id}`);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await el.screenshot({ path: path.join(OUT, `00-accueil-${id}.png`) });
    console.log("ok", `00-accueil-${id}`);
  }
  const cta = page.locator("#cta-t");
  await cta.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, "00-accueil-entrer.png") });

  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await shot(page, "00-accueil-en");
  await page.getByRole("button", { name: "FR", exact: true }).click();

  await go(page, "/connexion", 400);
  await shot(page, "01-connexion");
  await page.getByLabel("Identifiant personnel").fill("AST-001");
  await page.getByLabel("Code personnel", { exact: true }).fill("000000");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForTimeout(700);
  await shot(page, "01-connexion-erreur");

  await page.evaluate(() => localStorage.setItem("pulsar-theme", "light"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page, 400);
  await shot(page, "01-connexion-clair");
  await page.evaluate(() => localStorage.setItem("pulsar-theme", "dark"));

  await login(page, "AST-001", "482105");
  await shotScroll(page, "a-accueil");
  await page.getByRole("button", { name: "Mode clair" }).click();
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "a-accueil-clair");
  await page.getByRole("button", { name: "Mode sombre" }).click();
  await page.waitForTimeout(200);

  const astro = [
    ["/astronaute/silhouette", "a-silhouette", 1600],
    ["/astronaute/predictions", "a-previsions", 1200],
    ["/astronaute/scan", "a-scan", 800],
    ["/astronaute/kits", "a-kits", 800],
    ["/astronaute/bien-etre", "a-bien-etre", 600],
    ["/astronaute/rappels", "a-rappels", 500],
    ["/astronaute/objectifs", "a-objectifs", 800],
    ["/astronaute/reglages", "a-reglages", 600],
    ["/astronaute/montre/ecrans", "a-montre-galerie", 600],
  ];
  for (const [url, name, wait] of astro) {
    await go(page, url, wait);
    await shotScroll(page, name);
  }

  await page.evaluate(() => localStorage.removeItem("pulsar.watch.LK"));
  await go(page, "/astronaute/montre", 600);
  await shot(page, "a-montre-porte");
  await page.getByTestId("watch-connect").click();
  await page.waitForTimeout(1800);
  await shot(page, "a-montre-detectee");
  await page.getByRole("button", { name: "Connecter" }).first().click();
  await page.waitForTimeout(900);
  await shotScroll(page, "a-montre");

  await go(page, "/astronaute/mode-bras", 500);
  await shot(page, "a-mode-bras");
  await page.evaluate(() => localStorage.setItem("pulsar-theme", "light"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle(page, 400);
  await shot(page, "a-mode-bras-clair");
  await page.evaluate(() => localStorage.setItem("pulsar-theme", "dark"));

  await page.getByRole("button", { name: "Son" }).click().catch(() => {});
  await login(page, "CMO-001", "731406");
  await shotScroll(page, "m-tableau");
  await page.getByRole("button", { name: "Mode clair" }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await shot(page, "m-tableau-clair");
  await page.getByRole("button", { name: "Mode sombre" }).click();

  await go(page, "/medecin-bord/dossier/LK", 1400);
  await shotScroll(page, "m-dossier");
  await go(page, "/medecin-bord/predictions/LK", 1200);
  await shotScroll(page, "m-predictions");
  await go(page, "/medecin-bord/journal", 600);
  await shot(page, "m-journal");

  await page.evaluate(() => localStorage.removeItem("pulsar.echo.exam"));
  await go(page, "/medecin-bord/echographie/1", 700);
  await shot(page, "m-echo-1");
  const exam = {
    linked: true,
    battery: 76,
    checks: [true, true, true],
    reached: 6,
    zone: "heart",
    placed: true,
    note: "Coupe 4 cavités. VG 4,1 cm. Pas d’épanchement visible. Avis du sol souhaité.",
  };
  await page.evaluate((exam) => localStorage.setItem("pulsar.echo.exam", JSON.stringify(exam)), exam);
  for (const n of [2, 3, 4, 5, 6]) {
    await go(page, `/medecin-bord/echographie/${n}`, 900);
    await shot(page, `m-echo-${n}`);
  }

  await login(page, "NASA-FS-001", "905218");
  await shotScroll(page, "n-rapports");
  await page.getByRole("button", { name: "Mode clair" }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await shot(page, "n-rapports-clair");
  await page.getByRole("button", { name: "Mode sombre" }).click();

  await go(page, "/nasa/rapport/R-127-03", 800);
  await shotScroll(page, "n-rapport");
  await go(page, "/nasa/rapport/R-126-A1", 700);
  await shot(page, "n-rapport-rouge");
  await go(page, "/nasa/reponse", 600);
  await shotScroll(page, "n-reponse");
  await go(page, "/nasa/liaison", 600);
  await shot(page, "n-liaison");

  await page.getByRole("button", { name: "Son" }).click();
  await page.waitForTimeout(300);
  await shot(page, "n-son-menu");

  await browser.close();
  console.log("captures dans", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
