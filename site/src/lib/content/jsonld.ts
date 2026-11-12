import { CONTACT, FACT } from "@/lib/facts";
import type { CompanyFacts } from "@/lib/store";

/**
 * Structured data for search engines (schema.org JSON-LD): the company behind Knotten on both front pages, and
 * each plot as a place on the Moderne plot pages. Built from the facts and the administrator's company details;
 * the organisation number and the postal address are included only when they are entered.
 */
export function organizationJsonLd(site: string, company: CompanyFacts) {
  const org = company.org_number.replace(/\D/g, "");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site}/#utbygger`,
    name: CONTACT.company,
    url: site,
    logo: `${site}/img/logo-mark.png`,
    email: company.email || CONTACT.email,
    telephone: company.phone || CONTACT.phone_intl,
    employee: { "@type": "Person", name: CONTACT.name, jobTitle: CONTACT.role.no },
    ...(org ? { identifier: { "@type": "PropertyValue", propertyID: "Organisasjonsnummer", value: org } } : {}),
    ...(company.postal_address ? { address: company.postal_address } : {}),
  };
}

/** The whole field, which every plot lies in. */
const KNOTTEN = {
  "@type": "Place",
  name: "Knotten, Rødberg i Lindesnes",
  geo: { "@type": "GeoCoordinates", latitude: Number(FACT.lat), longitude: Number(FACT.lon) },
  address: { "@type": "PostalAddress", streetAddress: FACT.property_address, postalCode: FACT.postcode.split(" ")[0], addressLocality: "Lindesnes", addressRegion: "Agder", addressCountry: "NO" },
};

export function plotPlaceJsonLd(o: { site: string; path: string; name: string; description: string; lat: number; lon: number; elevation: number; lang: "no" | "en" }) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: o.name,
    description: o.description,
    url: `${o.site}${o.path}`,
    inLanguage: o.lang === "no" ? "nb" : "en",
    geo: { "@type": "GeoCoordinates", latitude: Number(o.lat.toFixed(6)), longitude: Number(o.lon.toFixed(6)), elevation: Math.round(o.elevation) },
    containedInPlace: KNOTTEN,
  };
}
