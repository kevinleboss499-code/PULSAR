/** Complète les captures : acquitte les alarmes, déroule le contenu, pages NASA. */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire("d:/PULSAR-PROJECT/frontend/package.json");
const { chromium } = require("playwright");

const BASE = process.env.PULSAR_URL || "http://localhost:5173";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "captures");
const VIEW = { width: 1280, height: 820 };

const UNFOLD = `
  html, body { height: auto !important; overflow: visible !important; }
  .r-shell { height: auto !important; min-height: 100dvh !important; overflow: visible !important; }
  .r-stage, .r-main, .nasa-main, .rep-list, .nasa-layout, .echo-flow {
    height: auto !important; max-height: none !important; overflow: visible !important;
  }
  .r-side { position: sticky; top: 12px; align-self: start; height: calc(100vh - 24px); }
  .arm-toggle { display: none !important; }
`;

async function prep(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("pulsar-theme", "dark");
      localStorage.setItem("pulsar.lang", "fr");
      localStorage.setItem("pulsar.nav", "open");
      sessionStorage.setItem("pulsar.landing.intro", "1");
    } catch { /* ignore */ }
  });
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log("ok", name);
}

async function login(page, id, code) {
  await page.goto(BASE + "/connexion", { waitUntil: "domcontentloaded" });
  if (await page.getByLabel("Identifiant personnel").count()) {
    await page.getByLabel("Identifiant personnel").fill(id);
    await page.getByLabel("Code personnel", { exact: true }).fill(code);
    await page.getByRole("button", { name: "Se connecter" }).click();
  }
  await page.waitForURL((u) => !u.pathname.includes("connexion"), { timeout: 20000 });
  await page.waitForTimeout(800);
}

async function logout(page) {
  const btn = page.getByRole("button", { name: "Se déconnecter" });
  if (await btn.count()) {
    await btn.click();
    await page.waitForURL(/connexion/, { timeout: 10000 });
  }
}

async function clearAlarms(page) {
  await page.locator("body").click({ position: { x: 400, y: 400 } }).catch(() => {});
  for (let i = 0; i < 6; i++) {
    const more = page.getByRole("button", { name: /autre alarme/ });
    if (await more.count()) await more.first().click().catch(() => {});
    const ack = page.getByRole("button", { name: "Acquitter" });
    if (!(await ack.count())) break;
    await ack.first().click();
    await page.waitForTimeout(250);
  }
}

async function slices(page, name) {
  await page.addStyleTag({ content: UNFOLD });
  await page.waitForTimeout(250);
  await page.evaluate(() => window.scrollTo(0, 0));
  const steps = await page.evaluate((vh) => {
    const h = document.documentElement.scrollHeight;
    return Math.min(4, Math.max(1, Math.ceil((h - 30) / (vh * 0.8))));
  }, VIEW.height);
  for (let i = 0; i < steps; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(i * VIEW.height * 0.8));
    await page.waitForTimeout(280);
    await shot(page, steps === 1 ? name : `${name}-${i + 1}`);
  }
}

async function visit(page, url, name, wait = 700) {
  await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(wait);
  await clearAlarms(page);
  await slices(page, name);
}

async function main() {
  const browser = await chromium.launch({ channel: "chrome" }).catch(async () => chromium.launch());
  const page = await browser.newPage({ viewport: VIEW, locale: "fr-FR" });
  await prep(page);

  await login(page, "AST-001", "482105");
  await page.goto(BASE + "/astronaute", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const more = page.getByRole("button", { name: /autre alarme/ });
  if (await more.count()) await more.first().click();
  await page.waitForTimeout(200);
  await shot(page, "coque-alarmes");
  await clearAlarms(page);

  const astro = [
    ["/astronaute", "a-accueil", 900],
    ["/astronaute/silhouette", "a-silhouette", 1400],
    ["/astronaute/predictions", "a-previsions", 1000],
    ["/astronaute/scan", "a-scan", 700],
    ["/astronaute/kits", "a-kits", 700],
    ["/astronaute/bien-etre", "a-bien-etre", 500],
    ["/astronaute/rappels", "a-rappels", 400],
    ["/astronaute/objectifs", "a-objectifs", 700],
    ["/astronaute/reglages", "a-reglages", 500],
    ["/astronaute/montre", "a-montre", 800],
    ["/astronaute/montre/ecrans", "a-galerie", 600],
  ];
  await page.evaluate(() => {
    localStorage.setItem("pulsar.watch.LK", JSON.stringify({
      watchId: "WT-LK-A", watchName: "PULSAR Watch · LK", pairedAt: "2026-11-15T05:00:00.000Z",
    }));
  });
  for (const [url, name, wait] of astro) await visit(page, url, name, wait);

  await page.getByRole("button", { name: "Son" }).click();
  await page.waitForTimeout(300);
  await shot(page, "coque-son");
  await page.keyboard.press("Escape");

  await page.evaluate(() => localStorage.setItem("pulsar-theme", "light"));
  await visit(page, "/astronaute", "a-accueil-clair", 800);
  await page.evaluate(() => localStorage.setItem("pulsar-theme", "dark"));

  await logout(page);
  await login(page, "CMO-001", "731406");
  const cmo = [
    ["/medecin-bord", "m-tableau", 900],
    ["/medecin-bord/dossier/LK", "m-dossier", 1200],
    ["/medecin-bord/predictions/LK", "m-predictions", 1000],
    ["/medecin-bord/journal", "m-journal", 500],
  ];
  for (const [url, name, wait] of cmo) await visit(page, url, name, wait);

  await page.evaluate(() => localStorage.removeItem("pulsar.echo.exam"));
  await visit(page, "/medecin-bord/echographie/1", "m-echo-1", 600);
  const exam = {
    linked: true, battery: 76, checks: [true, true, true], reached: 6,
    zone: "heart", placed: true,
    note: "Coupe 4 cavités. VG 4,1 cm. Pas d’épanchement visible. Avis du sol souhaité.",
  };
  await page.evaluate((exam) => localStorage.setItem("pulsar.echo.exam", JSON.stringify(exam)), exam);
  for (const n of [2, 3, 4, 5, 6]) await visit(page, `/medecin-bord/echographie/${n}`, `m-echo-${n}`, 700);

  await page.evaluate(() => localStorage.setItem("pulsar-theme", "light"));
  await visit(page, "/medecin-bord", "m-tableau-clair", 700);
  await page.evaluate(() => localStorage.setItem("pulsar-theme", "dark"));

  await logout(page);
  await login(page, "NASA-FS-001", "905218");
  const nasa = [
    ["/nasa", "n-rapports", 800],
    ["/nasa/rapport/R-127-03", "n-rapport", 800],
    ["/nasa/rapport/R-126-A1", "n-alerte", 700],
    ["/nasa/reponse", "n-reponse", 600],
    ["/nasa/liaison", "n-liaison", 500],
  ];
  for (const [url, name, wait] of nasa) await visit(page, url, name, wait);
  await page.evaluate(() => localStorage.setItem("pulsar-theme", "light"));
  await visit(page, "/nasa", "n-rapports-clair", 700);

  await browser.close();
  console.log("suite ok");
}

main().catch((err) => { console.error(err); process.exit(1); });
