import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import { loadNews } from "@/lib/data";
import { dateLong } from "@/lib/facts";
import { pageMeta } from "@/lib/meta";
import { registerPath } from "@/lib/member-paths";
import { moderneLink, page } from "@/lib/pages";

export const generateMetadata = pageMeta("/nyheter", {
  no: { title: "Nyheter", description: "Det som har skjedd i prosjektet, etter hvert som det skjer." },
  en: { title: "News", description: "What has happened in the project, as it happens." },
});

export const dynamic = "force-dynamic";

/** What the administrator has published, newest first; the same items as Klassisk's news page. */
export default async function News({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const no = locale === "no";
  const items = await loadNews();
  return (
    <>
      <Nav locale={locale} />
      <PageHead title={no ? "Nyheter" : "News"} lede={no ? "Det som har skjedd i prosjektet, etter hvert som det skjer." : "What has happened in the project, as it happens."} />
      <section className="wrap pb-16">
        <div className="grid max-w-[72ch] border-t line">
          {items.map((n) => (
            <article key={n.id} aria-labelledby={`nyhet-${n.id}`} className="grid gap-2 sm:grid-cols-[150px_1fr] py-8 border-b line">
              <time dateTime={n.date} className="provenance pt-2">{dateLong(n.date, locale)}</time>
              <div>
                <h2 id={`nyhet-${n.id}`} className="display text-[30px] leading-tight">{n.title[locale]}</h2>
                <p className="mt-3 text-bone-2 max-w-[60ch]">{n.text[locale]}</p>
              </div>
            </article>
          ))}
          {items.length === 0 && <p className="text-muted py-8">{no ? "Ingen saker ennå." : "No items yet."}</p>}
        </div>
      </section>
      <section className="wrap pb-24">
        <div className="panel p-8 md:p-12 grid gap-6 lg:grid-cols-[1.4fr_1fr] items-center">
          <div>
            <div className="label">{no ? "Følg prosjektet" : "Follow the project"}</div>
            <h2 className="display text-[clamp(30px,3.6vw,46px)] mt-2">{no ? "Få nyhetene på e-post" : "Get the news by email"}</h2>
            <p className="lede mt-3 max-w-[52ch]">{no ? "Meld interesse og kryss av for nyheter, eller opprett en konto og følg tomtene du liker." : "Register interest and tick the box for news, or create an account and follow the plots you like."}</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Link className="btn btn-amber no-underline" href={moderneLink(page("interest"), locale) ?? `/${locale}/interesse`}>{page("interest").name[locale]}</Link>
            <Link className="btn btn-ghost no-underline" href={registerPath("moderne", locale)}>{page("register").name[locale]}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
