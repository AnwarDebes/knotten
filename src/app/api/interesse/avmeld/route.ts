import { getDb } from "@/db";
import { withdrawLead } from "@/lib/leads/service";

export const runtime = "nodejs";

/** Withdrawal (unsubscribe) via the stable token in the confirmation email. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const locale = url.searchParams.get("l") === "en" ? "en" : "no";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
  const dest = (success: boolean) =>
    `${siteUrl}/${locale}/meld-interesse?avmeldt=${success ? "1" : "0"}`;

  if (!token) return Response.redirect(dest(false), 303);
  const db = await getDb();
  const lead = await withdrawLead(db, token);
  return Response.redirect(dest(lead !== null), 303);
}
