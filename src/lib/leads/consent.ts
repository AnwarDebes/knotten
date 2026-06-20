/**
 * The consent text is the single source of truth: the form displays it and the
 * server stores it verbatim with its version and timestamp per lead, so it is
 * never reconstructed from untrusted client input. Bump the version whenever the
 * wording changes, and keep the history below.
 *
 * Version history:
 *   consent-v1 (2026-06-20): initial wording.
 */
export const CONSENT_VERSION = "consent-v1-2026-06-20";

export const CONSENT_TEXT = {
  no: "Jeg samtykker til at Sigve Simonsen AS lagrer navnet mitt, e-postadressen min og eventuelt telefonnummeret mitt for å kontakte meg om Knotten. Jeg kan trekke samtykket når som helst. Se personvernerklæringen.",
  en: "I consent to Sigve Simonsen AS storing my name, email address and any phone number to contact me about Knotten. I can withdraw my consent at any time. See the privacy policy.",
} as const;

export type ConsentLocale = keyof typeof CONSENT_TEXT;
