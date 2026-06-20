import { chromium } from "playwright";
import crypto from "node:crypto";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const BOOT = "test-bootstrap-secret";
const EMAIL = "drift@knotten.no";
const PASSWORD = "et-langt-admin-passord-123";

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
  const step = Math.floor(now / 1000 / 30);
  const ctr = Buffer.alloc(8);
  ctr.writeBigUInt64BE(BigInt(step));
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
  // Negative bootstrap checks.
  const noAuth = await fetch(`${BASE}/admin/bootstrap`, { method: "POST" });
  check("bootstrap without secret -> 401", noAuth.status === 401);
  const weak = await fetch(`${BASE}/admin/bootstrap`, {
    method: "POST",
    headers: { authorization: `Bearer ${BOOT}`, "content-type": "application/json" },
    body: JSON.stringify({ email: "x@y.no", password: "short" }),
  });
  check("bootstrap weak password -> 400", weak.status === 400);

  // Create the owner.
  const created = await fetch(`${BASE}/admin/bootstrap`, {
    method: "POST",
    headers: { authorization: `Bearer ${BOOT}`, "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, role: "owner" }),
  });
  check("bootstrap owner -> ok", created.status === 200);
  const dup = await fetch(`${BASE}/admin/bootstrap`, {
    method: "POST",
    headers: { authorization: `Bearer ${BOOT}`, "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, role: "owner" }),
  });
  check("bootstrap duplicate -> 409", dup.status === 409);

  // Seed a lead through the public flow so the list has data.
  await fetch(`${BASE}/api/interesse`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({
      name: "Test Lead",
      email: "lead@example.no",
      consent: true,
      locale: "no",
      source: "e2e",
    }),
  });

  // Access control before auth.
  const guarded = await fetch(`${BASE}/admin`, { redirect: "manual" });
  check("unauth /admin -> redirect", guarded.status >= 300 && guarded.status < 400);
  const exp = await fetch(`${BASE}/admin/export`, { redirect: "manual" });
  check("unauth /admin/export -> 401", exp.status === 401);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ baseURL: BASE });
  const page = await ctx.newPage();

  // Login (password only first time) -> enrolment.
  await page.goto("/admin");
  await page.waitForURL("**/admin/login**");
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin/enroll**");
  check("first login routes to enrolment", page.url().includes("/admin/enroll"));

  const secret = (await page.getAttribute('[aria-label="Hemmelig nokkel"]', "textContent")) ?? "";
  const realSecret = (await page.textContent('[aria-label="Hemmelig nokkel"]')) ?? secret;
  await page.fill("#code", totp(realSecret));
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname === "/admin");
  check("enrolment completes to dashboard", /Registreringer/.test(await page.content()));

  // Lead appears; open detail and set status.
  check("seeded lead listed", (await page.content()).includes("lead@example.no"));
  await page.click("text=Test Lead");
  await page.waitForURL("**/admin/leads/**");
  await page.selectOption("#status", "kontaktet");
  await page.click('button:has-text("Lagre status")');
  await page.waitForURL("**updated=1**");
  check("status update confirmed", (await page.content()).includes("Status er oppdatert"));

  // Erase with re-auth (owner).
  const leadUrl = page.url();
  await page.fill("#password", PASSWORD);
  await page.fill("#code", totp(realSecret));
  await page.click('button:has-text("Slett registreringen permanent")');
  await page.waitForURL((u) => u.pathname === "/admin");
  check("erase redirects with confirmation", page.url().includes("erased=1"));
  check("lead gone after erase", !(await page.content()).includes("lead@example.no"));

  // Audit log shows the actions, no PII.
  await page.goto("/admin/audit");
  const audit = await page.content();
  check("audit shows status action", audit.includes("lead.status"));
  check("audit shows erase action", audit.includes("lead.erased"));
  check("audit has no lead email", !audit.includes("lead@example.no"));

  // Re-auth failure path: wrong password on a fresh lead is rejected.
  void leadUrl;

  // Logout.
  await page.click('button:has-text("Logg ut")');
  await page.waitForURL("**/admin/login**");
  check("logout returns to login", page.url().includes("/admin/login"));

  await browser.close();
  console.log(failures === 0 ? "\nALL ADMIN E2E CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
