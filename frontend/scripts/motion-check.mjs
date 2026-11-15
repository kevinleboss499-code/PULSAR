import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1194, height: 834 }, locale: "fr-FR" });
await page.goto("http://localhost:5173/connexion", { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  const now = Date.now();
  localStorage.setItem("pulsar.session", JSON.stringify({
    user: { id: "AST-001", role: "astronaute", displayName: "Lina Kovacs", title: "Ingénieure de vol", crewId: "LK" },
    token: "demo.check",
    issuedAt: now,
    expiresAt: now + 12 * 3600_000,
  }));
});
await page.goto("http://localhost:5173/astronaute/objectifs", { waitUntil: "domcontentloaded" });
const hud = page.getByTestId("mission-hud");
await hud.waitFor();
const box = await hud.boundingBox();
console.log("box", JSON.stringify(box));
await hud.screenshot({ path: "scripts/hud-early.png" });
await page.waitForTimeout(280);
await hud.screenshot({ path: "scripts/hud-mid.png" });
await page.waitForTimeout(900);
await hud.screenshot({ path: "scripts/hud-late.png" });
const badges = page.locator(".badges").first();
await badges.screenshot({ path: "scripts/badges.png" });
const info = await page.evaluate(() => {
  const svg = document.querySelector(".hud-plot svg");
  const tip = document.querySelector(".hud-tip");
  const disc = document.querySelector(".bd-disc");
  const bar = document.querySelector(".hud-timeline li");
  const dial = document.querySelector(".mission-hud-dial .hud-dial-read strong");
  const zones = document.querySelector(".hud-readout b");
  const cs = (el) => (el ? getComputedStyle(el) : null);
  return {
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    draw: cs(svg)?.animationName,
    clip: cs(svg)?.clipPath,
    tipAnim: cs(tip)?.animationName,
    tipLeft: cs(tip)?.left,
    bars: document.querySelectorAll(".hud-bar").length,
    traces: document.querySelectorAll(".hud-plot").length,
    discAnim: cs(disc)?.animationName,
    discDash: cs(disc)?.strokeDasharray,
    discOffset: cs(disc)?.strokeDashoffset,
    rise: cs(bar)?.animationName,
    dial: dial?.textContent,
    zones: zones?.textContent,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.getByTestId("exercise-btn").evaluate((el) => el.click());
await page.waitForTimeout(500);
const running = await page.evaluate(() => ({
  live: document.querySelector(".hud-live")?.textContent?.trim(),
  zones: document.querySelector(".hud-readout b")?.textContent,
  done: document.querySelectorAll(".hud-status li.is-done").length,
}));
console.log(JSON.stringify(running));
await page.screenshot({ path: "scripts/motion-exercise.png" });
await browser.close();
