/**
 * The exact wording a person agrees to, with an id and the privacy statement's version, so every consent can be
 * stored as "what was shown, which version, when" (the website plan's rule for consent records).
 *
 * Contact about the person's own request (an interest registration, a configuration sent to us) needs no box:
 * it is the reason for the form, and the privacy page explains it. Everything below is optional and unticked.
 * Change a text: give it a new id (keep the old one for the records that were given under it) and bump
 * PRIVACY_VERSION.
 */
import type { T2 } from "./configurator/types";

export const PRIVACY_VERSION = "2026-11-12";

export type ConsentPurpose = "updates" | "plot_alerts" | "investor" | "research";

export const CONSENT_TEXT: Record<ConsentPurpose, { id: string; text: T2 }> = {
  updates: {
    id: "updates-v1",
    text: { no: "Send meg nyheter om Knotten på e-post. Jeg kan melde meg av når som helst.", en: "Send me news about Knotten by email. I can unsubscribe at any time." },
  },
  plot_alerts: {
    id: "plot-alerts-v1",
    text: { no: "Gi meg beskjed på e-post når status eller pris endres for tomtene jeg følger.", en: "Email me when the status or price of the plots I follow changes." },
  },
  investor: {
    id: "investor-v1",
    text: { no: "Kontakt meg om investering og samarbeid i prosjektet.", en: "Contact me about investing and partnering in the project." },
  },
  research: {
    id: "research-v1",
    text: { no: "Opplysningene mine kan brukes uten navn i forskningssamarbeidet med Universitetet i Agder.", en: "My details may be used without my name in the research collaboration with the University of Agder." },
  },
};

/** What the privacy page and every form say about the request itself (information, not a consent box). */
export const CONTACT_NOTICE: T2 = {
  no: "Vi bruker opplysningene til å svare deg om Knotten. Les mer i personvernerklæringen.",
  en: "We use your details to answer you about Knotten. Read more in the privacy statement.",
};

/** One stored consent decision. Append-only: a withdrawal is a new event with granted false. */
export type ConsentEvent = {
  at: string;
  purpose: ConsentPurpose;
  granted: boolean;
  text_id: string;
  privacy_version: string;
  source: "interest-form" | "configurator" | "signup" | "min-side" | "unsubscribe" | "admin";
};

export function consentEvents(given: Partial<Record<ConsentPurpose, boolean>>, source: ConsentEvent["source"], at = new Date().toISOString()): ConsentEvent[] {
  return (Object.keys(given) as ConsentPurpose[])
    .filter((p) => p in CONSENT_TEXT && typeof given[p] === "boolean")
    .map((p) => ({ at, purpose: p, granted: !!given[p], text_id: CONSENT_TEXT[p].id, privacy_version: PRIVACY_VERSION, source }));
}
