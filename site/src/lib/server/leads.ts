import { newId, updateStore, type Lead } from "@/lib/store";
import type { ConsentPurpose } from "@/lib/consent";

/**
 * The one way a lead is created or updated, whichever form it comes from (interest forms in both designs, the
 * house configurator, sign-up, Min side). Callers validate their own input and pass it here; this function owns
 * merging by email, consent records and the activity log.
 *
 * CONTRACT STUB: the auth stream replaces the body (consent events, atomic storage, source checks). Keep the
 * signature and the return shape.
 */
export type LeadSource = "web (klassisk)" | "web (moderne)" | "konfigurator (klassisk)" | "konfigurator (moderne)" | "registrering" | "min side" | "admin";

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
};

export async function recordLead(input: LeadInput): Promise<{ id: string; repeat: boolean }> {
  const email = input.email.trim().toLowerCase().slice(0, 200);
  const at = new Date().toISOString();
  const note = [input.configuration ? `Husoppsett ${input.configuration.id}: ${input.configuration.summary}` : "", (input.message ?? "").trim().slice(0, 2000)].filter(Boolean).join("\n\n");
  return updateStore("Nettsiden", `${input.name || email} registrerte interesse`, (s) => {
    const known = s.leads.find((l) => l.email.toLowerCase() === email && l.source !== "eksempel");
    if (known) {
      known.plots = [...new Set([...known.plots, ...input.plots])].slice(0, 30);
      if (!known.name && input.name) known.name = input.name.slice(0, 120);
      if (!known.phone && input.phone) known.phone = input.phone.slice(0, 40);
      known.notes.push({ at, by: "Nettsiden", text: note || "Registrerte seg på nytt." });
      return { id: known.id, repeat: true };
    }
    const id = newId("lead");
    s.leads.push({
      id,
      name: input.name.slice(0, 120),
      email,
      phone: (input.phone ?? "").slice(0, 40),
      purpose: input.purpose,
      plots: input.plots.slice(0, 30),
      consent_updates: !!input.consents.updates,
      consent_investor: !!input.consents.investor,
      consent_research: !!input.consents.research,
      source: input.source,
      created: at,
      status: "new",
      notes: note ? [{ at, by: "Nettsiden", text: note }] : [],
    });
    return { id, repeat: false };
  });
}
