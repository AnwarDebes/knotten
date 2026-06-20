import { pgTable, uuid, text, timestamp, integer, index } from "drizzle-orm/pg-core";

/**
 * The lead database is the crown jewel. Data is minimised: name and email are
 * required, phone and interest are optional. The exact consent text, its
 * version and timestamp are stored per lead (GDPR). No raw IP is stored, only a
 * salted hash for abuse control.
 */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    interest: text("interest"),
    source: text("source"),
    // pending (awaiting double opt-in) | confirmed | unsubscribed
    status: text("status").notNull().default("pending"),
    consentText: text("consent_text").notNull(),
    consentVersion: text("consent_version").notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    confirmToken: text("confirm_token"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    // Stable token for the unsubscribe link (withdrawal as easy as consent).
    unsubToken: text("unsub_token").notNull(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("leads_email_idx").on(t.email),
    index("leads_status_idx").on(t.status),
    index("leads_token_idx").on(t.confirmToken),
    index("leads_unsub_idx").on(t.unsubToken),
  ],
);

/** Append-only audit trail for lead and admin actions (no personal data in detail). */
export const auditLog = pgTable("audit_log", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  action: text("action").notNull(),
  leadId: uuid("lead_id"),
  detail: text("detail"),
  actor: text("actor").notNull().default("system"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

/** Database-backed rate limiting (works on serverless, no extra processor). */
export const rateLimit = pgTable("rate_limit", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
