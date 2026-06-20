// @vitest-environment node
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/test/db";
import { leads, auditLog } from "./schema";

describe("schema (PGlite)", () => {
  it("inserts and reads a lead with its consent record", async () => {
    const db = await createTestDb();
    const inserted = await db
      .insert(leads)
      .values({
        name: "Test Testesen",
        email: "test@example.no",
        consentText: "Jeg samtykker til å bli kontaktet.",
        consentVersion: "consent-v1",
        consentAt: new Date(),
        confirmToken: "tok123",
        unsubToken: "unsub123",
      })
      .returning();
    const lead = inserted[0]!;
    expect(lead.id).toBeTruthy();
    expect(lead.status).toBe("pending");
    expect(lead.createdAt).toBeInstanceOf(Date);

    const found = await db.select().from(leads).where(eq(leads.email, "test@example.no"));
    expect(found).toHaveLength(1);
    expect(found[0]!.consentVersion).toBe("consent-v1");
  });

  it("records an audit entry", async () => {
    const db = await createTestDb();
    await db.insert(auditLog).values({ action: "lead.created", detail: "source=test" });
    const rows = await db.select().from(auditLog);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.actor).toBe("system");
  });
});
