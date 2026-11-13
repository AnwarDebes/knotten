import "server-only";
import { newId, readStore, updateStore, type Lead } from "@/lib/store";
import { consentEvents, type ConsentEvent, type ConsentPurpose } from "@/lib/consent";
import { consentState, lastContact } from "@/lib/leadConsent";
import { plotNo } from "@/lib/format";

/**
 * The one way a lead is created or updated, whichever form it comes from (interest forms in both designs, the
 * house configurator, sign-up, Min side). Callers validate their own input and pass it here; this function owns
 * merging by email, the consent log and the activity log.
 *
 * Consents are an append-only log (lib/consent.ts): one event per box the person ticked (or unticked), with the
 * text's id, the privacy version, the time and the source. The lead's three flags are read from the log.
 * A second registration with a known address changes nothing on the lead unless the address is proven (`verified`,
 * a logged-in member): anyone can type someone else's email, so the new details are kept as a note for the
 * project to follow up, and consents are never widened from such a request.
 */
export type LeadSource = "web (klassisk)" | "web (moderne)" | "konfigurator (klassisk)" | "konfigurator (moderne)" | "registrering" | "min side" | "admin";
export const LEAD_SOURCES: readonly LeadSource[] = ["web (klassisk)", "web (moderne)", "konfigurator (klassisk)", "konfigurator (moderne)", "registrering", "min side", "admin"];

export type LeadInput = {
  name: string;
  email: string;
  phone?: string;
  purpose: Lead["purpose"];
  plots: string[];
  message?: string;
  /** Only the boxes the person actually ticked or unticked. */
  consents: Partial<Record<ConsentPurpose, boolean>>;
  source: LeadSource;
  locale: "no" | "en";
  /** A configuration sent from the house configurator, stored by lib/server/configurations. */
  configuration?: { id: string; summary: string };
  /** True only when the email address is proven (a logged-in member whose address is confirmed). */
  verified?: boolean;
};

const PURPOSES: Lead["purpose"][] = ["buy", "invest", "partner", "curious"];
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const CONSENT_SOURCE: Record<LeadSource, ConsentEvent["source"]> = {
  "web (klassisk)": "interest-form",
  "web (moderne)": "interest-form",
  "konfigurator (klassisk)": "configurator",
  "konfigurator (moderne)": "configurator",
  registrering: "signup",
  "min side": "min-side",
  admin: "admin",
};
const BY: Record<LeadSource, string> = {
  "web (klassisk)": "Nettsiden",
  "web (moderne)": "Nettsiden",
  "konfigurator (klassisk)": "Konfiguratoren",
  "konfigurator (moderne)": "Konfiguratoren",
  registrering: "Registreringen",
  "min side": "Min side",
  admin: "Administrator",
};
const PURPOSE_NO: Record<Lead["purpose"], string> = { buy: "kjøpe bolig", invest: "investere", partner: "samarbeide", curious: "følge med" };
const CONSENT_NO: Record<ConsentPurpose, string> = { updates: "nyheter på e-post", plot_alerts: "varsler om tomtene", investor: "kontakt om investering", research: "forskningen med UiA" };

const flags = (log: ConsentEvent[]) => {
  const st = consentState(log);
  return { consent_updates: st.updates, consent_investor: st.investor, consent_research: st.research };
};
const describe = (events: ConsentEvent[]) => events.map((e) => `${CONSENT_NO[e.purpose]} ${e.granted ? "ja" : "nei"}`).join(", ");

export async function recordLead(input: LeadInput): Promise<{ id: string; repeat: boolean }> {
  if (!LEAD_SOURCES.includes(input.source)) throw new TypeError(`Unknown lead source: ${String(input.source)}`);
  const email = input.email.trim().toLowerCase().slice(0, 200);
  if (!EMAIL.test(email)) throw new TypeError("A lead needs a valid email address");
  const at = new Date().toISOString();
  const by = BY[input.source];
  const name = (input.name ?? "").trim().slice(0, 120);
  const phone = (input.phone ?? "").trim().slice(0, 40);
  const purpose = PURPOSES.includes(input.purpose) ? input.purpose : "curious";
  const plots = [...new Set((input.plots ?? []).filter((p) => /^plot-\d{2}$/.test(p)))].slice(0, 30);
  const events = consentEvents(input.consents ?? {}, CONSENT_SOURCE[input.source], at);
  const message = (input.message ?? "").trim().slice(0, 2000);
  const config = input.configuration ? `Husoppsett ${input.configuration.id}: ${input.configuration.summary}`.slice(0, 1000) : "";

  // a change on Min side (a plot followed, a notification switched) is not a new registration
  const fromMinSide = input.source === "min side";
  return updateStore(by, `${name || email} ${fromMinSide ? "endret valg på Min side" : "registrerte interesse"}`, (s) => {
    const known = s.leads.find((l) => l.email.toLowerCase() === email && l.source !== "eksempel");
    if (known) {
      const lines = [fromMinSide ? "Endret på Min side." : `Registrerte seg på nytt (${PURPOSE_NO[purpose]}).`];
      if (input.verified) {
        known.consent_log = [...(known.consent_log ?? []), ...events];
        if (name) known.name = name;
        if (phone) known.phone = phone;
        known.plots = [...new Set([...known.plots, ...plots])].slice(0, 30);
        if (events.length) lines.push(`Samtykker: ${describe(events)}.`);
      } else {
        const asked = [
          plots.length ? `tomt ${plots.map(plotNo).join(", ")}` : "",
          name && name !== known.name ? `navnet «${name}»` : "",
          phone && phone !== known.phone ? `telefon ${phone}` : "",
          events.length ? `samtykker (${describe(events)})` : "",
        ].filter(Boolean);
        if (asked.length) lines.push(`Oppga ${asked.join(", ")}. Ikke lagt inn på interessenten, siden e-postadressen ikke er bekreftet.`);
      }
      if (config) lines.push(config);
      if (message) lines.push(message);
      known.notes.push({ at, by, text: lines.join("\n") });
      known.last_contact = at;
      Object.assign(known, flags(known.consent_log ?? []));
      return { id: known.id, repeat: true };
    }
    const id = newId("lead");
    const note = [config, message].filter(Boolean).join("\n\n");
    s.leads.push({
      id,
      name,
      email,
      phone,
      purpose,
      plots,
      ...flags(events),
      consent_log: events,
      source: input.source,
      created: at,
      last_contact: at,
      locale: input.locale === "en" ? "en" : "no",
      status: "new",
      notes: note ? [{ at, by, text: note }] : [],
    });
    return { id, repeat: false };
  });
}

