import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import Monogram from "@/components/ui/team/Monogram";
import type { Lang } from "@/lib/facts/core";
import { CONTACT } from "@/lib/facts/project";
import { TEAM, TEAM_LABELS as L, TEAM_SOURCE, personJsonLdText, teamDate, teamDescription, teamMember } from "@/lib/facts/team";
import { SITE, withAlternates } from "@/lib/meta";

/** Only the four people on the team have a page, in both languages; any other address under /team is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return TEAM.flatMap((p) => [{ locale: "no", slug: p.slug }, { locale: "en", slug: p.slug }]);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const p = teamMember(slug);
  if (!p) notFound();
  const base = withAlternates(`/team/${p.slug}`, locale, { title: p.name, description: teamDescription(p, locale) });
  const og = base.openGraph;
  const [firstName, ...rest] = p.name.split(" ");
  // a person's page is a profile in link previews, with the same text, address and picture as every other page
  return { ...base, openGraph: { type: "profile", firstName, lastName: rest.join(" "), title: og?.title, description: og?.description, url: og?.url, siteName: og?.siteName, locale: og?.locale, images: og?.images } };
}

/** «…» for a Norwegian quote, “…” for an English one. */
const quoted = (text: string, lang: Lang) => (lang === "no" ? `«${text}»` : `“${text}”`);

/** One person: role and track, the work as a dated list with sources, their quote, and where to read on. */
export default async function Person({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: l, slug } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const no = locale === "no";
  const p = teamMember(slug);
  if (!p) notFound();
  const others = TEAM.filter((o) => o.slug !== p.slug);
  const original: Lang = p.quote.original === "both" ? locale : p.quote.original;
  const translated = original !== locale;
  const facts: [string, string][] = [
    [L.role[locale], p.role[locale]],
    [L.track[locale], p.track[locale]],
    ...(p.organisation ? [[p.organisation.label[locale], `${p.organisation.title ? `${p.organisation.title[locale]}, ` : ""}${p.organisation.name}`] as [string, string]] : []),
    [L.deliverables[locale], p.deliverables[locale]],
    [L.final[locale], p.final[locale]],
  ];
  return (
    <>
      <Nav locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personJsonLdText(p, locale, `${SITE}/${locale}/team/${p.slug}`) }} />

      <section className="wrap pt-12 md:pt-16 pb-10 md:pb-14">
        <Link href={`/${locale}/team`} className="text-[14px] text-granite no-underline hover:underline">{L.all[locale]}</Link>
        <div className="mt-6 grid gap-8 md:grid-cols-[auto_minmax(0,1fr)] items-end">
          <Monogram person={p} locale={locale} className="w-40 h-40 md:w-60 md:h-60" />
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="chip chip-fjord">{p.group === "owner" ? L.owner[locale] : L.group[locale]}</span>
              <span className="chip">{p.role[locale]}</span>
            </div>
            <h1 className="display text-[clamp(42px,6vw,88px)] mt-4">{p.name}</h1>
            <p className="lede mt-5 max-w-[54ch]">{p.summary[locale]}</p>
          </div>
        </div>
      </section>

      <section className="wrap section-tight grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)] items-start">
        <div className="panel p-6 md:p-8">
          <dl className="grid">
            {facts.map(([dt, dd]) => (
              <div key={dt} className="grid gap-1 py-4 border-b line first:pt-0">
                <dt className="label">{dt}</dt>
                <dd className="text-[16px]">{dd}</dd>
              </div>
            ))}
          </dl>
          <p className="provenance mt-5">{TEAM_SOURCE[locale]}</p>
          {p.group === "owner" && (
            <div className="mt-6 pt-6 border-t line">
              <div className="label">{L.contact[locale]}</div>
              <p className="mt-2 font-medium">{CONTACT.company}</p>
              <p className="text-[15.5px]">{CONTACT.role[locale]}: {CONTACT.name}</p>
              <p className="text-[15.5px] [overflow-wrap:anywhere]"><a className="underline hover:text-fjord" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
              <p className="text-[15.5px]"><a className="underline hover:text-fjord" href={`tel:${CONTACT.tel}`}>{CONTACT.phone_intl}</a></p>            </div>
          )}
        </div>

        <div>
          <h2 className="display text-[clamp(30px,4vw,48px)]">{no ? "Levert, med dato og kilde." : "Delivered, with date and source."}</h2>
          <ol className="mt-6 grid">
            {p.contributions.map((w) => (
              <li key={`${w.date}-${w.title.no}`} className="grid gap-2 md:grid-cols-[150px_minmax(0,1fr)] md:gap-6 py-5 border-t line">
                <time className="text-[14px] text-muted md:pt-1 tabular-nums" dateTime={w.date}>{teamDate(w.date, locale)}</time>
                <div>
                  <h3 className="text-[19px] font-medium leading-snug">
                    {w.title[locale]}
                    {w.provisional && <span className="chip ml-2 align-middle">{L.provisional[locale]}</span>}
                  </h3>
                  <p className="text-[15.5px] text-bone-2 mt-2 max-w-[62ch]">{w.text[locale]}</p>
                  <p className="provenance mt-2">{L.source[locale]}: {w.source[locale]}</p>
                  {w.people && (
                    <p className="text-[14px] mt-2">
                      {L.seeAlso[locale]}:{" "}
                      {w.people.map((s, i) => {
                        const o = teamMember(s);
                        return o ? <span key={s}>{i > 0 && ", "}<Link className="underline hover:text-fjord" href={`/${locale}/team/${o.slug}`}>{o.name}</Link></span> : null;
                      })}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap section-tight">
        <figure className="sky p-7 md:p-12 lg:p-16 rise">
          <div className="label text-ink-2">{L.quote[locale]}</div>
          <blockquote lang={translated ? (original === "no" ? "nb" : "en") : undefined} className="display display-light text-[clamp(28px,3.6vw,52px)] leading-[1.12] mt-5 max-w-[26ch]">
            <p>{quoted(p.quote.text[original], original)}</p>
          </blockquote>
          {translated && (
            <p className="mt-6 text-[16px] text-ink-2 max-w-[60ch]"><span className="font-medium">{L.translation[locale]}:</span> {quoted(p.quote.text[locale], locale)}</p>
          )}
          <figcaption className="mt-6 text-[14px] text-ink-2">{p.name}. {p.quote.source[locale]}</figcaption>
        </figure>
      </section>

      <section className="wrap section-tight pb-24 grid gap-12 lg:grid-cols-2">
        <div>
          <h2 className="display text-[clamp(30px,4vw,48px)]">{L.readOn[locale]}.</h2>
          <div className="mt-6 grid gap-3">
            {p.related.map((r) => (
              <Link key={r.moderne} href={`/${locale}${r.moderne}`} className="panel p-5 md:p-6 no-underline grid gap-1 transition-colors hover:border-[var(--line-strong)]">
                <span className="display text-[24px]">{r.label[locale]}</span>
                <span className="text-[15px] text-bone-2">{r.hint[locale]}</span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="display text-[clamp(30px,4vw,48px)]">{L.others[locale]}.</h2>
          <ul className="mt-6 grid gap-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/${locale}/team/${o.slug}`} className="group flex items-center gap-4 no-underline">
                  <Monogram person={o} locale={locale} className="w-16 h-16" />
                  <span>
                    <span className="block font-medium group-hover:underline">{o.name}</span>
                    <span className="block text-[14px] text-muted">{o.role[locale]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link className="btn btn-ghost mt-8" href={`/${locale}/team`}>{L.all[locale]}</Link>
        </div>
      </section>
    </>
  );
}
