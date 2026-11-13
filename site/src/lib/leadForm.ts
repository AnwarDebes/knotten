import { AREAS, AREA_LABEL, type Area } from "./auth-shared";
import { CONSENT_TEXT, type ConsentPurpose } from "./consent";
import { CONTACT, type Lang, type T } from "./facts";
import { plotsFromQuery } from "./member-paths";
import { plotNo } from "./format";

/**
 * One interest form for both designs ("Meld interesse" / "Register interest"): the fields, the choices, the words
 * and what the browser sends to /api/leads. The Klassisk and the Moderne form are two skins over this; the API reads
 * the same fields with readLeadExtras and writes the project's note with leadNote. No Node imports here.
 *
 * The fields are the union of what the two forms had: name, email, phone, who the person is (with a finer choice
 * than the four lead purposes, among them a request for access to the project portal), the organisation, any number
 * of plots, a message, and the three optional consents. Contact about the request itself needs no consent.
 */

const L = (no: string, en: string): T => ({ no, en });

// ------------------------------------------------------------------ who is getting in touch
/** The four purposes the project's lead records use (lib/store.ts). */
export type LeadPurpose = "buy" | "invest" | "partner" | "curious";

export type LeadRole = "buyer" | "follow" | "investor" | "municipality" | "research" | "press" | "access";
export const LEAD_ROLES: readonly LeadRole[] = ["buyer", "follow", "investor", "municipality", "research", "press", "access"];

type RoleInfo = {
  label: T;
  /** The lead purpose it is counted under. */
  purpose: LeadPurpose;
  /** The form asks for an organisation. */
  org: boolean;
  /** The form offers the plots. */
  plots: boolean;
  /** Its name in a Klassisk address (/kontakt?rolle=tilgang) and in a Moderne one (/no/interesse?purpose=access). */
  rolle: string;
  purposeParam: string;
};

export const ROLE: Record<LeadRole, RoleInfo> = {
  buyer: { label: L("Boligkjøper", "Home buyer"), purpose: "buy", org: false, plots: true, rolle: "kjoper", purposeParam: "buy" },
  follow: { label: L("Følger med på prosjektet", "Following the project"), purpose: "curious", org: false, plots: true, rolle: "folge", purposeParam: "follow" },
  investor: { label: L("Investor eller samarbeidspartner", "Investor or partner"), purpose: "invest", org: true, plots: true, rolle: "investor", purposeParam: "invest" },
  municipality: { label: L("Kommune eller offentlig aktør", "Municipality or public body"), purpose: "partner", org: true, plots: false, rolle: "kommune", purposeParam: "municipality" },
  research: { label: L("Forsker eller student", "Researcher or student"), purpose: "partner", org: true, plots: false, rolle: "forsker", purposeParam: "research" },
  press: { label: L("Presse", "Press"), purpose: "curious", org: true, plots: false, rolle: "presse", purposeParam: "press" },
  access: { label: L("Trenger tilgang til prosjektportalen", "Need access to the project portal"), purpose: "partner", org: true, plots: false, rolle: "tilgang", purposeParam: "access" },
};

export const isLeadRole = (v: unknown): v is LeadRole => typeof v === "string" && (LEAD_ROLES as readonly string[]).includes(v);

/** Older addresses and older forms: Moderne's four purposes and Klassisk's role names. */
const ALIASES: Record<string, LeadRole> = { curious: "follow", partner: "investor", "kjøper": "buyer", boligkjoper: "buyer", "boligkjøper": "buyer" };

function roleFrom(v: string | undefined): LeadRole | null {
  const s = (v ?? "").trim().toLowerCase();
  if (!s) return null;
  for (const r of LEAD_ROLES) if (ROLE[r].purposeParam === s || ROLE[r].rolle === s || r === s) return r;
  return ALIASES[s] ?? null;
}

type Q = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * The choices an address asks for: `?purpose=access` or `?rolle=tilgang` (any role by either name), and plots as
 * `?plot=plot-07` or `?tomt=7` / `?tomt=07`, one or several (repeated or separated by commas).
 */
export function leadQuery(q: Q): { role: LeadRole; plots: string[] } {
  const role = roleFrom(one(q.purpose)) ?? roleFrom(one(q.rolle)) ?? "buyer";
  const plots = plotsFromQuery({ tomt: q.tomt, plot: q.plot }).filter((p) => Number(p.slice(5)) >= 1);
  return { role, plots };
}

/** The address of the form for a role: the Klassisk contact page or the Moderne interest page. */
export function leadQueryFor(role: LeadRole, design: "klassisk" | "moderne"): string {
  return design === "klassisk" ? `?rolle=${ROLE[role].rolle}` : `?purpose=${ROLE[role].purposeParam}`;
}

