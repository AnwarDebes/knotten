import { CONTACT, INTERNSHIP, OFFICES, fmt, type Lang, type T } from "@/lib/facts";
import type { CompanyFacts } from "@/lib/store";

/**
 * "Om utbygger": who is behind Knotten, for both designs. Built from the facts (src/lib/facts) and the company
 * details the administrator has entered in the portal; a detail that is not entered is left out, never guessed.
 */
export type CompanyBlock = {
  title: string;
  lede: string;
  facts: { label: string; value: string; href?: string }[];
  proof: { title: string; text: string };
  uia: { title: string; text: string };
  registry?: { label: string; href: string };
};

const t = (lang: Lang, v: T) => v[lang];

/** The organisation number's own page in Brønnøysundregistrene, so anyone can check it. */
export const brregUrl = (org: string) => `https://virksomhet.brreg.no/nb/oppslag/enheter/${org.replace(/\D/g, "")}`;

export function companyBlock(lang: Lang, company: CompanyFacts, orgDisplay: string): CompanyBlock {
  const no = lang === "no";
  const email = company.email || CONTACT.email;
  const phone = company.phone || CONTACT.phone_intl;
  const facts: CompanyBlock["facts"] = [
    { label: no ? "Utbygger og prosjekteier" : "Developer and project owner", value: CONTACT.company },
    { label: no ? "Daglig leder" : "Managing director", value: CONTACT.name },
  ];
  if (company.org_number) facts.push({ label: no ? "Organisasjonsnummer" : "Organisation number", value: orgDisplay, href: brregUrl(company.org_number) });
  if (company.postal_address) facts.push({ label: no ? "Postadresse" : "Postal address", value: company.postal_address });
  facts.push({ label: no ? "E-post" : "Email", value: email, href: `mailto:${email}` });
  facts.push({ label: no ? "Telefon" : "Phone", value: phone, href: `tel:${phone.replace(/[^\d+]/g, "")}` });
  return {
    title: no ? "Om utbygger" : "About the developer",
    lede: no
      ? `Knotten utvikles av ${CONTACT.company}, på et byggefelt prosjektet eier selv ved Rødbergsveien i Lindesnes. ${CONTACT.name} er daglig leder og prosjekteier: han gir retningen og tar beslutningene i prosjektet.`
      : `Knotten is developed by ${CONTACT.company}, on building land the project owns itself by Rødbergsveien in Lindesnes. ${CONTACT.name} is the managing director and project owner: he sets the direction and makes the decisions in the project.`,
    facts,
    proof: {
      title: no ? "Det som står der i dag" : "What stands there today",
      text: no
        ? `På eiendommen står allerede et kontorbygg med ${fmt(OFFICES.now)} ferdige kontorer, som utvides til ${fmt(OFFICES.after)}, og et bolighus. Begge er i drift, og målt strømforbruk fra dem blir sammenligningsgrunnlaget for de nye boligene.`
        : `The property already has an office building with ${fmt(OFFICES.now, "en")} completed offices, being extended to ${fmt(OFFICES.after, "en")}, and a house. Both are in use, and their measured power consumption becomes the basis of comparison for the new homes.`,
    },
    uia: {
      title: no ? "Samarbeid med Universitetet i Agder" : "Working with the University of Agder",
      text: no
        ? `Prosjektet samarbeider med Universitetet i Agder gjennom et internship for studenter: ${fmt(INTERNSHIP.hours)} timer i to fagspor, energi og teknikk, og marked og profilering. Tallene på nettsiden kommer fra dette arbeidet og fra prosjekteier, og står med kilde.`
        : `The project works with the University of Agder through an internship for students: ${fmt(INTERNSHIP.hours, "en")} hours in two tracks, energy and technology, and market and profile. The figures on the website come from this work and from the project owner, and carry their source.`,
    },
    ...(company.org_number ? { registry: { label: no ? "Se selskapet i Brønnøysundregistrene" : "See the company in the Brønnøysund Register", href: brregUrl(company.org_number) } } : {}),
  };
}

/** The organisation number line for a footer, or nothing until it is entered. */
export function orgLine(lang: Lang, orgDisplay: string): string {
  return orgDisplay ? `${lang === "no" ? "Org.nr." : "Org. no."} ${orgDisplay}` : "";
}

export const ROLE: T = CONTACT.role;
export const roleText = (lang: Lang) => t(lang, ROLE);
