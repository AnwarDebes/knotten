import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import Monogram from "@/components/ui/team/Monogram";
import { cap, word } from "@/lib/facts/core";
import { TEAM, TEAM_LABELS as L, TEAM_SOURCE, nameList } from "@/lib/facts/team";
import { pageMeta } from "@/lib/meta";

const names = TEAM.map((p) => p.name);

export const generateMetadata = pageMeta("/team", {
  no: { title: "Teamet", description: `Prosjekteieren og prosjektgruppen bak Knotten: ${nameList(names, "no")}. Roller, spor og det de har levert, med dato og kilde.` },
  en: { title: "The team", description: `The project owner and the project group behind Knotten: ${nameList(names, "en")}. Roles, tracks and what they have delivered, with date and source.` },
});

/** The people behind Knotten: the project owner first, then the project group with their tracks. */
export default async function Team({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const no = locale === "no";
  const owner = TEAM.find((p) => p.group === "owner");
  const group = TEAM.filter((p) => p.group === "group");
  const href = (slug: string) => `/${locale}/team/${slug}`;
  return (
    <>
      <Nav locale={locale} />
      <PageHead
        title={L.team[locale]}
        lede={no
          ? "Prosjekteieren og prosjektgruppen bak Knotten: hvem som har ansvar for hva, og hva de har levert, med dato og kilde."
          : "The project owner and the project group behind Knotten: who is responsible for what, and what they have delivered, with date and source."}
      />

      {owner && (
        <section className="wrap pb-12 md:pb-16">
          <div className="panel p-6 md:p-10 grid gap-8 md:grid-cols-[auto_minmax(0,1fr)] items-center rise">
            <Monogram person={owner} locale={locale} className="w-40 h-40 md:w-60 md:h-60" />
            <div>
              <span className="chip chip-fjord">{L.owner[locale]}</span>
              <h2 className="display text-[clamp(34px,4.6vw,64px)] mt-4">{owner.name}</h2>
              {owner.organisation && (
                <p className="mt-3 text-[17px] font-medium">{owner.organisation.title ? `${owner.organisation.title[locale]}, ` : ""}{owner.organisation.name}</p>
              )}
              <p className="lede mt-4 max-w-[52ch]">{owner.summary[locale]}</p>
              <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-3 border-t line pt-5">
                <div><dt className="label">{L.role[locale]}</dt><dd className="mt-1 text-[15.5px]">{owner.role[locale]}</dd></div>
                <div><dt className="label">{L.track[locale]}</dt><dd className="mt-1 text-[15.5px]">{owner.track[locale]}</dd></div>
                <div><dt className="label">{L.deliverables[locale]}</dt><dd className="mt-1 text-[15.5px]">{owner.deliverables[locale]}</dd></div>
              </dl>
              <Link className="btn mt-8" href={href(owner.slug)}>{L.profile[locale]}<span className="sr-only">: {owner.name}</span></Link>
            </div>
          </div>
        </section>
      )}

      <section className="wrap section-tight pb-24">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] items-end mb-8">
          <h2 className="display text-[clamp(34px,4.6vw,64px)] rise">{no ? "Prosjektgruppen." : "The project group."}</h2>
          <p className="lede max-w-[46ch] md:justify-self-end rise rise-late">
            {no
              ? `${cap(word(group.length, "no"))} studenter har hvert sitt spor, med prosjekteier som mentor: energien, markedet, og den digitale plattformen som binder sporene sammen.`
              : `${cap(word(group.length, "en"))} students each have their own track, with the project owner as mentor: the energy, the market, and the digital platform that ties the tracks together.`}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {group.map((p) => (
            <article key={p.slug} className="panel p-6 md:p-7 relative flex flex-col gap-4 rise transition-colors hover:border-[var(--line-strong)]">
              <Monogram person={p} locale={locale} className="w-28 h-28" />
              <p className="flex items-start gap-2 text-[14px] font-medium text-fjord"><span className="w-1.5 h-1.5 rounded-full bg-fjord mt-[7px] shrink-0" aria-hidden="true" />{p.track[locale]}</p>
              <h3 className="display text-[30px]">
                <Link href={href(p.slug)} className="no-underline hover:underline focus-visible:outline-none after:absolute after:inset-0 after:rounded-[var(--radius-lg)] focus-visible:after:outline-2 focus-visible:after:outline-fjord focus-visible:after:outline-offset-4">{p.name}</Link>
              </h3>
              <p className="font-medium">{p.role[locale]}</p>
              <p className="text-[15.5px] text-bone-2">{p.summary[locale]}</p>
              <span className="mt-auto pt-2 text-[14px] font-medium text-fjord" aria-hidden="true">{L.profile[locale]} →</span>
            </article>
          ))}
        </div>
        <p className="provenance mt-6">{TEAM_SOURCE[locale]}</p>
      </section>
    </>
  );
}