// ------------------------------------------------------------------ the portal area someone asks access to
export type AccessArea = Area | "unsure";
/** In the order people most often need them; the names are the portal's own. */
export const ACCESS_AREAS: readonly AccessArea[] = ["investor", "municipality", "research", "project", "energy", "resident", "unsure"];
const UNSURE = L("Vet ikke ennå", "Not sure yet");
export const isAccessArea = (v: unknown): v is AccessArea => v === "unsure" || (typeof v === "string" && (AREAS as readonly string[]).includes(v));
export const accessAreaLabel = (a: AccessArea, lang: Lang) => (a === "unsure" ? UNSURE[lang] : AREA_LABEL[a][lang]);

// ------------------------------------------------------------------ limits, shared by the form and the API
export const LEAD_MAX = { name: 120, phone: 40, organisation: 120, message: 1800 } as const;

/** The three optional boxes of the interest form, unticked until the person ticks them. */
export const LEAD_CONSENTS: readonly ConsentPurpose[] = ["updates", "investor", "research"];

// ------------------------------------------------------------------ what the browser sends
export type LeadPayload = {
  name: string;
  email: string;
  phone: string;
  role: LeadRole;
  /** The lead purpose of the role, for an API that does not know the roles yet. */
  purpose: LeadPurpose;
  organisation: string;
  access_area: AccessArea | "";
  plots: string[];
  message: string;
  consents: Partial<Record<ConsentPurpose, true>>;
  website: string;
  source: "web (klassisk)" | "web (moderne)";
  locale: Lang;
  elapsed: number;
  turnstile: string;
};

const field = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** The body for /api/leads from the form's fields. Fields the chosen role does not show are not sent. */
export function leadPayload(f: FormData, ctx: { source: LeadPayload["source"]; locale: Lang; shownAt: number; turnstile: string }): LeadPayload {
  const role = isLeadRole(f.get("role")) ? (f.get("role") as LeadRole) : "buyer";
  const info = ROLE[role];
  const area = field(f, "access_area");
  const consents: LeadPayload["consents"] = {};
  for (const p of LEAD_CONSENTS) if (f.get(`consent_${p}`)) consents[p] = true;
  return {
    name: field(f, "name").slice(0, LEAD_MAX.name),
    email: field(f, "email"),
    phone: field(f, "phone").slice(0, LEAD_MAX.phone),
    role,
    purpose: info.purpose,
    organisation: info.org ? field(f, "organisation").slice(0, LEAD_MAX.organisation) : "",
    access_area: role === "access" && isAccessArea(area) ? area : "",
    plots: info.plots ? f.getAll("plots").map(String).filter((p) => /^plot-\d{2}$/.test(p)) : [],
    message: field(f, "message").slice(0, LEAD_MAX.message),
    consents,
    website: field(f, "website"),
    source: ctx.source,
    locale: ctx.locale,
    elapsed: Date.now() - ctx.shownAt,
    turnstile: ctx.turnstile,
  };
}

// ------------------------------------------------------------------ what the API reads
export type LeadExtras = { role: LeadRole | null; organisation: string; area: AccessArea | null; message: string };

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** The role, organisation, portal area and message from a request body, each checked and cut to its length. */
export function readLeadExtras(body: Record<string, unknown>): LeadExtras {
  const role = isLeadRole(body.role) ? body.role : null;
  return {
    role,
    organisation: role && ROLE[role].org ? clip(body.organisation, LEAD_MAX.organisation) : "",
    area: role === "access" && isAccessArea(body.access_area) ? body.access_area : null,
    message: clip(body.message, LEAD_MAX.message),
  };
}

/** The lead purpose for a request: the role's when it has one, else the purpose it names (older forms). */
export function purposeFor(role: LeadRole | null, area: AccessArea | null, fallback: unknown): LeadPurpose {
  if (role === "access") return area === "investor" ? "invest" : area === "resident" ? "buy" : "partner";
  if (role) return ROLE[role].purpose;
  return (["buy", "invest", "partner", "curious"] as const).find((p) => p === fallback) ?? "curious";
}

/** The note the project reads on the lead, in Norwegian whatever the form's language. */
export function leadNote(x: LeadExtras): string {
  const lines: string[] = [];
  if (x.role === "access") lines.push(`Ber om tilgang til prosjektportalen${x.area ? `, området: ${accessAreaLabel(x.area, "no")}` : ""}.`);
  else if (x.role) lines.push(`Tar kontakt som: ${ROLE[x.role].label.no}.`);
  if (x.organisation) lines.push(`Organisasjon: ${x.organisation}.`);
  if (x.message) lines.push(x.message);
  return lines.join("\n");
}

