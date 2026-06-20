import { getDb } from "@/db";
import { confirmLead } from "@/lib/leads/service";
import { sendEmail } from "@/lib/email";
import { adminNotifyEmail } from "@/lib/leads/emails";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const locale = url.searchParams.get("l") === "en" ? "en" : "no";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
  const dest = (success: boolean) =>
    `${siteUrl}/${locale}/meld-interesse?bekreftet=${success ? "1" : "0"}`;

  if (!token) return Response.redirect(dest(false), 303);

  const db = await getDb();
  const lead = await confirmLead(db, token);
  if (lead && lead.status === "confirmed") {
    const adminTo = process.env.EMAIL_ADMIN_NOTIFY;
    if (adminTo) {
      try {
        await sendEmail(adminNotifyEmail(adminTo, lead));
      } catch {
        // Notification failure must not break the confirmation for the user.
      }
    }
    return Response.redirect(dest(true), 303);
  }
  return Response.redirect(dest(false), 303);
}
