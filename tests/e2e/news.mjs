import { chromium } from "playwright";
import crypto from "node:crypto";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const BOOT = "test-bootstrap-secret";
const EMAIL = "red@knotten.no";
const PASSWORD = "et-langt-red-passord-123";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function b32dec(s) {
  s = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0,
    val = 0;
  const out = [];
  for (const c of s) {
    val = (val << 5) | B32.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      out.push((val >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
function totp(secret) {
  const key = b32dec(secret);
  const ctr = Buffer.alloc(8);
  ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 1000 / 30)));
  const h = crypto.createHmac("sha1", key).update(ctr).digest();
  const o = h[h.length - 1] & 0xf;
  const bin =
    ((h[o] & 0x7f) << 24) |
    ((h[o + 1] & 0xff) << 16) |
    ((h[o + 2] & 0xff) << 8) |
    (h[o + 3] & 0xff);
  return (bin % 1000000).toString().padStart(6, "0");
}

let fails = 0;
const check = (n, c) => {
  console.log(`${c ? "PASS" : "FAIL"}  ${n}`);
  if (!c) fails++;
};

async function main() {
  await fetch(`${BASE}/admin/bootstrap`, {
    method: "POST",
    headers: { authorization: `Bearer ${BOOT}`, "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, role: "owner" }),
  });
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ baseURL: BASE })).newPage();
  await page.goto("/admin/login");
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin/enroll**");
  const secret = (await page.textContent('[aria-label="Hemmelig nokkel"]')) ?? "";
  await page.fill("#code", totp(secret));
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname === "/admin");

  await page.goto("/admin/innhold/aktuelt/ny");
  await page.fill("#slug", "grunnarbeid-i-gang");
  await page.fill("#titleNo", "Grunnarbeid i gang");
  await page.fill("#titleEn", "Groundwork under way");
  await page.fill("#bodyNo", "Vi har startet grunnarbeidet pa Knotten. Mer kommer.");
  await page.fill("#bodyEn", "We have started the groundwork at Knotten. More to come.");
  await page.selectOption("#status", "published");
  await page.click('button:has-text("Opprett sak")');
  await page.waitForURL("**/admin/innhold/aktuelt?saved=1**");

  // Public index links to the post.
  const index = await (await fetch(`${BASE}/no/aktuelt`)).text();
  check("index lists the post", index.includes("Grunnarbeid i gang"));
  check("index links to the slug", index.includes("/aktuelt/grunnarbeid-i-gang"));

  // Per-post page (NO and EN) with Article JSON-LD.
  const post = await (await fetch(`${BASE}/no/aktuelt/grunnarbeid-i-gang`)).text();
  check("per-post page renders body", post.includes("startet grunnarbeidet"));
  check("Article JSON-LD present", post.includes('"@type":"NewsArticle"'));
  const postEn = await (await fetch(`${BASE}/en/news/grunnarbeid-i-gang`)).text();
  check("english per-post renders", postEn.includes("started the groundwork"));

  // Sitemap includes the post in both locales.
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  check("sitemap has NO post url", sitemap.includes("/no/aktuelt/grunnarbeid-i-gang"));
  check("sitemap has EN post url", sitemap.includes("/en/news/grunnarbeid-i-gang"));

  // A draft stays hidden.
  await page.goto("/admin/innhold/aktuelt/ny");
  await page.fill("#slug", "skjult-utkast");
  await page.fill("#titleNo", "Skjult utkast");
  await page.fill("#titleEn", "Hidden draft");
  await page.fill("#bodyNo", "x");
  await page.fill("#bodyEn", "x");
  await page.selectOption("#status", "draft");
  await page.click('button:has-text("Opprett sak")');
  await page.waitForURL("**/admin/innhold/aktuelt?saved=1**");
  const draft = await fetch(`${BASE}/no/aktuelt/skjult-utkast`, { redirect: "manual" });
  check("draft per-post is 404", draft.status === 404);

  await browser.close();
  console.log(fails === 0 ? "\nNEWS E2E PASSED" : `\n${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
