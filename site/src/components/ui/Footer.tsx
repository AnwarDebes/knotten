import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { ASSUMPTIONS_VERSION, CONTACT, FACT } from "@/lib/facts";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";
import { orgLine } from "@/lib/content/company";
import { footerColumns, moderneLink, page } from "@/lib/pages";
import Logo from "./Logo";
import Credits from "./Credits";
import FooterAccount from "./FooterAccount";

/**
 * The close of every page: the name large, the way to get in touch, the map of the site and who is behind it. The
 * three columns (Stedet, Prosjektet, For deg) come from the page registry (src/lib/pages.ts), the same scheme as the
 * Klassisk footer.
 */
export default async function Footer({ locale }: { locale: Locale }) {
  const no = locale === "no";
  const { company } = await loadPublicSettings();
  const email = company.email || CONTACT.email;
  const phone = company.phone || CONTACT.phone_intl;
  const org = orgLine(locale, formatOrgNumber(company.org_number));
  const link = "no-underline text-ink-2 hover:text-ink";
  return (
    <footer className="mt-auto">
      <div className="wrap pb-6 pt-10">
        <div className="panel-2 overflow-hidden">
          <div className="p-8 md:p-14 grid gap-12 lg:grid-cols-[1.1fr_1.4fr]">
            <div>
              <div className="display text-[clamp(52px,9vw,140px)] leading-[.9] tracking-tight">Knotten</div>
              <p className="lede mt-5 max-w-[40ch]">{no ? `Sjøutsikt i Rødberg. Rundt ${FACT.plots} energivennlige boliger på knausen over Sniksfjorden, nær Audna elvas utløp.` : `Sea view at Rødberg. About ${FACT.plots} energy-friendly homes on the knoll above Sniksfjorden, near the mouth of the Audna.`}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                <Link className="btn btn-amber no-underline" href={moderneLink(page("interest"), locale)!}>{page("interest").name[locale]}</Link>
                <a className="btn btn-ghost no-underline" href={`mailto:${email}`}>{no ? "Skriv til oss" : "Write to us"}</a>
              </div>
            </div>
            <nav aria-label={no ? "Alle sidene" : "Every page"} className="grid gap-8 sm:grid-cols-3 content-start">
              {footerColumns("moderne").map((col) => (
                <div key={col.key} className="grid content-start gap-2.5 text-[15px]">
                  <h2 className="text-muted mb-1 text-[15px] font-normal">{col.title[locale]}</h2>
                  {col.pages.filter((x) => x.key !== "privacy").map((x) => <Link key={x.key} href={moderneLink(x, locale)!} className={link}>{x.name[locale]}</Link>)}
                  {col.key === "you" && <FooterAccount locale={locale} className={link} />}
                  {col.pages.filter((x) => x.key === "privacy").map((x) => <Link key={x.key} href={moderneLink(x, locale)!} className={link}>{x.name[locale]}</Link>)}
                </div>
              ))}
            </nav>
          </div>
          <div className="px-8 md:px-14 py-6 border-t line flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] text-muted">
            <span className="inline-flex items-center gap-3 text-ink"><Logo height={40} wordmark={false} /><span>{CONTACT.company}</span></span>
            {org && <span className="text-ink-2">{org}</span>}
            {company.postal_address && <span>{company.postal_address}</span>}
            <span>{CONTACT.place}</span>
            <a className="no-underline hover:underline" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
            <span className="lg:ml-auto">{no ? "Forutsetninger" : "Assumptions"} {ASSUMPTIONS_VERSION} ({no ? "foreløpig" : "provisional"}).</span>
            <Credits locale={locale} />
          </div>
        </div>
      </div>
    </footer>
  );
}
