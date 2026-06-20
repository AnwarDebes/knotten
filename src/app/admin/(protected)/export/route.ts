import { getDb } from "@/db";
import { searchLeads, leadsToCsv } from "@/lib/admin/leads-admin";
import { currentAuth } from "@/lib/admin/session-cookie";
import { auditLog } from "@/db/schema";

export const runtime = "nodejs";

/** Full lead export as CSV. Auth is enforced here (route handlers skip layouts). */
export async function GET(): Promise<Response> {
  const auth = await currentAuth();
  if (!auth || !auth.admin.totpEnabled) {
    return new Response("Unauthorized", { status: 401 });
  }
  const db = await getDb();
  // Cap a single export to a sane bound; pagination covers larger sets.
  const { rows } = await searchLeads(db, { pageSize: 100, page: 1 });
  const csv = leadsToCsv(rows);
  await db.insert(auditLog).values({
    action: "leads.export.csv",
    actor: auth.admin.email,
    detail: `count=${rows.length}`,
  });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="knotten-registreringer.csv"',
      "Cache-Control": "no-store",
    },
  });
}
