import { CONSENT_TEXT, type ConsentEvent, type ConsentPurpose } from "./consent";
import type { Lead } from "./store";

/**
 * A lead's consents are a log of events (lib/consent.ts): what the person agreed to or withdrew, the exact text by
 * id, the privacy statement's version, when, and where. The lead's three yes/no flags are read from the log, so
 * pages and exports that show the flags keep working.
 */
export const CONSENT_PURPOSES = Object.keys(CONSENT_TEXT) as ConsentPurpose[];

/** Each purpose's state: the newest event decides, and no event means not given. */
export function consentState(log: readonly ConsentEvent[]): Record<ConsentPurpose, boolean> {
  const state = Object.fromEntries(CONSENT_PURPOSES.map((p) => [p, false])) as Record<ConsentPurpose, boolean>;
  const newest: Partial<Record<ConsentPurpose, string>> = {};
  for (const e of log) {
    if (!(e.purpose in state)) continue;
    // the log is kept in order; equal times keep the later entry
    if (newest[e.purpose] === undefined || e.at >= newest[e.purpose]!) {
      newest[e.purpose] = e.at;
      state[e.purpose] = !!e.granted;
    }
  }
  return state;
}

/**
 * Leads saved before the log existed: each flag that was on becomes one event, marked as moved over (text and
 * privacy version "legacy", source "admin", the lead's own creation time). Nothing else is assumed.
 */
export function legacyEvents(l: Pick<Lead, "created" | "consent_updates" | "consent_investor" | "consent_research">): ConsentEvent[] {
  const flags: [ConsentPurpose, boolean | undefined][] = [["updates", l.consent_updates], ["investor", l.consent_investor], ["research", l.consent_research]];
  return flags.filter(([, on]) => on).map(([purpose]) => ({ at: l.created, purpose, granted: true, text_id: "legacy", privacy_version: "legacy", source: "admin" as const }));
}

/** The lead with its log in place and its flags read from it (a new object; the stored one is not touched). */
export function withConsentLog(l: Lead): Lead {
  const consent_log = Array.isArray(l.consent_log) ? l.consent_log : legacyEvents(l);
  const st = consentState(consent_log);
  return { ...l, consent_log, consent_updates: st.updates, consent_investor: st.investor, consent_research: st.research };
}

/** The last time the person and the project were in touch: registration, a reply, a note or a new registration. */
export function lastContact(l: Lead): string {
  const times = [l.created, l.replied, l.last_contact, ...l.notes.map((n) => n.at)].filter((x): x is string => !!x && !Number.isNaN(Date.parse(x)));
  return times.reduce((a, b) => (b > a ? b : a), l.created);
}
