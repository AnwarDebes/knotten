import { getDb } from "@/db";
import { interestSchema } from "@/lib/leads/validation";
import { createLead } from "@/lib/leads/service";
import { consume } from "@/lib/leads/rate-limit";
import { hashIp, verifyTurnstile } from "@/lib/leads/security";
import { sendEmail } from "@/lib/email";
import { confirmationEmail } from "@/lib/leads/emails";

export const runtime = "nodejs";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

const ok = () => Response.json({ ok: true });

export async function POST(req: Request) {
  // CSRF: reject cross-origin posts.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin) {
    try {
      if (new URL(origin).host !== host) return new Response("Forbidden", { status: 403 });
    } catch {
      return new Response("Forbidden", { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Honeypot: a filled hidden field means a bot. Respond as success, store nothing.
  if (
    typeof (body as { honeypot?: unknown }).honeypot === "string" &&
    (body as { honeypot: string }).honeypot.length > 0
  ) {
    return ok();
  }

  const parsed = interestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "validation" }, { status: 400 });
  }
  const input = parsed.data;

  const passedChallenge = await verifyTurnstile(input.turnstileToken, clientIp(req));
  if (!passedChallenge) {
    return Response.json({ ok: false, error: "challenge" }, { status: 403 });
  }

  const ip = clientIp(req);
  const db = await getDb();

  // Rate limit by IP (a 429 here is fine; it does not reveal an account).
  const ipAllowed = await consume(db, `ip:${hashIp(ip)}`, 8, 60 * 60 * 1000);
  if (!ipAllowed) {
    return Response.json({ ok: false, error: "rate" }, { status: 429 });
  }
  // Per-email limit: return the same generic success rather than a distinct
  // status, so it cannot be used to enumerate which emails are registered.
  const emailAllowed = await consume(
    db,
    `email:${input.email.toLowerCase()}`,
    3,
    24 * 60 * 60 * 1000,
  );
  if (!emailAllowed) {
    return ok();
  }

  const result = await createLead(db, input, { ip });

  // Send the double opt-in confirmation for a new or still-pending lead. An
  // already-confirmed email gets the same generic response (no enumeration).
  if (result.outcome === "created" || result.outcome === "pending") {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const locale = input.locale ?? "no";
    const confirmUrl = `${siteUrl}/api/interesse/bekreft?token=${encodeURIComponent(result.token)}&l=${locale}`;
    const unsubUrl = `${siteUrl}/api/interesse/avmeld?token=${encodeURIComponent(result.lead.unsubToken)}&l=${locale}`;
    const mail = confirmationEmail(locale, result.lead.name, confirmUrl, unsubUrl);
    try {
      await sendEmail({ to: result.lead.email, ...mail });
    } catch {
      // Do not fail the request if email is temporarily unavailable.
    }
  }

  return ok();
}
