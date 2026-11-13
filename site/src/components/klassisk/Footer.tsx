import Link from "next/link";
import Logo from "./Logo";
import OwnerLogo from "./OwnerLogo";
import Credits, { CreditsLine } from "./Credits";
import FooterAccount from "./FooterAccount";
import { CONTACT } from "@/lib/facts";
import { kHref } from "@/lib/klassisk/locale";
import { orgLine } from "@/lib/content/company";
import { footerColumns, klassiskLink } from "@/lib/pages";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";

/**
 * The Klassisk footer in Norwegian and English: the logo, what the site is and who is behind it, then the same three
 * columns as the Moderne footer (Stedet, Prosjektet, For deg) from the page registry (src/lib/pages.ts), each with
 * the pages Klassisk has, and the credits for maps, data and photos.
 */
export default async function Footer({ locale = "no" }: { locale?: "no" | "en" }) {
  const no = locale === "no";
  const { company } = await loadPublicSettings();
  const email = company.email || CONTACT.email;
  const phone = company.phone || CONTACT.phone_intl;
  const org = orgLine(locale, formatOrgNumber(company.org_number));
  const line = { display: "block", padding: "4px 0", fontSize: ".95rem" } as const;
  return (
    <footer className="site">
      <div className="wrap">
        <div>
          <Link className="flogo" href={kHref("/", locale)} aria-label={no ? "Knotten, til forsiden" : "Knotten, to the front page"}>
            <Logo size={64} light locale={locale} />
          </Link>
          <p className="note">
            {no
              ? "Planlagt som Norges mest energivennlige boligfelt, på Rødberg i Lindesnes. Alle tall på siden er foreløpige anslag som kan spores til dokumenterte forutsetninger. Ingenting her er et tilbud."
              : "Planned as Norway's most energy-friendly housing development, at Rødberg in Lindesnes. Every figure on the site is a provisional estimate that can be traced to documented assumptions. Nothing here is an offer."}
          </p>
          <div className="fcontact">
            <span style={line}>{`${no ? "Prosjekteier" : "Project owner"}: ${CONTACT.company}`}</span>
            <a href={`mailto:${email}`}>{email}</a>
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
            {company.postal_address && <span style={line}>{company.postal_address}</span>}
            <span style={line}>{CONTACT.place}</span>
            {org && <span className="orgnr" style={line}>{org}</span>}
          </div>
        </div>
        {footerColumns("klassisk").map((col) => {
          // Klassisk's contact page is also its interest form: one link to it is enough
          const seen = new Set<string>();
          const links = col.pages.flatMap((p) => {
            const href = klassiskLink(p, locale);
            if (!href || seen.has(href)) return [];
            seen.add(href);
            return [{ href, name: p.name[locale], key: p.key }];
          });
          return (
            <div key={col.key}>
              <h2>{col.title[locale]}</h2>
              {links.filter((l) => l.key !== "privacy").map((l) => <Link key={l.key} href={l.href}>{l.name}</Link>)}
              {col.key === "you" && <FooterAccount locale={locale} />}
              {links.filter((l) => l.key === "privacy").map((l) => <Link key={l.key} href={l.href}>{l.name}</Link>)}
            </div>
          );
        })}
        <div className="bottom">
          <OwnerLogo light />
          <CreditsLine locale={locale} />
          <Credits locale={locale} />
        </div>
      </div>
    </footer>
  );
}