// ------------------------------------------------------------------ the words, in both languages
export const LEAD_TEXT = {
  no: {
    name: "Navn", namePh: "Fornavn Etternavn", email: "E-post", emailPh: "navn@eksempel.no", phone: "Telefon (valgfritt)",
    role: "Hvem er du?", organisation: "Organisasjon (valgfritt)", area: "Hvilket område i portalen gjelder det?",
    plots: "Tomter du vil høre om (valgfritt)", plotsHelp: "Velg så mange du vil, eller ingen.", plot: "Tomt",
    message: "Melding (valgfritt)", messagePh: "Hva vil du vite mer om?", messageAccessPh: "Hva trenger du tilgang til, og hvorfor?",
    consents: "Samtykke (valgfritt)", rights: "Du kan trekke samtykker og be om innsyn eller sletting når som helst.",
    privacyWord: "personvernerklæringen", send: "Meld interesse", sendAccess: "Be om tilgang", sending: "Sender",
    orWrite: `Du kan også skrive til ${CONTACT.email}.`,
    thanksTitle: "Takk, vi har fått meldingen din", thanksAccessTitle: "Takk, forespørselen er sendt",
    thanks: "Interessen din er registrert, og vi svarer innen to virkedager.", thanksAccess: "Prosjektet tar kontakt med deg om tilgangen til portalen innen to virkedager.",
    asRole: "Registrert som", plotsChosen: "Tomter", consentsGiven: "Samtykker du har gitt", noConsents: "Ingen. Vi bruker opplysningene bare til å svare deg.",
    follow: "Vil du følge tomtene og få varsel når noe endres? Opprett en konto, så samles alt på Min side.", createAccount: "Opprett konto",
  },
  en: {
    name: "Name", namePh: "First and last name", email: "Email", emailPh: "name@example.com", phone: "Phone (optional)",
    role: "Who are you?", organisation: "Organisation (optional)", area: "Which area of the portal is it about?",
    plots: "Plots you want to hear about (optional)", plotsHelp: "Pick as many as you like, or none.", plot: "Plot",
    message: "Message (optional)", messagePh: "What would you like to know more about?", messageAccessPh: "What do you need access to, and why?",
    consents: "Consent (optional)", rights: "You can withdraw consents and ask to see or delete your data at any time.",
    privacyWord: "privacy statement", send: "Register interest", sendAccess: "Request access", sending: "Sending",
    orWrite: `You can also write to ${CONTACT.email}.`,
    thanksTitle: "Thank you, we have your message", thanksAccessTitle: "Thank you, the request is sent",
    thanks: "Your interest is registered, and we answer within two working days.", thanksAccess: "The project will contact you about access to the portal within two working days.",
    asRole: "Registered as", plotsChosen: "Plots", consentsGiven: "Consents you gave", noConsents: "None. We only use your details to answer you.",
    follow: "Want to follow the plots and hear when something changes? Create an account, and it all comes together on My page.", createAccount: "Create account",
  },
} satisfies Record<Lang, Record<string, string>>;

/** The consents in a few words, for the confirmation (the boxes themselves show the full text from lib/consent.ts). */
const CONSENT_SHORT: Record<ConsentPurpose, T> = {
  updates: L("Nyheter om Knotten på e-post", "News about Knotten by email"),
  plot_alerts: L("Varsler om tomtene du følger", "Alerts about the plots you follow"),
  investor: L("Kontakt om investering og samarbeid", "Contact about investing and partnering"),
  research: L("Bruk uten navn i forskningen med Universitetet i Agder", "Use without your name in the research with the University of Agder"),
};

/** What the confirmation lists back to the person: the role, the plots and the consents, in their language. */
export function leadSummary(p: Pick<LeadPayload, "role" | "plots" | "consents" | "access_area">, lang: Lang): { label: string; values: string[] }[] {
  const t = LEAD_TEXT[lang];
  const rows = [{ label: t.asRole, values: [p.role === "access" && p.access_area ? `${ROLE.access.label[lang]} (${accessAreaLabel(p.access_area, lang)})` : ROLE[p.role].label[lang]] }];
  if (p.plots.length) rows.push({ label: t.plotsChosen, values: [p.plots.map(plotNo).join(", ")] });
  const given = LEAD_CONSENTS.filter((c) => p.consents[c]);
  rows.push({ label: t.consentsGiven, values: given.length ? given.map((c) => CONSENT_SHORT[c][lang]) : [t.noConsents] });
  return rows;
}

/** The consent box texts, exactly as lib/consent.ts words them (the version the consent log records). */
export const consentText = (p: ConsentPurpose, lang: Lang) => CONSENT_TEXT[p].text[lang];

/** CONTACT_NOTICE split around the words that link to the privacy statement. */
export function splitAround(text: string, word: string): [string, string, string] {
  const at = text.lastIndexOf(word);
  return at >= 0 ? [text.slice(0, at), word, text.slice(at + word.length)] : [`${text} `, word, ""];
}