// ------------------------------------------------------------------ a person's own wish to be forgotten
/**
 * Delete leads at the person's own request (a buyer deleting the account on Min side, with "delete my interest
 * registration" ticked). The callers decide which leads the person may delete: one the account created itself, or
 * one with the account's address once that address is confirmed. Lines in the activity log that name the person
 * ("Kari Nordmann registrerte interesse") lose the name.
 */
export async function forgetLeads(ids: string[], person: { name: string; email: string }): Promise<number> {
  const wanted = new Set(ids.filter(Boolean));
  if (!wanted.size) return 0;
  const names = [person.name.trim(), person.email.trim().toLowerCase()].filter((x) => x.length > 1);
  return updateStore("Min side", "en interessent slettet seg selv", (s) => {
    const before = s.leads.length;
    const gone = s.leads.filter((l) => wanted.has(l.id));
    for (const l of gone) if (l.name.trim().length > 1) names.push(l.name.trim());
    s.leads = s.leads.filter((l) => !wanted.has(l.id));
    s.activity = s.activity.map((a) => {
      const who = names.find((n) => a.what.startsWith(`${n} `));
      return who ? { ...a, what: `(slettet person)${a.what.slice(who.length)}` } : a;
    });
    return before - s.leads.length;
  });
}

/**
 * A buyer changed the account's address on Min side: the person's own leads take the new address, with a note, so
 * later registrations and the consent log stay on one record. Nothing moves when another lead already has the new
 * address (the project merges those by hand).
 */
export async function moveLeads(ids: string[], from: string, to: string): Promise<number> {
  const wanted = new Set(ids);
  const old = from.trim().toLowerCase(), next = to.trim().toLowerCase();
  if (!wanted.size || !EMAIL.test(next) || old === next) return 0;
  return updateStore("Min side", "en interessent endret e-postadresse", (s) => {
    if (s.leads.some((l) => l.email.toLowerCase() === next && !wanted.has(l.id))) return 0;
    const at = new Date().toISOString();
    let n = 0;
    for (const l of s.leads) {
      if (!wanted.has(l.id) || l.email.toLowerCase() !== old) continue;
      l.email = next;
      l.notes.push({ at, by: "Min side", text: "E-postadressen er endret på Min side." });
      n++;
    }
    return n;
  });
}

// ------------------------------------------------------------------ the CSV export
/**
 * One cell for Excel: quoted, and a value that starts like a formula (= + - @, or a tab or a line break) gets a
 * leading apostrophe, so a name typed into a form can never run as a formula on the owner's computer.
 */
export function csvCell(v: unknown) {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r\n]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const logText = (log: ConsentEvent[] | undefined) =>
  (log ?? []).map((e) => `${e.at.slice(0, 16).replace("T", " ")} ${e.purpose} ${e.granted ? "ja" : "nei"} (${e.text_id}, ${e.privacy_version}, ${e.source})`).join(" | ");

/** The leads as CSV (semicolons, for a Norwegian Excel), with the consent log in its own column. */
export function leadsCsv(leads: Lead[]) {
  const head = ["created", "name", "email", "phone", "purpose", "plots", "status", "replied", "counted", "consent_updates", "consent_investor", "consent_research", "consent_log", "last_contact", "source"];
  const rows = leads.map((x) => [x.created, x.name, x.email, x.phone, x.purpose, x.plots.join(" "), x.status, x.replied ?? "", !x.excluded, x.consent_updates, x.consent_investor, x.consent_research, logText(x.consent_log), lastContact(x), x.source].map(csvCell).join(";"));
  return [head.join(";"), ...rows].join("\n");
}

// ------------------------------------------------------------------ retention
/** Leads are kept 24 months after the last contact, then deleted (the delivery plan's rule for interest registrations). */
export async function cleanupLeads(at = new Date()) {
  const cut = new Date(at);
  cut.setMonth(cut.getMonth() - 24);
  const old = (l: Lead) => lastContact(l) < cut.toISOString();
  const due = (await readStore()).leads.filter(old);
  if (!due.length) return { leadsDeleted: 0 };
  const ids = new Set(due.map((l) => l.id));
  const deleted = await updateStore("Opprydding", `slettet ${due.length} interessenter uten kontakt på 24 måneder`, (s) => {
    const before = s.leads.length;
    s.leads = s.leads.filter((l) => !(ids.has(l.id) && old(l)));
    return before - s.leads.length;
  });
  return { leadsDeleted: deleted };
}
