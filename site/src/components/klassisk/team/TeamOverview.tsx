import Link from "next/link";
import PageHead from "@/components/klassisk/PageHead";
import Reveal from "@/components/klassisk/Reveal";
import { cap, word, type Lang } from "@/lib/facts/core";
import { TEAM, TEAM_LABELS as L, TEAM_SOURCE } from "@/lib/facts/team";
import Monogram from "./Monogram";
import { klassiskHref } from "./paths";

const COPY = {
  no: {
    lede: "Prosjekteieren og prosjektgruppen bak Knotten: hvem som har ansvar for hva, og hva de har levert, med dato og kilde.",
    groupTitle: "Ett spor hver",
    groupLede: (n: number) => `${cap(word(n, "no"))} studenter har hvert sitt spor, med prosjekteier som mentor: energien, markedet, og den digitale plattformen som binder sporene sammen.`,
  },
  en: {
    lede: "The project owner and the project group behind Knotten: who is responsible for what, and what they have delivered, with date and source.",
    groupTitle: "One track each",
    groupLede: (n: number) => `${cap(word(n, "en"))} students each have their own track, with the project owner as mentor: the energy, the market, and the digital platform that ties the tracks together.`,
  },
};

/** Klassisk's team page: the project owner first, then the project group with their tracks. Norwegian at /teamet. */
export default function TeamOverview({ locale }: { locale: Lang }) {
  const c = COPY[locale];
  const owner = TEAM.find((p) => p.group === "owner");
  const group = TEAM.filter((p) => p.group === "group");
  const href = (slug: string) => klassiskHref(`/teamet/${slug}`, locale);
  return (
    <>
      <PageHead title={L.team[locale]} crumb={L.team[locale]} locale={locale}>
        <p>{c.lede}</p>
      </PageHead>

      {owner && (
        <section className="sec">
          <div className="wrap team-owner">
            <Reveal className="team-owner-art">
              <Monogram person={owner} locale={locale} size={232} />
            </Reveal>
            <Reveal className="stack" delay={120}>
              <div className="eyebrow">{L.owner[locale]}</div>
              <h2>{owner.name}</h2>
              {owner.organisation && (
                <p className="team-meta">{owner.organisation.title ? `${owner.organisation.title[locale]}, ` : ""}{owner.organisation.name}</p>
              )}
              <p className="lede">{owner.summary[locale]}</p>
              <dl className="team-facts">
                <div><dt>{L.role[locale]}</dt><dd>{owner.role[locale]}</dd></div>
                <div><dt>{L.track[locale]}</dt><dd>{owner.track[locale]}</dd></div>
                <div><dt>{L.deliverables[locale]}</dt><dd>{owner.deliverables[locale]}</dd></div>
              </dl>
              <div className="cta-row">
                <Link className="btn" href={href(owner.slug)}>{L.profile[locale]}<span className="sr">: {owner.name}</span></Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section className="sec alt">
        <div className="wrap">
          <Reveal className="stack" style={{ maxWidth: "70ch" }}>
            <div className="eyebrow">{L.group[locale]}</div>
            <h2>{c.groupTitle}</h2>
            <p className="lede">{c.groupLede(group.length)}</p>
          </Reveal>
          <Reveal className="team-cols" stagger>
            {group.map((p) => (
              <article key={p.slug} className="team-person">
                <Monogram person={p} locale={locale} size={112} />
                <div className="team-track">{p.track[locale]}</div>
                <h3><Link href={href(p.slug)}>{p.name}</Link></h3>
                <p className="team-role">{p.role[locale]}</p>
                <p>{p.summary[locale]}</p>
                <span className="team-more" aria-hidden="true">{L.profile[locale]} <span className="team-arrow">→</span></span>
              </article>
            ))}
          </Reveal>
          <p className="small team-note">{TEAM_SOURCE[locale]}</p>
        </div>
      </section>
    </>
  );
}
