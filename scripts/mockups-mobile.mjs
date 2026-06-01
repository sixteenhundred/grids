/**
 * Mobile mockup generator — iPhone-format PNGs of every page, saved to mockup2/.
 * Accepts the cookie banner first so shots are unobstructed (full screen).
 * Run the dev server first (npm run dev), then: node scripts/mockups-mobile.mjs
 */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = process.env.MOCKUP_BASE || "http://localhost:3000";
const OUT = "/Users/johnhope/grids/mockup2/";
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 }); // iPhone portrait

async function acceptCookies() {
  try {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => /accept all/i.test(b.textContent || ""));
      if (btn) btn.click();
    });
  } catch { /* ignore */ }
}
async function go(path) {
  await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 60000 });
  await acceptCookies();
  await sleep(1100); // settle entrance animations
}
async function shot(name) {
  await page.screenshot({ path: `${OUT}${name}.png` });
  console.log("saved", name + ".png");
}

// Accept cookies once up front (persists across the session).
await go("/");
await acceptCookies();
await sleep(400);

const ROUTES = [
  ["01-landing", "/"],
  ["02-login", "/login"],
  ["03-signup", "/signup"],
  ["04-waitlist", "/waitlist"],
  ["05-trust", "/trust"],
  ["06-terms", "/terms"],
  ["10-dashboard", "/dashboard"],
  ["11-my-operation", "/dashboard/operation"],
  ["12-browse", "/dashboard/browse"],
  ["13-job-board", "/dashboard/jobs"],
  ["14-projects", "/dashboard/projects"],
  ["15-contracts", "/dashboard/contracts"],
  ["16-finance", "/dashboard/finance"],
  ["17-transfer", "/dashboard/transfer"],
  ["18-radar", "/dashboard/radar"],
  ["19-community", "/dashboard/community"],
  ["20-saved", "/dashboard/saved"],
  ["21-news", "/dashboard/news"],
  ["22-trends", "/dashboard/trends"],
  ["23-campaign", "/dashboard/campaign"],
  ["24-first-in-line", "/dashboard/first-in-line"],
  ["25-brand-vault", "/dashboard/vault"],
  ["26-content-planner", "/dashboard/planner"],
  ["27-ai-sales", "/dashboard/sales"],
  ["28-creative-crm", "/dashboard/crm"],
  ["29-price-intel", "/dashboard/pricing"],
  ["30-match-score", "/dashboard/match"],
  ["31-ai-studio", "/dashboard/studio"],
  ["32-shop", "/dashboard/shop"],
  ["33-shop-browse", "/dashboard/shop/browse"],
  ["34-shop-customize", "/dashboard/shop/customize"],
  ["35-academy", "/dashboard/academy"],
  ["36-academy-browse", "/dashboard/academy/browse"],
  ["37-academy-customize", "/dashboard/academy/customize"],
  ["38-collab", "/dashboard/collab"],
  ["39-concierge", "/dashboard/concierge"],
  ["40-project-builder", "/dashboard/builder"],
  ["41-content-vault", "/dashboard/content-vault"],
  ["42-tracker", "/dashboard/tracker"],
  ["43-marketing-advisor", "/dashboard/advisor"],
  ["44-performance", "/dashboard/performance"],
  ["45-profile", "/dashboard/profile"],
  ["46-control-panel", "/dashboard/admin"],
];

for (const [name, path] of ROUTES) {
  try { await go(path); await shot(name); } catch (e) { console.log("skip", name, e.message); }
}

// Detail pages — discover a real link from each list page, then capture it.
const DETAILS = [
  ["50-trust-doc", "/trust", "/trust/"],
  ["51-news-article", "/dashboard/news", "/dashboard/news/"],
  ["52-contract-detail", "/dashboard/contracts", "/dashboard/contracts/"],
  ["53-shop-storefront", "/dashboard/shop/browse", "/dashboard/shop/"],
  ["54-academy-page", "/dashboard/academy/browse", "/dashboard/academy/"],
  ["55-creative-profile", "/dashboard/browse", "/dashboard/creative/"],
];
for (const [name, listPath, prefix] of DETAILS) {
  try {
    await go(listPath);
    const href = await page.$$eval("a[href]", (as, p) => {
      const hit = as
        .map((a) => a.getAttribute("href"))
        .find((h) => h && h.startsWith(p) && h.length > p.length && !h.includes("/browse") && !h.includes("/customize"));
      return hit || null;
    }, prefix);
    if (!href) { console.log("no detail link for", name); continue; }
    await go(href);
    await shot(name);
  } catch (e) { console.log("skip", name, e.message); }
}

await browser.close();
console.log("DONE -> mockup2/");
