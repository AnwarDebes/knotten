import Link from "next/link";
import PageHead from "@/components/klassisk/PageHead";
import Reveal from "@/components/klassisk/Reveal";
import type { Lang } from "@/lib/facts/core";
import { CONTACT } from "@/lib/facts/project";
import { TEAM, TEAM_LABELS as L, TEAM_SOURCE, teamDate, teamMember, type Person } from "@/lib/facts/team";
import Monogram from "./Monogram";
import { klassiskHref } from "./paths";

const COPY = {
  no: { workTitle: "Levert, med dato og kilde" },
  en: { workTitle: "Delivered, with date and source" },
};

/** «…» for a Norwegian quote, “…” for an English one. */
const quoted = (text: string, lang: Lang) => (lang === "no" ? `«${text}»` : `“${text}”`);

/** One person's page in the Klassisk look: role and track, the work as a dated list, their quote, and where to read on. */
export default function TeamProfile({ person: p, locale }: { person: Person; locale: Lang }) {
  const c = COPY[locale];
  const href = (path: string) => klassiskHref(path, locale);
  const others = TEAM.filter((o) => o.slug !== p.slug);
  // the quote as written, and the site's translation beside it when the page is in the other language
  const original: Lang = p.quote.original === "both" ? locale : p.quote.original;
  const translated = original !== locale;
  return (
    <>
      <PageHead
        title={p.name}
        locale={locale}
        crumb={<><Link href={href("/teamet")}>{L.team[locale]}</Link> / {p.name}</>}
        aside={<Monogram person={p} locale={locale} size={168} />}
      >
        <p className="team-headline">{p.role[locale]}<span className="team-dot" aria-hidden="true" />{p.track[locale]}</p>
      </PageHead>

      <section className="sec">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{p.group === "owner" ? L.owner[locale] : L.group[locale]}</div>
            <p className="lede">{p.summary[locale]}</p>
            <dl className="team-facts">
              <div><dt>{L.role[locale]}</dt><dd>{p.role[locale]}</dd></div>
              <div><dt>{L.track[locale]}</dt><dd>{p.track[locale]}</dd></div>
              {p.organisation && (
                <div><dt>{p.organisation.label[locale]}</dt><dd>{p.organisation.title ? `${p.organisation.title[locale]}, ` : ""}{p.organisation.name}</dd></div>
              )}
              <div><dt>{L.deliverables[locale]}</dt><dd>{p.deliverables[locale]}</dd></div>
              <div><dt>{L.final[locale]}</dt><dd>{p.final[locale]}</dd></div>
            </dl>
            <p className="small">{TEAM_SOURCE[locale]}</p>
            {p.group === "owner" && (
              <div className="team-contact">
                <div className="eyebrow">{L.contact[locale]}</div>
                <div className="contact">
                  <b>{CONTACT.company}</b>
                  <span>{CONTACT.role[locale]}: {CONTACT.name}</span>
                  <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                  <a href={`tel:${CONTACT.tel}`}>{locale === "no" ? CONTACT.phone : CONTACT.phone_intl}</a>
                </div>
              </div>
            )}
          </Reveal>

          <Reveal className="stack" delay={120}>
            <div className="eyebrow">{L.work[locale]}</div>
            <h2>{c.workTitle}</h2>
            <ol className="team-time">
              {p.contributions.map((w) => (
                <li key={`${w.date}-${w.title.no}`}>
                  <time className="team-when" dateTime={w.date}>{teamDate(w.date, locale)}</time>
                  <div>
                    <h3>{w.title[locale]}</h3>
                    {w.provisional && <span className="tag">{L.provisional[locale]}</span>}
                    <p>{w.text[locale]}</p>
                    <p className="team-src">{L.source[locale]}: {w.source[locale]}</p>
                    {w.people && (
                      <p className="team-see">
                        {L.seeAlso[locale]}:{" "}
                        {w.people.map((slug, i) => {
                          const o = teamMember(slug);
                          return o ? <span key={slug}>{i > 0 && ", "}<Link href={href(`/teamet/${o.slug}`)}>{o.name}</Link></span> : null;
                        })}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap">
          <Reveal as="figure" className="team-quote">
            <div className="eyebrow">{L.quote[locale]}</div>
            <blockquote lang={translated ? (original === "no" ? "nb" : "en") : undefined}>
              <p>{quoted(p.quote.text[original], original)}</p>
            </blockquote>
            {translated && (
              <p className="team-quote-tr"><span>{L.translation[locale]}:</span> {quoted(p.quote.text[locale], locale)}</p>
            )}
            <figcaption>{p.name}. {p.quote.source[locale]}</figcaption>
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <div className="wrap split">
          <Reveal className="stack">
            <h2>{L.readOn[locale]}</h2>
            <ul className="team-links">
              {p.related.map((r) => (
                <li key={r.klassisk}>
                  <Link href={href(r.klassisk)}>
                    <b>{r.label[locale]}</b>
                    <span>{r.hint[locale]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="stack" delay={120}>
            <h2>{L.others[locale]}</h2>
            <ul className="team-others">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={href(`/teamet/${o.slug}`)}>
                    <Monogram person={o} locale={locale} size={60} />
                    <span><b>{o.name}</b><span>{o.role[locale]}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="cta-row">
              <Link className="btn ghost" href={href("/teamet")}>{L.all[locale]}</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
