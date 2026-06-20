import { pgTable, uuid, text, timestamp, integer, real, boolean, index } from "drizzle-orm/pg-core";

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

/**
 * Editable content (CMS-lite, SPEC-09). Every table is data-driven against
 * clearly marked placeholders so the owner can keep the site current without
 * code. Prices and counts stay indicative until real survey data arrives.
 */

/** Plots. Status is constrained; size, price and position stay nullable until surveyed. */
export const plots = pgTable(
  "plots",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    label: text("label").notNull(),
    sizeM2: integer("size_m2"),
    orientation: text("orientation"),
    // ledig | reservert | solgt
    status: text("status").notNull().default("ledig"),
    priceIndicative: integer("price_indicative"),
    gnrBnr: text("gnr_bnr"),
    positionX: real("position_x"),
    positionZ: real("position_z"),
    sightlineBearing: real("sightline_bearing"),
    note: text("note"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("plots_status_idx").on(t.status)],
);

/** Fremdrift timeline stages (bilingual labels, one marked current). */
export const timelineStages = pgTable("timeline_stages", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull(),
  labelNo: text("label_no").notNull(),
  labelEn: text("label_en").notNull(),
  dateOrStage: text("date_or_stage"),
  isCurrent: boolean("is_current").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** FAQ entries (bilingual, ordered, draft or published). */
export const faqEntries = pgTable("faq", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  questionNo: text("question_no").notNull(),
  questionEn: text("question_en").notNull(),
  answerNo: text("answer_no").notNull(),
  answerEn: text("answer_en").notNull(),
  status: text("status").notNull().default("published"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Aktuelt / news posts (bilingual, draft or published). */
export const newsPosts = pgTable(
  "news",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    titleNo: text("title_no").notNull(),
    titleEn: text("title_en").notNull(),
    bodyNo: text("body_no").notNull(),
    bodyEn: text("body_en").notNull(),
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("news_status_idx").on(t.status)],
);

/** Key content blocks (hero text, contact details), keyed and bilingual. */
export const contentBlocks = pgTable("content_blocks", {
  key: text("key").primaryKey(),
  bodyNo: text("body_no").notNull(),
  bodyEn: text("body_en").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Community-dashboard parameters (SPEC-13): illustrative values, clean interface. */
export const dashboardParams = pgTable("dashboard_params", {
  key: text("key").primaryKey(),
  mode: text("mode").notNull().default("illustrative"),
  values: text("values").notNull().default("{}"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Image slots: alt is required; forbehold and AI/illustration disclosure are captured. */
export const imageSlots = pgTable("image_slots", {
  slotKey: text("slot_key").primaryKey(),
  assetRef: text("asset_ref"),
  altNo: text("alt_no").notNull().default(""),
  altEn: text("alt_en").notNull().default(""),
  forbeholdText: text("forbehold_text"),
  isAiOrIllustration: boolean("is_ai_or_illustration").notNull().default(false),
  disclosureText: text("disclosure_text"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Generic version history for the entities where a change should be reversible. */
export const contentVersions = pgTable(
  "content_versions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    snapshot: text("snapshot").notNull(),
    editor: text("editor").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("content_versions_entity_idx").on(t.entity, t.entityId)],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type AdminSession = typeof adminSessions.$inferSelect;
export type Plot = typeof plots.$inferSelect;
export type TimelineStage = typeof timelineStages.$inferSelect;
export type FaqEntry = typeof faqEntries.$inferSelect;
export type NewsPost = typeof newsPosts.$inferSelect;
export type ContentBlock = typeof contentBlocks.$inferSelect;
export type DashboardParam = typeof dashboardParams.$inferSelect;
export type ImageSlot = typeof imageSlots.$inferSelect;
