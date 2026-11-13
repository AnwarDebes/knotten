import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import { pageMeta } from "@/lib/meta";
import { DOCUMENTS_PAGE, DOC_GROUPS, docRows, portalDocuments, type DocRow } from "@/lib/content/documents";

export const generateMetadata = pageMeta("/dokumenter", {
  no: { title: DOCUMENTS_PAGE.title.no, description: DOCUMENTS_PAGE.description.no },
  en: { title: DOCUMENTS_PAGE.title.en, description: DOCUMENTS_PAGE.description.en },
});

const CARD = "no-underline panel p-5 md:p-6 grid gap-2 md:gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_12.5rem] items-center hover:outline hover:outline-2 hover:outline-fjord/40 transition-[outline]";

function Card({ d, owner }: { d: DocRow; owner: string }) {
  const inner = (
    <>
      <div>
        <div className="display text-[20px] leading-tight">{d.title}</div>
        <div className="provenance mt-1">{d.date}, {owner}</div>
      </div>
      <p className="text-[14.5px] text-bone-2">{d.what}</p>
      <div className="flex flex-wrap gap-1.5 justify-self-start md:justify-self-end md:justify-end">
        <span className="chip">{d.format}</span>
        <span className={`chip ${d.login ? "" : "chip-pine"}`}>{d.accessLabel}</span>
      </div>
    </>
  );
  // a file is fetched as it is; a page of the site or the portal goes through the router, in the same tab
  return d.file ? <a href={d.href} className={CARD}>{inner}</a> : <Link href={d.href} className={CARD}>{inner}</Link>;
}

/** "Dokumentbank" / "Document bank": one register, grouped by who is behind each document, the same as Klassisk. */
export default async function Documents({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  return (
    <>
      <Nav locale={locale} />
      <PageHead
        title={DOCUMENTS_PAGE.title[locale]}
        lede={DOCUMENTS_PAGE.lede[locale]}
        action={<Link className="btn btn-ghost" href={portalDocuments(locale)}>{DOCUMENTS_PAGE.login[locale]}</Link>}
      />
      <section className="wrap pb-24 grid gap-12">
        {DOC_GROUPS.map((g) => (
          <div key={g.id}>
            <h2 className="display text-[clamp(24px,2.6vw,34px)] mb-4">{g.name[locale]}</h2>
            <ul className="grid gap-3">
              {docRows(g.id, "moderne", locale).map((d) => <li key={d.key}><Card d={d} owner={g.name[locale]} /></li>)}
            </ul>
          </div>
        ))}
        <div className="panel-2 p-6 md:p-8">
          <h2 className="display text-[26px]">{DOCUMENTS_PAGE.comingTitle[locale]}</h2>
          <ul className="mt-4 grid gap-2">
            {DOCUMENTS_PAGE.coming.map((c) => <li key={c.no} className="grid grid-cols-[10px_1fr] gap-3 text-[15px]"><span className="w-1.5 h-1.5 rounded-full bg-fjord mt-2.5" />{c[locale]}</li>)}
          </ul>
        </div>
      </section>
    </>
  );
}
