import { NextResponse, after } from "next/server";
import { recordLead } from "@/lib/server/leads";
import { allow } from "@/lib/server/limit";
import { recordEvent } from "@/lib/server/stats";
import { MAIL_ON, sendMail, siteOrigin } from "@/lib/server/mail";
import { readStore } from "@/lib/store";
import { cleanConfig, configuratorPath, describeConfig, factsFor, newConfigId, recordSent } from "@/lib/server/configurations";
import type { SendPayload, SendResponse } from "@/lib/configurator/types";
import { clientIp, fail, jsonBody } from "../checks";

export const dynamic = "force-dynamic";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** A form sent sooner than this after it opened was not filled in by a person. */
const MIN_ELAPSED_MS = 4000;

/**
 * A configured house sent to Sigve Simonsen AS from the configurator in either design. The configuration is
 * cleaned and stored, and the person becomes a lead (or an existing lead with the same email is updated) with the
 * configuration on it; the project owner gets an email when email is set up. Spam brakes: JSON from a page on this
 * site only, a hidden field robots fill in, at least four seconds with the form open, and at most five sends per
 * network in ten minutes and three per email address in an hour.
 */
export async function POST(req: Request) {
  const got = await jsonBody(req);
  if ("error" in got) return got.error;
  const b = (got.body && typeof got.body === "object" ? got.body : {}) as Partial<Record<keyof SendPayload, unknown>>;

  // robots fill in every field, people never see this one: answer as usual, keep nothing
  if (String(b.website ?? "").trim()) return NextResponse.json({ ok: true, id: newConfigId() } satisfies SendResponse);
  if (typeof b.elapsed !== "number" || !Number.isFinite(b.elapsed) || b.elapsed < MIN_ELAPSED_MS) return fail(400, "too_fast");
  if (!(await allow("cfg-send", clientIp(req), 5, 10))) return fail(429, "too_many");

  const name = typeof b.name === "string" ? b.name.replace(/\s+/g, " ").trim().slice(0, 120) : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase().slice(0, 200) : "";
  if (!name) return fail(400, "name_required");
  if (!EMAIL.test(email)) return fail(400, "invalid_email");
  const phone = typeof b.phone === "string" ? b.phone.trim().slice(0, 40) : "";
  const message = typeof b.message === "string" ? b.message.trim().slice(0, 2000) : "";
  const design = b.design === "klassisk" || b.design === "moderne" ? b.design : null;
  const locale = b.locale === "no" || b.locale === "en" ? b.locale : null;
  if (!design || !locale) return fail(400, "invalid_form");
  const config = await cleanConfig(b.config);
  if (!config) return fail(400, "invalid_config");
  // only the boxes the person ticked or unticked, and only the two this form shows
  const consents: SendPayload["consents"] = {};
  if (b.consents && typeof b.consents === "object") {
    for (const k of ["updates", "plot_alerts"] as const) {
      const v = (b.consents as Record<string, unknown>)[k];
      if (typeof v === "boolean") consents[k] = v;
    }
  }
  if (!(await allow("cfg-send-email", email, 3, 60))) return fail(429, "too_many");

  const facts = await factsFor(config);
  const id = newConfigId();
  const summary = describeConfig(config, "no", facts);
  const lead = await recordLead({
    name, email, phone, message, consents, locale,
    purpose: "buy",
    plots: config.plot ? [config.plot] : [],
    source: design === "klassisk" ? "konfigurator (klassisk)" : "konfigurator (moderne)",
    configuration: { id, summary },
  });
  await recordSent({ id, lead: lead.id, config, design, locale });
  await recordEvent("configurator_send");

  // tell the project owner, after the answer has gone back to the visitor
  if (MAIL_ON) {
    const origin = await siteOrigin();
    after(async () => {
      const { settings } = await readStore();
      await sendMail(
        settings.contact_email,
        `Husvalg fra konfiguratoren: ${name}`,
        [
          `${name} <${email}>${phone ? `, ${phone}` : ""} har sendt et husvalg fra konfiguratoren (${design} utseende, ${locale === "no" ? "norsk" : "engelsk"}).`,
          summary,
          message ? `Melding:\n${message}` : "",
          `Se husvalget og interessenten i portalen:\n${origin}/no/portal/admin/konfigurator?lead=${encodeURIComponent(lead.id)}`,
          `Åpne konfiguratoren med disse valgene:\n${origin}${configuratorPath(config, "no")}`,
        ].filter(Boolean).join("\n\n"),
      );
    });
  }
  return NextResponse.json({ ok: true, id } satisfies SendResponse, { headers: { "Cache-Control": "no-store" } });
}
