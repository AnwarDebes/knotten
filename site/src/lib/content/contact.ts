import { CONTACT, FACT, type Lang, type T } from "@/lib/facts";
import type { CompanyFacts } from "@/lib/store";
import type { LeadRole } from "@/lib/leadForm";

/**
 * "Kontakt" (the details) and "Meld interesse" (the form) for both designs, in both languages. The details are the
 * facts (CONTACT, FACT) and what the administrator has entered under Innstillinger (company email, phone,
 * organisation number and postal address); a field that is not entered is left out, never guessed.
 */

const L = (no: string, en: string): T => ({ no, en });

export const CONTACT_PAGE = {
  title: L("Kontakt", "Contact"),
  description: L(
    "Spørsmål om tomtene, prosjektet eller samarbeid går rett til daglig leder i Sigve Simonsen AS. Her kan du også melde interesse eller be om tilgang til prosjektportalen.",
    "Questions about the plots, the project or partnerships go straight to the managing director of Sigve Simonsen AS. Here you can also register interest or ask for access to the project portal.",
  ),
  lede: L(
    "Spørsmål om tomtene, prosjektet eller samarbeid går rett til daglig leder. Vi svarer innen to virkedager.",
    "Questions about the plots, the project or partnerships go straight to the managing director. We answer within two working days.",
  ),
  owner: L("Prosjekteier", "Project owner"),
  where: L("Hvor", "Where"),
  whereNote: L("Stedet der feltet ligger, ikke en postadresse.", "Where the field is, not a postal address."),
  map: L("Åpne i kart", "Open in a map"),
  sales: L("Salg skjer gjennom megler når reguleringen er vedtatt.", "Sales go through an estate agent once the zoning is adopted."),
  privacy: L(
    `Opplysningene du sender lagres av ${CONTACT.company} for å svare deg, og til det du selv krysser av for. Du kan be om innsyn eller sletting når som helst.`,
    `What you send is kept by ${CONTACT.company} to answer you, and for what you tick yourself. You can ask to see or delete it at any time.`,
  ),
  interest: L("Meld interesse", "Register interest"),
  access: L("Be om tilgang til prosjektportalen", "Ask for access to the project portal"),
};

/** The form's heading and the line under it; a request for portal access says so. */
export function formHead(role: LeadRole, lang: Lang): { title: string; text: string } {
  if (role === "access") {
    return lang === "no"
      ? { title: "Be om tilgang", text: "Trenger du tilgang til prosjektportalen? Fortell hvem du er, hvilken organisasjon du kommer fra og hvilket område det gjelder, så tar prosjektet kontakt med deg om tilgangen." }
      : { title: "Request access", text: "Do you need access to the project portal? Tell us who you are, which organisation you are from and which area it is about, and the project will contact you about access." };
  }
  return lang === "no"
    ? { title: "Meld interesse", text: "Tomtene er ikke lagt ut for salg ennå. Si fra hvem du er og hva du er interessert i, så hører du fra oss når det skjer noe. Du velger selv hva vi får bruke kontakten til." }
    : { title: "Register interest", text: "The plots are not for sale yet. Tell us who you are and what you are interested in, and you will hear from us when something happens. You choose what we may use your contact details for." };
}

/** The contact details in a language: the facts, with the company details the administrator has entered. */
export function contactDetails(lang: Lang, company: CompanyFacts, orgDisplay: string) {
  const email = company.email || CONTACT.email;
  const phone = company.phone || CONTACT.phone_intl;
  return {
    company: CONTACT.company,
    role: CONTACT.role[lang],
    name: CONTACT.name,
    email,
    phone,
    tel: phone.replace(/[^\d+]/g, ""),
    org: orgDisplay ? `${lang === "no" ? "Org.nr." : "Org. no."} ${orgDisplay}` : "",
    postal: company.postal_address,
    place: CONTACT.place,
    coords: `${FACT.lat} N, ${FACT.lon} ${lang === "no" ? "Ø" : "E"}`,
    mapUrl: `https://www.openstreetmap.org/?mlat=${FACT.lat}&mlon=${FACT.lon}#map=16/${FACT.lat}/${FACT.lon}`,
  };
}
