import { and, desc, eq, lt } from "drizzle-orm";
import { leads, auditLog, type Lead } from "@/db/schema";
import type { DB } from "@/db";
import { CONSENT_TEXT, CONSENT_VERSION, type ConsentLocale } from "./consent";
import { generateToken, hashIp } from "./security";
import type { InterestInput } from "./validation";

export type CreateResult =
  | { outcome: "created"; lead: Lead; token: string }
  | { outcome: "pending"; lead: Lead; token: string }
  | { outcome: "confirmedExists" };

/**
 * Create a pending lead with its consent record, a confirmation token and a
 * stable unsubscribe token, or return the existing one. The email is unique, so
 * it is never stored twice. An already-confirmed email is reported without
 * leaking more; an unsubscribed email is re-activated with fresh consent.
 */
export async function createLead(
  db: DB,
  input: InterestInput,
  meta: { ip?: string },
): Promise<CreateResult> {
  const email = input.email.toLowerCase().trim();
  const locale = (input.locale ?? "no") as ConsentLocale;

  const existing = (await db.select().from(leads).where(eq(leads.email, email)))[0];
  if (existing) {
    if (existing.status === "confirmed") return { outcome: "confirmedExists" };
    // Pending or previously unsubscribed: refresh the consent and token.
    const token = generateToken();
    const updated = (
      await db
        .update(leads)
        .set({
          name: input.name.trim(),
          phone: input.phone?.trim() || null,
          interest: input.interest?.trim() || null,
          source: input.source ?? null,
          status: "pending",
          consentText: CONSENT_TEXT[locale],
          consentVersion: CONSENT_VERSION,
          consentAt: new Date(),
          confirmToken: token,
          confirmedAt: null,
          withdrawnAt: null,
          updatedAt: new Date(),
          ipHash: meta.ip ? hashIp(meta.ip) : existing.ipHash,
        })
        .where(eq(leads.id, existing.id))
        .returning()
    )[0]!;
    return { outcome: "pending", lead: updated, token };
  }

  const token = generateToken();
  const inserted = (
    await db
      .insert(leads)
      .values({
        name: input.name.trim(),
        email,
        phone: input.phone?.trim() || null,
        interest: input.interest?.trim() || null,
        source: input.source ?? null,
        status: "pending",
        consentText: CONSENT_TEXT[locale],
        consentVersion: CONSENT_VERSION,
        consentAt: new Date(),
        confirmToken: token,
        unsubToken: generateToken(),
        ipHash: meta.ip ? hashIp(meta.ip) : null,
      })
      .returning()
  )[0]!;
  await db.insert(auditLog).values({
    action: "lead.created",
    leadId: inserted.id,
    detail: `source=${input.source ?? "?"}`,
  });
  return { outcome: "created", lead: inserted, token };
}

/** Confirm a lead via its double opt-in token. Idempotent. The token is cleared on use. */
export async function confirmLead(db: DB, token: string): Promise<Lead | null> {
  const lead = (await db.select().from(leads).where(eq(leads.confirmToken, token)))[0];
  if (!lead) return null;
  if (lead.status === "confirmed") return lead;
  if (lead.status === "unsubscribed") return null;
  const updated = (
    await db
      .update(leads)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
        confirmToken: null,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id))
      .returning()
  )[0]!;
  await db.insert(auditLog).values({ action: "lead.confirmed", leadId: lead.id });
  return updated;
}

/** Withdraw consent via the unsubscribe token (as easy as giving consent). Idempotent. */
export async function withdrawLead(db: DB, token: string): Promise<Lead | null> {
  const lead = (await db.select().from(leads).where(eq(leads.unsubToken, token)))[0];
  if (!lead) return null;
  if (lead.status === "unsubscribed") return lead;
  const updated = (
    await db
      .update(leads)
      .set({
        status: "unsubscribed",
        withdrawnAt: new Date(),
        confirmToken: null,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id))
      .returning()
  )[0]!;
  await db.insert(auditLog).values({ action: "lead.withdrawn", leadId: lead.id });
  return updated;
}

/** List leads, newest first (admin, SPEC-07). */
export function listLeads(db: DB): Promise<Lead[]> {
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function getLeadById(db: DB, id: string): Promise<Lead | null> {
  return (await db.select().from(leads).where(eq(leads.id, id)))[0] ?? null;
}

/** GDPR erasure: hard-delete a lead and log it (no personal data in the log). */
export async function eraseLeadById(db: DB, id: string, actor = "admin"): Promise<boolean> {
  const deleted = await db.delete(leads).where(eq(leads.id, id)).returning();
  if (deleted.length === 0) return false;
  await db.insert(auditLog).values({ action: "lead.erased", leadId: id, actor });
  return true;
}

/**
 * Retention: delete un-actioned pending leads older than the cutoff (default 30
 * days). Returns the number deleted. Only a non-personal summary is logged.
 */
export async function purgeStalePending(db: DB, days = 30): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const deleted = await db
    .delete(leads)
    .where(and(eq(leads.status, "pending"), lt(leads.createdAt, cutoff)))
    .returning();
  if (deleted.length > 0) {
    await db.insert(auditLog).values({
      action: "lead.retention.purged",
      detail: `count=${deleted.length} pending older than ${days}d`,
    });
  }
  return deleted.length;
}
