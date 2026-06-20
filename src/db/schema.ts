import { pgTable, uuid, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";

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
    // Sales-pipeline state set by the admin (separate from the consent state):
    // ny | kontaktet | kvalifisert | lukket.
    pipelineStatus: text("pipeline_status").notNull().default("ny"),
    // Set the first time a lead is moved off "ny"; marks it actioned so the
    // confirmed-un-actioned retention clock no longer applies.
    actionedAt: timestamp("actioned_at", { withTimezone: true }),
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

/**
 * Admin operators. Authentication is password plus mandatory TOTP MFA. The TOTP
 * secret is set at enrolment and only activated once a code is verified. Failed
 * logins are counted and a temporary lockout is applied to resist brute force.
 * Roles: "owner" (full access including erasure) and "viewer" (read and export
 * only). Least privilege is enforced server-side on every action.
 */
export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("viewer"),
    totpSecret: text("totp_secret"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("admin_users_email_idx").on(t.email)],
);

/**
 * Server-side admin sessions. Only the SHA-256 hash of the session token is
 * stored, never the token itself, so a database leak cannot resurrect a
 * session. Sessions are short-lived; reauthAt records the last re-authentication
 * and gates destructive actions to a fresh window.
 */
export const adminSessions = pgTable(
  "admin_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    adminId: uuid("admin_id").notNull(),
    reauthAt: timestamp("reauth_at", { withTimezone: true }),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("admin_sessions_admin_idx").on(t.adminId)],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type AdminSession = typeof adminSessions.$inferSelect;
