import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import Src from "@/components/ui/Source";
import { Figure } from "@/components/ui/Provenance";
import { assumption } from "@/lib/facts";
import { pageMeta } from "@/lib/meta";
import { CHECK_IT, DATA_ROOM, FIGURES_PRINCIPLE, INVESTORS_PAGE, INVESTOR_FIGURES, PUBLIC_PARTNERS, QA_HEAD, investorQA } from "@/lib/content/investors";
import { leadQueryFor } from "@/lib/leadForm";

export const generateMetadata = pageMeta("/investor", {
  no: { title: INVESTORS_PAGE.title.no, description: INVESTORS_PAGE.description.no },
  en: { title: INVESTORS_PAGE.title.en, description: INVESTORS_PAGE.description.en },
});

/**
 * "Investorer og samarbeid" / "Investors and partners" in the Moderne look: the questions investors ask, answered with
 * the project's own figures, the data room, what the municipality and the University of Agder get, and how the
 * project works with figures. The words and figures come from src/lib/content/investors.ts, the same as Klassisk.
 */
export default async function Investor({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const interest = (role: "investor" | "access") => `/${locale}/interesse${leadQueryFor(role, "moderne")}`;
  return (
    <>
      <Nav locale={locale} />
      <PageHead
        title={INVESTORS_PAGE.title[locale]}
        lede={INVESTORS_PAGE.lede[locale]}
        action={<><Link className="btn btn-amber" href={interest("investor")}>{INVESTORS_PAGE.request[locale]}</Link><Link className="btn btn-ghost" href={`/${locale}/portal/investor`}>{INVESTORS_PAGE.dataRoom[locale]}</Link></>}
      />
      <section className="wrap pb-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {INVESTOR_FIGURES.map(({ key, src }) => <Figure key={key} a={assumption(key)} locale={locale} size="md" src={src} />)}
      </section>

      <section className="wrap section-tight">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] items-end mb-8">
          <div>
            <div className="label">{QA_HEAD.eyebrow[locale]}</div>
            <h2 className="display text-[clamp(34px,4.6vw,64px)] max-w-[14ch] mt-2">{QA_HEAD.title[locale]}.</h2>
          </div>
          <p className="lede max-w-[50ch] md:justify-self-end">{QA_HEAD.text[locale]}</p>
        </div>
        <div className="panel p-7 md:p-12 grid gap-x-14 gap-y-10 md:grid-cols-2">
          {investorQA(locale).map((x) => (
            <div key={x.q}>
              <h3 className="display text-[26px]">{x.q}</h3>
              <p className="mt-2.5 text-bone-2 text-[15.5px] max-w-[52ch]">{x.a}{x.src && <Src id={x.src} locale={locale} />}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section-tight grid gap-10 lg:grid-cols-[1fr_1fr] items-start">
        <div>
          <h2 className="display text-[clamp(30px,4vw,48px)]">{DATA_ROOM.title[locale]}</h2>
          <ul className="mt-5 grid gap-2">
            {DATA_ROOM.items.map((s) => <li key={s.no} className="grid grid-cols-[10px_1fr] gap-3 text-[15px]"><span className="w-1.5 h-1.5 rounded-full bg-amber mt-2.5" />{s[locale]}</li>)}
          </ul>
          <p className="provenance mt-5 max-w-[56ch]">{DATA_ROOM.reports[locale]}</p>
        </div>
        <div>
          <h2 className="display text-[clamp(30px,4vw,48px)]">{PUBLIC_PARTNERS.title[locale]}</h2>
          <ul className="mt-5 grid gap-2">
            {PUBLIC_PARTNERS.items.map((s) => <li key={s.no} className="grid grid-cols-[10px_1fr] gap-3 text-[15px]"><span className="w-1.5 h-1.5 rounded-full bg-fjord mt-2.5" />{s[locale]}</li>)}
          </ul>
          <p className="provenance mt-5 max-w-[56ch]">{PUBLIC_PARTNERS.note[locale]}</p>
          <Link className="btn btn-ghost btn-sm mt-4" href={interest("access")}>{PUBLIC_PARTNERS.access[locale]}</Link>
        </div>
      </section>

      <section className="wrap section-tight pb-24 grid gap-10 lg:grid-cols-[1fr_1fr] items-start">
        <div>
          <div className="label">{FIGURES_PRINCIPLE.eyebrow[locale]}</div>
          <h2 className="display text-[clamp(30px,4vw,48px)] mt-2">{FIGURES_PRINCIPLE.title[locale]}.</h2>
          <p className="mt-4 text-[15.5px] text-bone-2 max-w-[52ch]">{FIGURES_PRINCIPLE.text[locale]}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link className="btn btn-ghost" href={`/${locale}/kilder`}>{FIGURES_PRINCIPLE.sources[locale]}</Link>
            <Link className="btn btn-ghost" href={`/${locale}/portal/investor`}>{INVESTORS_PAGE.dataRoom[locale]}</Link>
          </div>
        </div>
        <div className="paper p-7 md:p-9">
          <h2 className="display text-[26px]">{CHECK_IT.title[locale]}</h2>
          <p className="mt-3 text-[15.5px] text-ink-2 max-w-[48ch]">{CHECK_IT.text[locale]}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link className="btn btn-sm" href={`/${locale}/energi`}>{CHECK_IT.energy[locale]}</Link>
            <Link className="btn btn-sm btn-ghost" href={`/${locale}/dokumenter`}>{CHECK_IT.documents[locale]}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
