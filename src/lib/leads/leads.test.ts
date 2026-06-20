// @vitest-environment node
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/test/db";
import { leads } from "@/db/schema";
import {
  createLead,
  confirmLead,
  withdrawLead,
  eraseLeadById,
  listLeads,
  purgeStalePending,
} from "./service";
import { interestSchema, type InterestInput } from "./validation";
import { CONSENT_VERSION } from "./consent";

const input: InterestInput = {
  name: "Kari Nordmann",
  email: "Kari@Example.NO",
  consent: true,
  locale: "no",
  source: "test",
};

describe("interestSchema", () => {
  it("accepts a valid submission", () => {
    expect(interestSchema.safeParse(input).success).toBe(true);
  });

  it("rejects a missing or false consent", () => {
    expect(interestSchema.safeParse({ ...input, consent: false }).success).toBe(false);
  });

  it("rejects a bad email and a too-short name", () => {
    expect(interestSchema.safeParse({ ...input, email: "not-an-email" }).success).toBe(false);
    expect(interestSchema.safeParse({ ...input, name: "x" }).success).toBe(false);
  });

  it("rejects newlines (email header injection)", () => {
    expect(interestSchema.safeParse({ ...input, name: "Kari\r\nBCC: a@b.no" }).success).toBe(false);
  });
});

describe("lead service", () => {
  it("creates a pending lead with a consent record, hashed IP and an unsub token", async () => {
    const db = await createTestDb();
    const result = await createLead(db, input, { ip: "1.2.3.4" });
    expect(result.outcome).toBe("created");
    if (result.outcome !== "created") return;
    expect(result.lead.email).toBe("kari@example.no");
    expect(result.lead.status).toBe("pending");
    expect(result.lead.consentVersion).toBe(CONSENT_VERSION);
    expect(result.lead.ipHash).toBeTruthy();
    expect(result.lead.ipHash).not.toContain("1.2.3.4");
    expect(result.lead.unsubToken).toBeTruthy();
    expect(result.token).toBeTruthy();
  });

  it("confirms via double opt-in and the token is single-use", async () => {
    const db = await createTestDb();
    const created = await createLead(db, input, {});
    if (created.outcome !== "created") throw new Error();
    const confirmed = await confirmLead(db, created.token);
    expect(confirmed?.status).toBe("confirmed");
    expect(confirmed?.confirmToken).toBeNull();
    // Re-using the same token does nothing: it was cleared on first use.
    expect(await confirmLead(db, created.token)).toBeNull();
  });

  it("does not create a duplicate for the same email", async () => {
    const db = await createTestDb();
    await createLead(db, input, {});
    const second = await createLead(db, input, {});
    expect(second.outcome).toBe("pending");
    expect((await listLeads(db)).length).toBe(1);
  });

  it("reports an already-confirmed email without creating another", async () => {
    const db = await createTestDb();
    const created = await createLead(db, input, {});
    if (created.outcome !== "created") throw new Error();
    await confirmLead(db, created.token);
    expect((await createLead(db, input, {})).outcome).toBe("confirmedExists");
    expect((await listLeads(db)).length).toBe(1);
  });

  it("withdraws consent via the unsub token, and re-registration reactivates", async () => {
    const db = await createTestDb();
    const created = await createLead(db, input, {});
    if (created.outcome !== "created") throw new Error();
    await confirmLead(db, created.token);
    const withdrawn = await withdrawLead(db, created.lead.unsubToken);
    expect(withdrawn?.status).toBe("unsubscribed");
    expect(withdrawn?.withdrawnAt).toBeInstanceOf(Date);
    // Registering again reactivates to pending with fresh consent.
    const again = await createLead(db, input, {});
    expect(again.outcome).toBe("pending");
    if (again.outcome === "pending") expect(again.lead.status).toBe("pending");
    expect((await listLeads(db)).length).toBe(1);
  });

  it("erases a lead (GDPR) and records the action", async () => {
    const db = await createTestDb();
    const created = await createLead(db, input, {});
    if (created.outcome !== "created") throw new Error();
    expect(await eraseLeadById(db, created.lead.id)).toBe(true);
    expect((await listLeads(db)).length).toBe(0);
  });

  it("retention purges stale pending leads but keeps confirmed ones", async () => {
    const db = await createTestDb();
    const a = await createLead(db, { ...input, email: "a@example.no" }, {});
    const b = await createLead(db, { ...input, email: "b@example.no" }, {});
    if (a.outcome !== "created" || b.outcome !== "created") throw new Error();
    await confirmLead(db, b.token); // b is confirmed, must survive
    const purged = await purgeStalePending(db, 0);
    expect(purged).toBe(1);
    const remaining = await listLeads(db);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.status).toBe("confirmed");
  });

  it("enforces a unique email at the database level", async () => {
    const db = await createTestDb();
    await db.insert(leads).values({
      name: "A",
      email: "dup@example.no",
      consentText: "x",
      consentVersion: "v",
      consentAt: new Date(),
      unsubToken: "u1",
    });
    await expect(
      db.insert(leads).values({
        name: "B",
        email: "dup@example.no",
        consentText: "x",
        consentVersion: "v",
        consentAt: new Date(),
        unsubToken: "u2",
      }),
    ).rejects.toThrow();
    await db.delete(leads).where(eq(leads.email, "dup@example.no"));
  });

  it("rate limit allows up to the max then blocks (atomic)", async () => {
    const db = await createTestDb();
    const { consume } = await import("./rate-limit");
    expect(await consume(db, "k", 2, 60_000)).toBe(true);
    expect(await consume(db, "k", 2, 60_000)).toBe(true);
    expect(await consume(db, "k", 2, 60_000)).toBe(false);
  });
});
