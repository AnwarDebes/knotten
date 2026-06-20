import { getDb } from "@/db";
import { purgeStalePending } from "@/lib/leads/service";

export const runtime = "nodejs";

/**
 * Retention cleanup, called by a scheduled job. Deletes un-actioned pending
 * leads older than the cutoff. Protected by a shared secret. Confirmed-lead
 * retention (un-actioned after 18 months) is handled once the admin actioned
 * flag exists (SPEC-07); see docs/privacy/retention-and-consent.md.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const db = await getDb();
  const purged = await purgeStalePending(db, 30);
  return Response.json({ ok: true, purged });
}
