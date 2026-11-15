/** Recapture accueil astronaute + mode bras, sans clic parasite. */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire("d:/PULSAR-PROJECT/frontend/package.json");
const { chromium } = require("playwright");
const BASE = "http://localhost:5173";
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "captures");
const VIEW = { width: 1280, height: 820 };
const UNFOLD = `
  html, body { height: auto !important; overflow: visible !important; }
  .r-shell { height: auto !important; min-height: 100dvh !important; overflow: visible !important; }
  .r-stage, .r-main { height: auto !important; max-height: none !important; overflow: visible !important; }
  .r-side { position: sticky; top: 12px; align-self: start; height: calc(100vh - 24px); }
  .arm-toggle { display: none !important; }
`;

async function ack(page) {
  for (let i = 0; i < 6; i++) {
    const more = page.getByRole("button", { name: /autre alarme/ });
    if (await more.count()) await more.first().click();
    const btn = page.getByRole("button", { name: "Acquitter" });
    if (!(await btn.count())) break;
    await btn.first().click();
    await page.waitForTimeout(200);
  }
}

async function main() {
  const browser = await chromium.launch({ channel: "chrome" }).catch(async () => chromium.launch());
  const page = await browser.newPage({ viewport: VIEW, locale: "fr-FR" });
  await page.addInitScript(() => {
    localStorage.setItem("pulsar-theme", "dark");
    localStorage.setItem("pulsar.lang", "fr");
    localStorage.setItem("pulsar.nav", "open");
    sessionStorage.setItem("pulsar.landing.intro", "1");
  });
  await page.goto(BASE + "/connexion", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Identifiant personnel").fill("AST-001");
  await page.getByLabel("Code personnel", { exact: true }).fill("482105");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/astronaute/, { timeout: 20000 });
  await page.waitForTimeout(800);
  await ack(page);
  await page.addStyleTag({ content: UNFOLD });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUT, "a-accueil-1.png") });
  await page.evaluate((y) => window.scrollTo(0, y), 650);
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, "a-accueil-2.png") });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, "a-accueil-3.png") });
  console.log("accueil ok");

  await page.goto(BASE + "/astronaute/mode-bras", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "a-mode-bras.png") });
  await page.evaluate(() => localStorage.setItem("pulsar-theme", "light"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "a-mode-bras-clair.png") });
  console.log("bras ok");
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
