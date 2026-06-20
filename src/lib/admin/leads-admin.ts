import { and, or, eq, ilike, gte, lte, desc, asc, count } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { leads, auditLog, type Lead } from "@/db/schema";
import type { DB } from "@/db";

export const PIPELINE_STATUSES = ["ny", "kontaktet", "kvalifisert", "lukket"] as const;
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export type LeadFilter = {
  q?: string;
  pipelineStatus?: PipelineStatus;
  source?: string;
  from?: Date;
  to?: Date;
  sort?: "newest" | "oldest" | "name";
  page?: number;
  pageSize?: number;
};

export type LeadPage = {
  rows: Lead[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function buildConditions(filter: LeadFilter): SQL[] {
  const conditions: SQL[] = [];
  if (filter.q) {
    const term = `%${filter.q.trim()}%`;
    const match = or(ilike(leads.name, term), ilike(leads.email, term));
    if (match) conditions.push(match);
  }
  if (filter.pipelineStatus) conditions.push(eq(leads.pipelineStatus, filter.pipelineStatus));
  if (filter.source) conditions.push(eq(leads.source, filter.source));
  if (filter.from) conditions.push(gte(leads.createdAt, filter.from));
  if (filter.to) conditions.push(lte(leads.createdAt, filter.to));
  return conditions;
}

/** Search, filter, sort and paginate leads for the admin list view. */
export async function searchLeads(db: DB, filter: LeadFilter = {}): Promise<LeadPage> {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 25));
  const conditions = buildConditions(filter);
  const where = conditions.length ? and(...conditions) : undefined;

  const order =
    filter.sort === "oldest"
      ? asc(leads.createdAt)
      : filter.sort === "name"
        ? asc(leads.name)
        : desc(leads.createdAt);

  const rows = await db
    .select()
    .from(leads)
    .where(where)
    .orderBy(order)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRows = await db.select({ value: count() }).from(leads).where(where);
  const total = totalRows[0]?.value ?? 0;

  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** The distinct sources present, for the filter dropdown. */
export async function listSources(db: DB): Promise<string[]> {
  const rows = await db.selectDistinct({ source: leads.source }).from(leads);
  return rows.map((r) => r.source).filter((s): s is string => Boolean(s));
}

export async function getLead(db: DB, id: string): Promise<Lead | null> {
  return (await db.select().from(leads).where(eq(leads.id, id)))[0] ?? null;
}

/**
 * Set a lead's sales-pipeline status. Moving a lead off "ny" stamps actionedAt
 * the first time, which marks it actioned for retention. The change is audited
 * with no personal data.
 */
export async function setPipelineStatus(
  db: DB,
  id: string,
  status: PipelineStatus,
  actor: string,
): Promise<Lead | null> {
  const current = await getLead(db, id);
  if (!current) return null;
  const actionedAt = current.actionedAt ?? (status !== "ny" ? new Date() : null);
  const updated = (
    await db
      .update(leads)
      .set({ pipelineStatus: status, actionedAt, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning()
  )[0]!;
  await db.insert(auditLog).values({
    action: "lead.status",
    leadId: id,
    actor,
    detail: `status=${status}`,
  });
  return updated;
}

/** A per-subject DSAR export: the full record a data subject is entitled to. */
export function leadToSubjectExport(lead: Lead): Record<string, unknown> {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    interest: lead.interest,
    source: lead.source,
    consent: {
      text: lead.consentText,
      version: lead.consentVersion,
      at: lead.consentAt,
      doubleOptInStatus: lead.status,
      confirmedAt: lead.confirmedAt,
      withdrawnAt: lead.withdrawnAt,
    },
    pipelineStatus: lead.pipelineStatus,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

const CSV_COLUMNS = [
  "id",
  "name",
  "email",
  "phone",
  "interest",
  "source",
  "status",
  "pipelineStatus",
  "consentVersion",
  "consentAt",
  "confirmedAt",
  "createdAt",
] as const;

/**
 * Escape a CSV cell per RFC 4180 and neutralise spreadsheet formula injection:
 * a value starting with =, +, -, @, tab or CR is prefixed so a spreadsheet does
 * not execute it.
 */
function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Build a CSV of all leads with strict escaping. */
export function leadsToCsv(rows: Lead[]): string {
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map((r) =>
    CSV_COLUMNS.map((col) => {
      const v = r[col as keyof Lead];
      return csvCell(v instanceof Date ? v.toISOString() : v);
    }).join(","),
  );
  return [header, ...lines].join("\r\n");
}

export type AuditEntry = typeof auditLog.$inferSelect;

/** Read the append-only audit log, newest first, paginated. */
export async function listAudit(
  db: DB,
  opts: { page?: number; pageSize?: number } = {},
): Promise<{
  rows: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, opts.pageSize ?? 50));
  const rows = await db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.at))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const totalRows = await db.select({ value: count() }).from(auditLog);
  const total = totalRows[0]?.value ?? 0;
  return { rows, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
