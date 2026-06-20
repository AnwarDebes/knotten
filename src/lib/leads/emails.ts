import type { EmailMessage } from "@/lib/email";
import type { ConsentLocale } from "./consent";
import type { Lead } from "@/db/schema";

/** Double opt-in confirmation email (no tracking pixels). */
export function confirmationEmail(
  locale: ConsentLocale,
  name: string,
  confirmUrl: string,
  unsubUrl: string,
): Omit<EmailMessage, "to"> {
  if (locale === "en") {
    return {
      subject: "Confirm your interest in Knotten",
      text: `Hi ${name},

Thank you for registering your interest in Knotten, Sjøutsikt i Rødberg.

Please confirm your email by opening this link:
${confirmUrl}

If you did not register, you can ignore this email and nothing is stored.

To withdraw at any time, use this link:
${unsubUrl}

Sigve Simonsen AS`,
    };
  }
  return {
    subject: "Bekreft interessen din for Knotten",
    text: `Hei ${name},

Takk for at du meldte interesse for Knotten, Sjøutsikt i Rødberg.

Bekreft e-postadressen din ved å åpne denne lenken:
${confirmUrl}

Hvis du ikke meldte interesse, kan du se bort fra denne e-posten, og ingenting blir lagret.

Du kan trekke samtykket når som helst via denne lenken:
${unsubUrl}

Sigve Simonsen AS`,
  };
}

/** Notification to the developer when a new lead confirms. No personal data beyond the contact. */
export function adminNotifyEmail(to: string, lead: Lead): EmailMessage {
  return {
    to,
    subject: `Ny interessemelding: ${lead.name}`,
    text: `Ny interessemelding bekreftet.

Navn: ${lead.name}
E-post: ${lead.email}
Telefon: ${lead.phone ?? "(ikke oppgitt)"}
Interesse: ${lead.interest ?? "(ikke oppgitt)"}
Kilde: ${lead.source ?? "(ukjent)"}
`,
  };
}
