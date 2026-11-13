import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import Src from "@/components/ui/Source";
import type { Status } from "@/lib/facts";
import { pageMeta } from "@/lib/meta";
import { SOURCES_PAGE, SOURCE_GROUPS, STATUS_ORDER, STATUS_TEXT, statusLabel } from "@/lib/content/sources";
import { DOCUMENTS_PAGE } from "@/lib/content/documents";

export const generateMetadata = pageMeta("/kilder", {
  no: { title: SOURCES_PAGE.title.no, description: SOURCES_PAGE.description.no },
  en: { title: SOURCES_PAGE.title.en, description: SOURCES_PAGE.description.en },
});

const CHIP: Record<Status, string> = { fastsatt: "chip chip-pine", verifisert: "chip chip-pine", beregnet: "chip chip-fjord", foreløpig: "chip chip-amber" };

/**
 * "Kilder og forutsetninger" / "Sources and assumptions" in the Moderne look: one table for every number on the
 * website (src/lib/content/sources.ts), the same as the Klassisk page. A phone gets one card per number instead
 * of a table wider than the screen.
 */
export default async function Sources({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const c = SOURCES_PAGE.columns;
  return (
    <>
      <Nav locale={locale} />
      <PageHead title={SOURCES_PAGE.title[locale]}>
        <p className="lede mt-6 max-w-[58ch]">{SOURCES_PAGE.lede[locale]}</p>
        <p className="provenance mt-3">{SOURCES_PAGE.version(locale)}</p>
      </PageHead>

      <section className="wrap pb-12">
        <div className="hidden md:block panel px-4 py-2 lg:px-6">
          <table className="table">
            <caption className="sr-only">{SOURCES_PAGE.title[locale]}</caption>
            <thead>
              <tr>
                <th scope="col">{c.what[locale]}</th>
                <th scope="col" className="n">{c.value[locale]}</th>
                <th scope="col">{c.unit[locale]}</th>
                <th scope="col">{c.status[locale]}</th>
                <th scope="col">{c.owner[locale]}</th>
                <th scope="col">{c.source[locale]}</th>
              </tr>
            </thead>
            {SOURCE_GROUPS.map((g) => (
              <tbody key={g.id}>
                <tr>
                  <th colSpan={6} scope="colgroup" className="pt-8 text-ink text-[16px] font-medium">
                    {g.title[locale]}
                    {g.note && <span className="block provenance font-normal mt-0.5">{g.note[locale]}</span>}
                  </th>
                </tr>
                {g.rows.map((r) => (
                  <tr key={r.key}>
                    <th scope="row" className="text-ink text-[15px] font-medium">{r.what[locale]}</th>
                    <td className="n whitespace-nowrap">{r.value[locale]}</td>
                    <td className="whitespace-nowrap">{r.unit[locale]}</td>
                    <td><span className={CHIP[r.status]}>{statusLabel(r.status, locale)}</span></td>
                    <td className="text-ink-2">{r.owner[locale]}</td>
                    <td><Src id={r.src} locale={locale} /></td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>

        <div className="md:hidden grid gap-10">
          {SOURCE_GROUPS.map((g) => (
            <section key={g.id} aria-labelledby={`m-${g.id}`}>
              <h2 id={`m-${g.id}`} className="display text-[26px]">{g.title[locale]}</h2>
              {g.note && <p className="provenance mt-1">{g.note[locale]}</p>}
              <ul className="mt-4 grid gap-2.5">
                {g.rows.map((r) => (
                  <li key={r.key} className="panel p-4 grid gap-1.5">
                    <div className="font-medium text-[15px]">{r.what[locale]}</div>
                    <div className="num text-[26px]">{r.value[locale]} <span className="text-[14px] font-body font-normal text-ink-2">{r.unit[locale]}</span></div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-ink-2"><span className={CHIP[r.status]}>{statusLabel(r.status, locale)}</span>{r.owner[locale]}<Src id={r.src} locale={locale} /></div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      <section className="wrap section-tight pb-24 grid gap-10 lg:grid-cols-[1fr_1.2fr] items-start">
        <div>
          <h2 className="display text-[clamp(30px,4vw,48px)]">{SOURCES_PAGE.legendTitle[locale]}.</h2>
          <p className="lede mt-4 max-w-[48ch]">{SOURCES_PAGE.principle[locale]}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link className="btn btn-ghost" href={`/${locale}/dokumenter`}>{DOCUMENTS_PAGE.title[locale]}</Link>
            <Link className="btn btn-ghost" href={`/${locale}/energi`}>{locale === "no" ? "Energi og teknologi" : "Energy and technology"}</Link>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="pt-4 border-t-2 line">
              <h3><span className={CHIP[s]}>{statusLabel(s, locale)}</span></h3>
              <p className="mt-2.5 text-[15px] text-ink-2">{STATUS_TEXT[s][locale]}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
