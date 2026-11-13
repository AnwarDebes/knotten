import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import Incoming from "@/components/ui/Incoming";
import Src from "@/components/ui/Source";
import { pageMeta } from "@/lib/meta";
import { COLLAB, GOALS, GOALS_HEAD, PLACE, PLAN_HEAD, PRINCIPLES, PRINCIPLES_HEAD, PROJECT_PAGE, SUCCESS, SUCCESS_HEAD, TRACKS, TRACKS_HEAD, projectPhases } from "@/lib/content/project";
import { DOCUMENTS_PAGE } from "@/lib/content/documents";

export const generateMetadata = pageMeta("/prosjektet", {
  no: { title: PROJECT_PAGE.title.no, description: PROJECT_PAGE.description.no },
  en: { title: PROJECT_PAGE.title.en, description: PROJECT_PAGE.description.en },
});

/**
 * "Om prosjektet" / "About the project" in the Moderne look: the ambition, the five goals, the principles, the three
 * tracks, the plan, what counts as success, the collaboration with the University of Agder and the place. The words
 * come from src/lib/content/project.ts, the same as the Klassisk page.
 */
export default async function Project({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const no = locale === "no";
  const tracks = TRACKS.filter((t) => t.packages.length);
  const platform = TRACKS.find((t) => t.id === "platform")!;
  const phases = projectPhases(locale);
  const p = PLACE.photo;

  return (
    <>
      <Nav locale={locale} />
      <PageHead title={PROJECT_PAGE.title[locale]}>
        <p className="lede mt-6 max-w-[58ch]">{PROJECT_PAGE.lede[locale]} <Src id={PROJECT_PAGE.ledeSrc} locale={locale} /></p>
      </PageHead>

      <section className="wrap section-tight">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] items-end mb-10">
          <div>
            <div className="label">{GOALS_HEAD.eyebrow[locale]}</div>
            <h2 className="display text-[clamp(34px,4.6vw,64px)] max-w-[14ch] mt-2">{GOALS_HEAD.title[locale]}.</h2>
          </div>
          <p className="lede max-w-[46ch] md:justify-self-end">{GOALS_HEAD.text[locale]}</p>
        </div>
        <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
          {GOALS.map((g, i) => (
            <li key={g.title.no} className="pt-4 border-t-2 line">
              <div className="num text-[30px] text-muted" aria-hidden>{i + 1}</div>
              <h3 className="font-medium text-[17px] mt-3">{g.title[locale]}</h3>
              <p className="text-[14.5px] text-ink-2 mt-1.5">{g.text[locale]}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap section-tight">
        <div className="label">{PRINCIPLES_HEAD.eyebrow[locale]}</div>
        <h2 className="display text-[clamp(30px,4vw,48px)] max-w-[20ch] mt-2 mb-8">{PRINCIPLES_HEAD.title[locale]}.</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PRINCIPLES.map((pr) => (
            <div key={pr.no} className="panel p-6">
              <div className="w-2.5 h-2.5 rounded-full bg-amber mb-4" />
              <p className="text-[15.5px] text-bone-2">{pr[locale]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section-tight">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] items-end mb-8">
          <div>
            <div className="label">{TRACKS_HEAD.eyebrow[locale]}</div>
            <h2 className="display text-[clamp(34px,4.6vw,64px)] max-w-[12ch] mt-2">{TRACKS_HEAD.title[locale]}.</h2>
          </div>
          <p className="lede max-w-[46ch] md:justify-self-end">{TRACKS_HEAD.text[locale]} <Src id={TRACKS_HEAD.src} locale={locale} /></p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {tracks.map((tr) => (
            <div key={tr.id} className="panel p-6 md:p-8">
              <h3 className="display text-[26px]">{tr.name[locale]}</h3>
              <p className="mt-3 text-[15px] text-ink-2 max-w-[60ch]">{tr.goal[locale]}</p>
              <ul className="mt-5 grid gap-4">
                {tr.packages.map((wp) => (
                  <li key={wp.title.no} className="grid gap-1 py-3 border-t line">
                    <h4 className="font-medium">{wp.title[locale]}</h4>
                    <p className="text-[14.5px] text-bone-2">{wp.what[locale]}</p>
                    <div className="provenance">{TRACKS_HEAD.deliverable[locale]}: {wp.deliverable[locale]}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="panel-2 p-6 md:p-8 mt-6 grid gap-5 md:grid-cols-[1fr_auto] items-center">
          <div>
            <h3 className="display text-[26px]">{platform.name[locale]}</h3>
            <p className="mt-2 text-[15.5px] text-ink-2 max-w-[70ch]">{platform.goal[locale]}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-ghost" href={`/${locale}/team`}>{COLLAB.team[locale]}</Link>
            <Link className="btn btn-ghost" href={`/${locale}/dokumenter`}>{DOCUMENTS_PAGE.title[locale]}</Link>
          </div>
        </div>
      </section>

      <section className="wrap section-tight grid gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="label">{PLAN_HEAD.eyebrow[locale]}</div>
          <h2 className="display text-[clamp(30px,4vw,48px)] mt-2">{PLAN_HEAD.title[locale]}</h2>
          <p className="mt-4 text-[15.5px] text-bone-2 max-w-[56ch]">{PLAN_HEAD.text[locale]} <Src id={PLAN_HEAD.src} locale={locale} /></p>
          <p className="mt-3 provenance max-w-[56ch]">{PLAN_HEAD.visit[locale]}</p>
          <ol className="mt-6 grid gap-3">
            {phases.map((ph, i) => (
              <li key={ph.name} className="grid grid-cols-[36px_1fr] gap-3 py-3 border-t line">
                <div className="num text-[24px] text-muted" aria-hidden>{i + 1}</div>
                <div>
                  <div className="font-medium">{ph.name} <span className="text-muted font-normal">{ph.inline}</span></div>
                  <p className="text-[14.5px] text-bone-2 mt-1">{ph.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="label">{SUCCESS_HEAD.eyebrow[locale]}</div>
          <h2 className="display text-[clamp(30px,4vw,48px)] mt-2">{SUCCESS_HEAD.title[locale]}</h2>
          <p className="mt-4 text-[15.5px] text-bone-2 max-w-[50ch]">{SUCCESS_HEAD.text[locale]}</p>
          <ul className="mt-5 grid gap-2">
            {SUCCESS.map((s) => <li key={s.no} className="grid grid-cols-[10px_1fr] gap-3 text-[15px]"><span className="w-1.5 h-1.5 rounded-full bg-amber mt-2.5" />{s[locale]}</li>)}
          </ul>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link className="btn btn-ghost" href={`/${locale}/dokumenter`}>{no ? "Arbeidsopplegget og dokumentene" : "The work structure and the documents"}</Link>
            <Link className="btn btn-ghost" href={`/${locale}/portal`}>{no ? "Portalen" : "The portal"}</Link>
          </div>
        </div>
      </section>

      <section className="wrap section-tight">
        <div className="panel p-7 md:p-12 grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="label">{COLLAB.eyebrow[locale]}</div>
            <h2 className="display text-[clamp(32px,4.5vw,56px)] max-w-[16ch] mt-2">{COLLAB.title[locale]}</h2>
            <p className="lede mt-5 max-w-[52ch]">{COLLAB.text[locale]}</p>
            <p className="mt-5 text-muted text-[15px] max-w-[52ch]">{COLLAB.contact[locale]}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link className="btn" href={`/${locale}/team`}>{COLLAB.team[locale]}</Link>
              <Link className="btn btn-ghost" href={`/${locale}/kontakt`}>{no ? "Kontakt" : "Contact"}</Link>
            </div>
          </div>
          <Incoming file="site_plan_sketch.webp" alt={COLLAB.sketch.alt[locale]} caption={COLLAB.sketch.caption[locale]} />
        </div>
      </section>

      <section className="wrap section-tight pb-24 grid gap-10 lg:grid-cols-[1.25fr_1fr] items-center">
        <figure>
          <Image src={p.src} alt={p.alt[locale]} width={p.w} height={p.h} sizes="(max-width: 1024px) 100vw, 55vw" quality={85} className="w-full h-auto rounded-[var(--radius-lg)]" />
          <figcaption className="provenance mt-2.5">{p.caption[locale]}. {p.by[locale]}: <a href={p.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{p.credit}</a>, {p.license}</figcaption>
        </figure>
        <div>
          <div className="label">{PLACE.eyebrow[locale]}</div>
          <h2 className="display text-[clamp(30px,4vw,48px)] mt-2">{PLACE.title[locale]}.</h2>
          <p className="lede mt-4 max-w-[52ch]">{PLACE.text[locale]} <Src id={PLACE.src} locale={locale} /></p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link className="btn btn-ghost" href={`/${locale}/omradet#kart`}>{PLACE.maps[locale]}</Link>
            <Link className="btn btn-ghost" href={`/${locale}/omradet#bilder`}>{PLACE.photos[locale]}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
