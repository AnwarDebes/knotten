import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import { pageMeta } from "@/lib/meta";
import { privacyStatement, privacySwitches, type Inline } from "@/lib/content/privacy";
import { MODEL_ON } from "@/lib/server/assistant";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";

export const generateMetadata = pageMeta("/personvern", {
  no: { title: "Personvern", description: "Personvernerklæringen for Knotten: hva vi lagrer, hvorfor, hvor lenge, og hvordan du får innsyn i det eller får det slettet." },
  en: { title: "Privacy", description: "The privacy statement for Knotten: what we store, why, for how long, and how you can see it or have it deleted." },
});

function Parts({ parts }: { parts: Inline[] }) {
  return <>{parts.map((x, i) => (typeof x === "string" ? x : <a key={i} href={x.href} className="underline underline-offset-4" {...(x.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{x.text}</a>))}</>;
}

export default async function Privacy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const no = locale === "no";
  const { company } = await loadPublicSettings();
  const s = privacyStatement(locale, { company, orgDisplay: formatOrgNumber(company.org_number), modelOn: MODEL_ON, ...privacySwitches(), minSideHref: `/${locale}/min-side` });
  return (
    <>
      <Nav locale={locale} />
      <PageHead title={no ? "Personvern" : "Privacy"} lede={s.lede} />
      <section className="wrap pb-24 grid gap-10 lg:grid-cols-[260px_1fr] items-start">
        <aside className="lg:sticky lg:top-[calc(var(--nav-h)+24px)] grid gap-4">
          <p className="provenance">{s.updated}</p>
          <nav aria-label={no ? "Innhold" : "Contents"} className="grid gap-1 text-[15px]">
            {s.sections.map((x) => <a key={x.id} href={`#${x.id}`} className="no-underline text-ink-2 hover:text-ink py-1">{x.title}</a>)}
          </nav>
        </aside>
        <div className="prose">
          {s.sections.map((x, i) => (
            <section key={x.id} aria-labelledby={x.id}>
              <h2 id={x.id} className={`scroll-mt-[calc(var(--nav-h)+16px)] ${i === 0 ? "!mt-0" : ""}`}>{x.title}</h2>
              {x.blocks.map((b, j) =>
                b.kind === "p" ? <p key={j}><Parts parts={b.parts} /></p> : <ul key={j}>{b.items.map((it, k) => <li key={k}><Parts parts={it} /></li>)}</ul>,
              )}
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
