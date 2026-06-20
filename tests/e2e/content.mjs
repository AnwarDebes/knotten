import { chromium } from "playwright";
import crypto from "node:crypto";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const BOOT = "test-bootstrap-secret";
const EMAIL = "eier@knotten.no";
const PASSWORD = "et-langt-eier-passord-123";

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
function totp(secret, now = Date.now()) {
  const key = b32dec(secret);
  const ctr = Buffer.alloc(8);
  ctr.writeBigUInt64BE(BigInt(Math.floor(now / 1000 / 30)));
  const h = crypto.createHmac("sha1", key).update(ctr).digest();
  const o = h[h.length - 1] & 0xf;
  const bin =
    ((h[o] & 0x7f) << 24) |
    ((h[o + 1] & 0xff) << 16) |
    ((h[o + 2] & 0xff) << 8) |
    (h[o + 3] & 0xff);
  return (bin % 1000000).toString().padStart(6, "0");
}

let failures = 0;
function check(name, cond) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failures++;
}

async function main() {
  await fetch(`${BASE}/admin/bootstrap`, {
    method: "POST",
    headers: { authorization: `Bearer ${BOOT}`, "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, role: "owner" }),
  });

  const browser = await chromium.launch();
  const page = await (await browser.newContext({ baseURL: BASE })).newPage();

  // Login + enrol.
  await page.goto("/admin/login");
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin/enroll**");
  const secret = (await page.textContent('[aria-label="Hemmelig nokkel"]')) ?? "";
  await page.fill("#code", totp(secret));
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname === "/admin");

  // Create a plot.
  await page.goto("/admin/innhold/tomter/ny");
  await page.fill("#label", "Testtomt E2E");
  await page.selectOption("#status", "ledig");
  await page.fill("#sizeM2", "820");
  await page.fill("#priceIndicative", "2450000");
  await page.click('button:has-text("Opprett tomt")');
  await page.waitForURL("**/admin/innhold/tomter?saved=1**");
  check("plot saved appears in admin list", (await page.content()).includes("Testtomt E2E"));

  // Public omradet reflects the plot (ISR revalidated by the save action).
  const omradet = await (await fetch(`${BASE}/no/omradet`)).text();
  check("public omradet shows the new plot", omradet.includes("Testtomt E2E"));
  check("public omradet shows indicative price", /2\s?450\s?000/.test(omradet.replace(/ /g, " ")));

  // Edit the plot, then a version should exist and be restorable.
  await page.click("text=Testtomt E2E");
  await page.waitForURL("**/admin/innhold/tomter/**");
  await page.selectOption("#status", "solgt");
  await page.click('button:has-text("Lagre endringer")');
  await page.waitForURL("**/admin/innhold/tomter?saved=1**");
  await page.click("text=Testtomt E2E");
  check(
    "version history present after edit",
    (await page.content()).includes("Tidligere versjoner"),
  );
  await page.click('button:has-text("Gjenopprett")');
  await page.waitForURL("**restored=1**");
  check("restore succeeded", (await page.content()).includes("Gjenopprettet"));

  // Create and publish a news post.
  await page.goto("/admin/innhold/aktuelt/ny");
  await page.fill("#slug", "test-sak-e2e");
  await page.fill("#titleNo", "Testsak E2E");
  await page.fill("#titleEn", "Test post E2E");
  await page.fill("#bodyNo", "Dette er en testsak.");
  await page.fill("#bodyEn", "This is a test post.");
  await page.selectOption("#status", "published");
  await page.click('button:has-text("Opprett sak")');
  await page.waitForURL("**/admin/innhold/aktuelt?saved=1**");
  const aktuelt = await (await fetch(`${BASE}/no/aktuelt`)).text();
  check("public aktuelt shows the published post", aktuelt.includes("Testsak E2E"));
  const aktueltEn = await (await fetch(`${BASE}/en/aktuelt`)).text();
  check("public aktuelt EN shows the post", aktueltEn.includes("Test post E2E"));

  // Create and publish an FAQ entry, check the contact page.
  await page.goto("/admin/innhold/faq/ny");
  await page.fill("#questionNo", "Nar er salgsstart E2E?");
  await page.fill("#questionEn", "When is the sales start E2E?");
  await page.fill("#answerNo", "Det annonseres her.");
  await page.fill("#answerEn", "It will be announced here.");
  await page.selectOption("#status", "published");
  await page.click('button:has-text("Opprett sporsmal")');
  await page.waitForURL("**/admin/innhold/faq?saved=1**");
  const kontakt = await (await fetch(`${BASE}/no/kontakt`)).text();
  check("public kontakt shows the published FAQ", kontakt.includes("Nar er salgsstart E2E?"));

  // Validation rejection: a bad news slug returns an error.
  await page.goto("/admin/innhold/aktuelt/ny");
  await page.fill("#slug", "Ugyldig Slug");
  await page.fill("#titleNo", "x");
  await page.fill("#titleEn", "x");
  await page.fill("#bodyNo", "x");
  await page.fill("#bodyEn", "x");
  await page.click('button:has-text("Opprett sak")');
  await page.waitForURL("**error=validation**");
  check("invalid slug rejected with validation error", page.url().includes("error=validation"));

  await browser.close();
  console.log(failures === 0 ? "\nALL CONTENT E2E CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
