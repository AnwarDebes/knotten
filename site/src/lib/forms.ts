import { STORAGE_MESSAGE } from "./errors";

/**
 * What the public forms (the interest forms in both designs) share with /api/leads: the shortest believable time
 * to fill one in, the sources a browser may send, the roles and their names in an address, and what each answer
 * from the server means, in both languages. No Node imports here.
 */

/** A form sent sooner than this after it appeared was filled in by a program (the form sends the time it took). */
export const MIN_FILL_MS = 3000;

/** The lead sources a browser may name; the others are set by the server itself (admin, sign-up, Min side). */
export const BROWSER_LEAD_SOURCES = ["web (klassisk)", "web (moderne)", "konfigurator (klassisk)", "konfigurator (moderne)"] as const;

// ------------------------------------------------------------------ who is getting in touch, as an address says it
/** Who is getting in touch on the one interest form (lib/leadForm.ts has each role's words and rules). */
export type LeadRole = "buyer" | "follow" | "investor" | "municipality" | "research" | "press" | "access";
export const LEAD_ROLES: readonly LeadRole[] = ["buyer", "follow", "investor", "municipality", "research", "press", "access"];

/**
 * Each role's name in an address, the one table for both designs: Klassisk's contact page takes `?rolle=tilgang`,
 * Moderne's interest page `?purpose=access`. The forms read it (lib/leadForm.ts), and so does the design switch,
 * which turns one into the other (lib/design.ts). Here rather than in lib/leadForm.ts so the proxy, which reads
 * lib/design.ts, stays small.
 */
export const ROLE_PARAM: Record<LeadRole, { rolle: string; purpose: string }> = {
  buyer: { rolle: "kjoper", purpose: "buy" },
  follow: { rolle: "folge", purpose: "follow" },
  investor: { rolle: "investor", purpose: "invest" },
  municipality: { rolle: "kommune", purpose: "municipality" },
  research: { rolle: "forsker", purpose: "research" },
  press: { rolle: "presse", purpose: "press" },
  access: { rolle: "tilgang", purpose: "access" },
};

/** Older addresses and older forms: Moderne's four lead purposes and Klassisk's older role names. */
const ROLE_ALIASES: Record<string, LeadRole> = { curious: "follow", partner: "investor", "kjøper": "buyer", boligkjoper: "buyer", "boligkjøper": "buyer" };

/** The role an address names, by either design's name for it (or an older one); null when it names none. */
export function roleFromParam(v: string | null | undefined): LeadRole | null {
  const s = (v ?? "").trim().toLowerCase();
  if (!s) return null;
  for (const r of LEAD_ROLES) if (ROLE_PARAM[r].purpose === s || ROLE_PARAM[r].rolle === s || r === s) return r;
  return ROLE_ALIASES[s] ?? null;
}

export type LeadErrorCode = "invalid_email" | "too_fast" | "too_many" | "captcha" | "storage_unavailable" | "bad_request" | "error";

const TEXT: Record<LeadErrorCode, { no: string; en: string }> = {
  invalid_email: { no: "Sjekk e-postadressen.", en: "Check the email address." },
  too_fast: { no: "Skjemaet ble sendt veldig raskt. Vent et par sekunder og send igjen.", en: "The form was sent very quickly. Wait a couple of seconds and send it again." },
  too_many: { no: "Mange registreringer på kort tid. Vent litt og prøv igjen.", en: "Many registrations in a short time. Wait a little and try again." },
  captcha: { no: "Kontrollen av at du er et menneske gikk ikke gjennom. Prøv igjen.", en: "The check that you are a person did not go through. Try again." },
  storage_unavailable: STORAGE_MESSAGE,
  bad_request: { no: "Skjemaet kunne ikke sendes herfra. Last siden på nytt og prøv igjen.", en: "The form could not be sent from here. Reload the page and try again." },
  error: { no: "Det gikk ikke å sende. Prøv igjen om litt.", en: "It could not be sent. Try again shortly." },
};

/** The sentence to show for an answer from /api/leads. */
export function leadErrorText(code: string | undefined, locale: "no" | "en"): string {
  return (TEXT[code as LeadErrorCode] ?? TEXT.error)[locale];
}
