import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.NOCTURNE_BASE_URL || "http://127.0.0.1:4173";
const out = path.resolve("artifacts/nocturne-visual");
fs.mkdirSync(out, { recursive: true });

const slugs = [
  "first-spark",
  "after-dark",
  "night-shift",
  "heatcheck",
  "us-after-dark",
  "one-two",
  "night-echo",
  "director",
  "pass-the-aux",
];
const sizes = [
  { width: 320, height: 568, label: "iphone-320" },
  { width: 390, height: 844, label: "iphone-390" },
  { width: 430, height: 932, label: "iphone-430" },
];

async function enterPlayer(page) {
  const start = page.getByRole("button", { name: /Die Nacht beginnt|Director starten|Weiterspielen/ }).first();
  if (await start.count()) await start.click();
  await page.waitForTimeout(100);
  for (let i = 0; i < 5; i++) {
    if ((await page.locator('[data-testid="scene-cue"]').count()) || (await page.locator('[data-testid="music-round"]').count())) return;
    const intro = page.getByRole("button", { name: /Weiter|Los geht's|Überspringen/ }).first();
    if (!(await intro.count())) break;
    await intro.click();
    await page.waitForTimeout(80);
  }
}

const browser = await chromium.launch({ headless: true });
const report = [];
let failed = false;

for (const size of sizes) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    hasTouch: true,
    isMobile: true,
    reducedMotion: size.label === "iphone-430" ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto(base, { waitUntil: "networkidle" });
  const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.screenshot({ path: path.join(out, size.label + "-home.png"), fullPage: true });
  if (homeOverflow > 1) failed = true;

  for (const slug of slugs) {
    errors.length = 0;
    await page.goto(base + "/game/" + slug, { waitUntil: "networkidle" });
    const detailOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await enterPlayer(page);
    await page.waitForTimeout(120);

    for (let i = 0; i < 3; i++) {
      const skip = page.getByRole("button", { name: /Skip|Nicht in Tracklist/ }).first();
      if (!(await skip.count())) break;
      await skip.click();
      await page.waitForTimeout(80);
    }

    const playOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const interactionPresent =
      (await page.locator('[data-testid="scene-cue"]').count()) > 0 ||
      (await page.locator('[data-testid="music-round"]').count()) > 0;

    await page.screenshot({
      path: path.join(out, size.label + "-" + slug + ".png"),
      fullPage: true,
    });

    const row = { viewport: size.label, slug, detailOverflow, playOverflow, interactionPresent, errors: [...errors] };
    report.push(row);
    if (detailOverflow > 1 || playOverflow > 1 || errors.length || !interactionPresent) failed = true;
  }

  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(out, "audit.json"), JSON.stringify(report, null, 2));
if (failed) {
  console.error(JSON.stringify(report.filter((x) => x.detailOverflow > 1 || x.playOverflow > 1 || x.errors.length || !x.interactionPresent), null, 2));
  process.exit(1);
}
console.log("Visual audit passed: " + report.length + " route/viewport checks");
