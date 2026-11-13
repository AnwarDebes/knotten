import { NextResponse, after } from "next/server";
import { readStore, type Lead } from "@/lib/store";
import { recordLead, type LeadSource } from "@/lib/server/leads";
import { limitId, take } from "@/lib/server/limit";
import { humanCheck } from "@/lib/server/human";
import { readTextCapped } from "@/lib/server/requestGuard";
import { recordEvent } from "@/lib/server/stats";
import { configuredOrigin, MAIL_ON, sendMail, siteOrigin } from "@/lib/server/mail";
import { isStorageUnavailable, STORAGE } from "@/lib/server/kv";
import { CONSENT_TEXT, type ConsentPurpose } from "@/lib/consent";
import { BROWSER_LEAD_SOURCES, MIN_FILL_MS, type LeadErrorCode } from "@/lib/forms";
import { leadNote, purposeFor, readLeadExtras } from "@/lib/leadForm";
import { plotNo } from "@/lib/format";
import { FACT } from "@/lib/facts";

const PURPOSE_NO: Record<Lead["purpose"], string> = { buy: "kjøpe bolig", invest: "investere", partner: "samarbeide", curious: "følge med" };
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** The largest body read, in bytes: the form's fields at their longest, with room to spare. */
const MAX_BODY = 20_000;

const fail = (error: LeadErrorCode, status: number) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
const hostOf = (u: string | null) => {
  try { return u ? new URL(u).host : ""; } catch { return ""; }
};

/** The request comes from a page on this site: the browser says so (Sec-Fetch-Site), or its Origin is this site. */
function sameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origin = hostOf(req.headers.get("origin"));
  if (!origin) return false;
  return [req.headers.get("x-forwarded-host"), req.headers.get("host"), hostOf(configuredOrigin())].includes(origin);
}

/**
 * Interest registration from the website forms (both designs). In order: JSON only, from a page on this site, the
 * hidden field robots fill in, a believable time to fill in the form, limits per network and per address
 * (counted atomically), Turnstile when it is set up, then the lead is recorded (lib/server/leads.ts) with exactly
 * the consents that were ticked. Contact about the registration itself needs no box; news and the rest are optional.
 * The one interest form (lib/leadForm.ts) also sends who the person is (`role`, among them a request for access to
 * the project portal with its `access_area`), an `organisation` and a `message`; they become the note on the lead.
 * Forms from before send `purpose` and `message` only, and are read as before.
 */
export async function POST(req: Request) {
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return fail("bad_request", 415);
  if (!sameOrigin(req)) return fail("bad_request", 403);
  // at most 20 kB is read: a larger body is refused before the rest of it is read
  const text = await readTextCapped(req, MAX_BODY).catch(() => "");
  if (text === null) return fail("bad_request", 413);
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fail("bad_request", 400);
    body = parsed as Record<string, unknown>;
  } catch {
    return fail("bad_request", 400);
  }
  // robots fill in every field, people never see this one: answer as usual, keep nothing
  if (String(body.website ?? "").trim()) return NextResponse.json({ ok: true });
  const elapsed = Number(body.elapsed);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return fail("too_fast", 400);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  if (!EMAIL.test(email)) return fail("invalid_email", 400);
  const source = BROWSER_LEAD_SOURCES.find((s) => s === body.source) as LeadSource | undefined;
  if (!source) return fail("bad_request", 400);
  if (STORAGE === "temp") return fail("storage_unavailable", 503);

  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim().slice(0, 64);
  const perNetwork = await take([{ key: `leads:i:${limitId(ip)}`, max: 5, windowSec: 600 }]);
  if (!perNetwork.ok) return fail("too_many", 429);
  if (!(await humanCheck(body.turnstile, ip))) return fail("captcha", 400);
  // the limit per address counts only answers that passed the check above, so nobody can use up another person's allowance
  const perAddress = await take([{ key: `leads:e:${limitId(email)}`, max: 3, windowSec: 3600 }]);
  if (!perAddress.ok) return fail("too_many", 429);

  const extras = readLeadExtras(body);
  const access = extras.role === "access";
  const purpose: Lead["purpose"] = purposeFor(extras.role, extras.area, body.purpose);
  // any number of the plots there are (the form offers them all), each a real plot number, each once
  const plots = Array.isArray(body.plots) ? [...new Set(body.plots.filter((p): p is string => typeof p === "string" && /^plot-\d{2}$/.test(p) && Number(p.slice(5)) >= 1 && Number(p.slice(5)) <= FACT.plots))].slice(0, FACT.plots) : [];
  const name = String(body.name ?? "").trim().slice(0, 120);
  const phone = String(body.phone ?? "").trim().slice(0, 40);
  // the one form: who the person is, the organisation and the message, as one note; older forms: their message as it was
  const message = extras.role ? leadNote(extras) : String(body.message ?? "").trim().slice(0, 2000);
  const locale = body.locale === "en" ? "en" : "no";
  // only boxes that were ticked; forms from before the consent log sent three flags
  const given = (body.consents && typeof body.consents === "object" ? body.consents : { updates: body.consent_updates, investor: body.consent_investor, research: body.consent_research }) as Record<string, unknown>;
  const consents: Partial<Record<ConsentPurpose, boolean>> = {};
  for (const p of Object.keys(CONSENT_TEXT) as ConsentPurpose[]) if (given[p] === true) consents[p] = true;

  let repeat: boolean;
  try {
    ({ repeat } = await recordLead({ name, email, phone, purpose, plots, message, consents, source, locale }));
  } catch (e) {
    if (isStorageUnavailable(e)) return fail("storage_unavailable", 503);
    console.error("[knotten] a lead could not be saved", e);
    return fail("error", 500);
  }

  await recordEvent(repeat ? "lead_repeat" : "lead");
  if (!repeat) await recordEvent(`lead_${purpose}`);

  // tell the project owner, after the answer has gone back to the visitor; a request for portal access is told
  // even from an address the records know, since it asks the owner to do something
  if (MAIL_ON && (!repeat || access)) {
    const origin = await siteOrigin();
    const who = (name || email).replace(/[\r\n\t]+/g, " ");
    after(async () => {
      const { settings } = await readStore();
      const where = origin ? `\n\nSvar og sett status i portalen:\n${origin}/no/portal/admin/interessenter?status=new` : "\n\nSvar og sett status i portalen under Interessenter.";
      const what = access ? "ber om tilgang til prosjektportalen" : `vil ${PURPOSE_NO[purpose]}`;
      await sendMail(
        settings.contact_email,
        access ? `Forespørsel om tilgang: ${who}` : `Ny interessent: ${who}`,
        `${name || "(uten navn)"} <${email}> ${what}.${plots.length ? `\nTomter: ${plots.map(plotNo).join(", ")}` : ""}${message ? `\n\n${message}` : ""}${repeat ? "\n\nAdressen er registrert fra før; forespørselen er lagt som et notat på interessenten." : ""}${where}`,
        { replyTo: email },
      );
    });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
