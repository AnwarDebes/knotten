import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import { pageMeta } from "@/lib/meta";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";
import { CONTACT_PAGE, contactDetails } from "@/lib/content/contact";
import { leadQueryFor } from "@/lib/leadForm";

export const generateMetadata = pageMeta("/kontakt", {
  no: { title: CONTACT_PAGE.title.no, description: CONTACT_PAGE.description.no },
  en: { title: CONTACT_PAGE.title.en, description: CONTACT_PAGE.description.en },
});

/**
 * "Kontakt" / "Contact" in the Moderne look: the project owner's details and where the field is, with the way to the
 * one interest form (/{l}/interesse, also for portal access). The same details as the Klassisk contact page.
 */
export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const { company } = await loadPublicSettings();
  const c = contactDetails(locale, company, formatOrgNumber(company.org_number));
  return (
    <>
      <Nav locale={locale} />
      <PageHead title={CONTACT_PAGE.title[locale]} lede={`${CONTACT_PAGE.lede[locale]} ${CONTACT_PAGE.sales[locale]}`} />
      <section className="wrap pb-24 grid gap-10 md:grid-cols-2 items-start">
        <div>
          <h2 className="display text-[30px]">{c.company}</h2>
          <p className="mt-3 text-[17px]">{CONTACT_PAGE.owner[locale]}. {c.role}: {c.name}</p>
          {c.org && <p className="mt-1 text-[15px] text-ink-2">{c.org}</p>}
          {c.postal && <p className="mt-1 text-[15px] text-ink-2">{c.postal}</p>}
          <p className="mt-3 text-[17px]"><a href={`mailto:${c.email}`}>{c.email}</a></p>
          <p className="mt-1 text-[17px]"><a href={`tel:${c.tel}`}>{c.phone}</a></p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link className="btn btn-amber" href={`/${locale}/interesse`}>{CONTACT_PAGE.interest[locale]}</Link>
            <Link className="btn btn-ghost" href={`/${locale}/interesse${leadQueryFor("access", "moderne")}`}>{CONTACT_PAGE.access[locale]}</Link>
          </div>
          <p className="provenance mt-6 max-w-[52ch]">{CONTACT_PAGE.privacy[locale]}</p>
        </div>
        <div className="panel p-7">
          <h2 className="font-medium">{CONTACT_PAGE.where[locale]}</h2>
          <p className="mt-2 text-[15.5px]">{c.place}<br />{c.coords}</p>
          <p className="provenance mt-2">{CONTACT_PAGE.whereNote[locale]}</p>
          <a className="inline-block mt-4 text-[15px] underline underline-offset-4" href={c.mapUrl} target="_blank" rel="noopener noreferrer">{CONTACT_PAGE.map[locale]}</a>
        </div>
      </section>
    </>
  );
}
