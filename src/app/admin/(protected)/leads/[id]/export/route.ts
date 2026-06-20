import { getDb } from "@/db";
import { getLead, leadToSubjectExport } from "@/lib/admin/leads-admin";
import { currentAuth } from "@/lib/admin/session-cookie";
import { auditLog } from "@/db/schema";

export const runtime = "nodejs";

/** Per-subject DSAR export (GDPR art. 15/20): one lead's full record as JSON. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await currentAuth();
  if (!auth || !auth.admin.totpEnabled) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  const db = await getDb();
  const lead = await getLead(db, id);
  if (!lead) return new Response("Not found", { status: 404 });

  await db
    .insert(auditLog)
    .values({ action: "lead.dsar.export", leadId: id, actor: auth.admin.email });
  return new Response(JSON.stringify(leadToSubjectExport(lead), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lead-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
