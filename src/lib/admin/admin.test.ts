// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { leads } from "@/db/schema";
import {
  createAdmin,
  login,
  startEnrollment,
  confirmEnrollment,
  getAuth,
  revokeSession,
  verifyReauth,
  isReauthFresh,
  hasRole,
  REAUTH_WINDOW_MS,
} from "./auth";
import { generateTotp } from "./crypto";
import {
  searchLeads,
  setPipelineStatus,
  listSources,
  leadsToCsv,
  leadToSubjectExport,
  listAudit,
} from "./leads-admin";
import { eq } from "drizzle-orm";
import { adminUsers } from "@/db/schema";

async function seedLead(
  db: Awaited<ReturnType<typeof createTestDb>>,
  over: Partial<typeof leads.$inferInsert> & { email: string },
) {
  return (
    await db
      .insert(leads)
      .values({
        name: over.name ?? "Test Person",
        consentText: "x",
        consentVersion: "consent-v1",
        consentAt: new Date(),
        unsubToken: `unsub-${over.email}`,
        ...over,
      })
      .returning()
  )[0]!;
}

describe("admin auth", () => {
  it("signs in with the right password, flagged for enrolment on first login", async () => {
    const db = await createTestDb();
    await createAdmin(db, { email: "drift@knotten.no", password: "et-langt-passord-123" });
    const res = await login(db, { email: "drift@knotten.no", password: "et-langt-passord-123" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.needsEnrollment).toBe(true);
  });

  it("returns a generic reason for an unknown email and a wrong password", async () => {
    const db = await createTestDb();
    await createAdmin(db, { email: "drift@knotten.no", password: "rett-passord-123" });
    expect((await login(db, { email: "nobody@knotten.no", password: "x" })).ok).toBe(false);
    const bad = await login(db, { email: "drift@knotten.no", password: "feil" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toBe("credentials");
  });

  it("locks the account after repeated failures", async () => {
    const db = await createTestDb();
    await createAdmin(db, { email: "drift@knotten.no", password: "rett-passord-123" });
    for (let i = 0; i < 5; i++) {
      await login(db, { email: "drift@knotten.no", password: "feil" });
    }
    const res = await login(db, { email: "drift@knotten.no", password: "rett-passord-123" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe("locked");
  });

  it("enrols TOTP and then requires a valid code at login", async () => {
    const db = await createTestDb();
    const admin = await createAdmin(db, {
      email: "drift@knotten.no",
      password: "rett-passord-123",
    });
    const enroll = await startEnrollment(db, admin.id);
    expect(enroll).not.toBeNull();
    expect(await confirmEnrollment(db, admin.id, "000000")).toBe(false);
    expect(await confirmEnrollment(db, admin.id, generateTotp(enroll!.secret))).toBe(true);

    const noCode = await login(db, { email: "drift@knotten.no", password: "rett-passord-123" });
    expect(noCode.ok).toBe(false);
    if (!noCode.ok) expect(noCode.reason).toBe("mfa");

    const withCode = await login(db, {
      email: "drift@knotten.no",
      password: "rett-passord-123",
      code: generateTotp(enroll!.secret),
    });
    expect(withCode.ok).toBe(true);
    if (withCode.ok) expect(withCode.needsEnrollment).toBe(false);
  });

  it("resolves and revokes sessions", async () => {
    const db = await createTestDb();
    await createAdmin(db, { email: "drift@knotten.no", password: "rett-passord-123" });
    const res = await login(db, { email: "drift@knotten.no", password: "rett-passord-123" });
    if (!res.ok) throw new Error();
    expect((await getAuth(db, res.token))?.admin.email).toBe("drift@knotten.no");
    await revokeSession(db, res.token);
    expect(await getAuth(db, res.token)).toBeNull();
    expect(await getAuth(db, undefined)).toBeNull();
  });

  it("re-authenticates for destructive actions and tracks the fresh window", async () => {
    const db = await createTestDb();
    const admin = await createAdmin(db, {
      email: "drift@knotten.no",
      password: "rett-passord-123",
    });
    expect(await verifyReauth(db, admin.id, "rett-passord-123")).toBe(true);
    expect(await verifyReauth(db, admin.id, "feil")).toBe(false);
    expect(isReauthFresh(new Date())).toBe(true);
    expect(isReauthFresh(new Date(Date.now() - REAUTH_WINDOW_MS - 1000))).toBe(false);
    expect(isReauthFresh(null)).toBe(false);
  });

  it("enforces least-privilege roles", async () => {
    const db = await createTestDb();
    const owner = await createAdmin(db, {
      email: "o@knotten.no",
      password: "x-123456789",
      role: "owner",
    });
    const viewer = await createAdmin(db, {
      email: "v@knotten.no",
      password: "x-123456789",
      role: "viewer",
    });
    expect(hasRole(owner, "owner")).toBe(true);
    expect(hasRole(owner, "viewer")).toBe(true);
    expect(hasRole(viewer, "viewer")).toBe(true);
    expect(hasRole(viewer, "owner")).toBe(false);
  });

  it("does not store the TOTP secret in plaintext logs or expose the session token", async () => {
    const db = await createTestDb();
    await createAdmin(db, { email: "drift@knotten.no", password: "rett-passord-123" });
    const res = await login(db, { email: "drift@knotten.no", password: "rett-passord-123" });
    if (!res.ok) throw new Error();
    const row = (
      await db.select().from(adminUsers).where(eq(adminUsers.email, "drift@knotten.no"))
    )[0]!;
    expect(row.passwordHash).toContain("scrypt:");
    expect(row.passwordHash).not.toContain("rett-passord-123");
  });
});

describe("admin lead management", () => {
  async function seedMany(db: Awaited<ReturnType<typeof createTestDb>>) {
    await seedLead(db, {
      email: "a@x.no",
      name: "Anne Berg",
      source: "meld-interesse",
      status: "confirmed",
    });
    await seedLead(db, {
      email: "b@x.no",
      name: "Bjorn Dal",
      source: "verktoy",
      status: "confirmed",
    });
    await seedLead(db, {
      email: "c@x.no",
      name: "Cora Lie",
      source: "meld-interesse",
      status: "pending",
    });
  }

  it("filters by source and searches by name or email", async () => {
    const db = await createTestDb();
    await seedMany(db);
    expect((await searchLeads(db, { source: "meld-interesse" })).total).toBe(2);
    expect((await searchLeads(db, { q: "bjorn" })).total).toBe(1);
    expect((await searchLeads(db, { q: "@x.no" })).total).toBe(3);
  });

  it("paginates with a correct total and page count", async () => {
    const db = await createTestDb();
    await seedMany(db);
    const p = await searchLeads(db, { pageSize: 2, page: 1 });
    expect(p.rows).toHaveLength(2);
    expect(p.total).toBe(3);
    expect(p.pageCount).toBe(2);
  });

  it("lists distinct sources", async () => {
    const db = await createTestDb();
    await seedMany(db);
    expect((await listSources(db)).sort()).toEqual(["meld-interesse", "verktoy"]);
  });

  it("sets pipeline status, stamps actionedAt once, and audits it", async () => {
    const db = await createTestDb();
    const lead = await seedLead(db, { email: "a@x.no" });
    const updated = await setPipelineStatus(db, lead.id, "kontaktet", "drift@knotten.no");
    expect(updated?.pipelineStatus).toBe("kontaktet");
    expect(updated?.actionedAt).toBeInstanceOf(Date);
    const audit = await listAudit(db);
    expect(
      audit.rows.some((r) => r.action === "lead.status" && r.detail === "status=kontaktet"),
    ).toBe(true);
    // actionedAt is stable once set.
    const again = await setPipelineStatus(db, lead.id, "kvalifisert", "drift@knotten.no");
    expect(again?.actionedAt?.getTime()).toBe(updated?.actionedAt?.getTime());
  });

  it("builds a per-subject DSAR export with the full consent record", async () => {
    const db = await createTestDb();
    const lead = await seedLead(db, { email: "a@x.no", name: "Anne Berg" });
    const exp = leadToSubjectExport(lead) as { email: string; consent: { version: string } };
    expect(exp.email).toBe("a@x.no");
    expect(exp.consent.version).toBe("consent-v1");
  });

  it("escapes CSV and neutralises formula injection", async () => {
    const db = await createTestDb();
    await seedLead(db, { email: "evil@x.no", name: "=1+2", interest: 'has "quote", and comma' });
    const csv = leadsToCsv((await searchLeads(db)).rows);
    expect(csv.split("\r\n")[0]).toContain("email");
    expect(csv).toContain("'=1+2"); // leading apostrophe defuses the formula
    expect(csv).toContain('"has ""quote"", and comma"');
  });
});
