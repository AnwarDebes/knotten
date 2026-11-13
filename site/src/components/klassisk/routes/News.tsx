import Link from "next/link";
import PageHead from "@/components/klassisk/PageHead";
import Reveal from "@/components/klassisk/Reveal";
import { loadNews } from "@/lib/data";
import { dateLong } from "@/lib/facts";
import { kHref, type KLocale } from "@/lib/klassisk/locale";
import { registerPath } from "@/lib/member-paths";
import { klassiskLink, page } from "@/lib/pages";
import { newsText } from "./text";

/**
 * Nyheter in the Klassisk design, in Norwegian (/nyheter) and English (/english/nyheter): what the administrator has
 * published in the portal, newest first, the same items as Moderne's news page.
 */
export default async function KlassiskNews({ locale }: { locale: KLocale }) {
  const no = locale === "no";
  const items = await loadNews();
  const t = newsText(locale);
  return (
    <>
      <PageHead title={t.title} crumb={t.title} locale={locale}>
        <p>{t.description}</p>
      </PageHead>
      <section className="sec">
        <div className="wrap">
          {items.length ? (
            <Reveal className="news" stagger>
              {items.map((n) => (
                <article key={n.id} aria-labelledby={`nyhet-${n.id}`}>
                  <time dateTime={n.date}>{dateLong(n.date, locale)}</time>
                  <div>
                    <h2 id={`nyhet-${n.id}`}>{n.title[locale]}</h2>
                    <p>{n.text[locale]}</p>
                  </div>
                </article>
              ))}
            </Reveal>
          ) : (
            <p className="lede">{no ? "Ingen saker ennå." : "No items yet."}</p>
          )}
        </div>
      </section>
      <section className="sec alt">
        <div className="wrap band">
          <Reveal className="stack">
            <div className="eyebrow">{no ? "Følg prosjektet" : "Follow the project"}</div>
            <h2>{no ? "Få nyhetene på e-post" : "Get the news by email"}</h2>
            <p className="lede">{no ? "Meld interesse og kryss av for nyheter, eller opprett en konto og følg tomtene du liker." : "Register interest and tick the box for news, or create an account and follow the plots you like."}</p>
          </Reveal>
          <div className="cta-row">
            <Link className="btn" href={klassiskLink(page("interest"), locale) ?? kHref("/kontakt", locale)}>{page("interest").name[locale]}</Link>
            <Link className="btn ghost" href={registerPath("klassisk", locale)}>{page("register").name[locale]}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
