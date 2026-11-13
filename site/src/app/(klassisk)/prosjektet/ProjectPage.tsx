import Image from "next/image";
import Link from "next/link";
import PageHead from "@/components/klassisk/PageHead";
import Reveal from "@/components/klassisk/Reveal";
import { Src } from "@/components/klassisk/Source";
import { kHref, type KLocale } from "@/lib/klassisk/locale";
import { COLLAB, GOALS, GOALS_HEAD, PLACE, PLAN_HEAD, PRINCIPLES, PRINCIPLES_HEAD, PROJECT_PAGE, SUCCESS, SUCCESS_HEAD, TRACKS, TRACKS_HEAD, projectPhases } from "@/lib/content/project";
import { DOCUMENTS_PAGE } from "@/lib/content/documents";
import { CONTACT_PAGE } from "@/lib/content/contact";

/** The sketch on the project owner's site plan, as Klassisk serves it (lib/klassisk/maps.ts has the same file). */
const SKETCH = { src: "/img/skisse-situasjonsplan.png", w: 1234, h: 777 };

/**
 * "Om prosjektet" / "About the project" in the Klassisk look, in both languages: rendered by /prosjektet and
 * /english/prosjektet. The words come from src/lib/content/project.ts, the same as the Moderne page.
 */
export default function ProjectPage({ locale: l }: { locale: KLocale }) {
  const tracks = TRACKS.filter((t) => t.packages.length);
  const platform = TRACKS.find((t) => t.id === "platform")!;
  const p = PLACE.photo;
  return (
    <>
      <PageHead title={PROJECT_PAGE.title[l]} crumb={PROJECT_PAGE.title[l]} locale={l}>
        <p>{PROJECT_PAGE.lede[l]} <Src id={PROJECT_PAGE.ledeSrc} /></p>
      </PageHead>

      <section className="sec">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{GOALS_HEAD.eyebrow[l]}</div>
            <h2>{GOALS_HEAD.title[l]}</h2>
            <p className="lede">{GOALS_HEAD.text[l]}</p>
          </Reveal>
          <Reveal className="goals" stagger>
            {GOALS.map((g) => (
              <div key={g.title.no}><h3>{g.title[l]}</h3><p>{g.text[l]}</p></div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap">
          <Reveal className="stack" style={{ maxWidth: "70ch" }}>
            <div className="eyebrow">{PRINCIPLES_HEAD.eyebrow[l]}</div>
            <h2>{PRINCIPLES_HEAD.title[l]}</h2>
          </Reveal>
          <Reveal className="cols3 principles" stagger>
            {PRINCIPLES.map((pr) => (
              <div key={pr.no}><p>{pr[l]}</p></div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <Reveal className="stack" style={{ maxWidth: "70ch" }}>
            <div className="eyebrow">{TRACKS_HEAD.eyebrow[l]}</div>
            <h2>{TRACKS_HEAD.title[l]}</h2>
            <p className="lede">{TRACKS_HEAD.text[l]} <Src id={TRACKS_HEAD.src} /></p>
          </Reveal>
          <Reveal className="duo tracks" stagger>
            {tracks.map((tr) => (
              <div key={tr.id}>
                <h3>{tr.name[l]}</h3>
                <p className="tgoal">{tr.goal[l]}</p>
                <ul>
                  {tr.packages.map((wp) => (
                    <li key={wp.title.no}>
                      <b>{wp.title[l]}</b>
                      <span>{wp.what[l]}</span>
                      <span className="small">{TRACKS_HEAD.deliverable[l]}: {wp.deliverable[l]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Reveal>
          <Reveal className="band" style={{ marginTop: 40 }}>
            <div className="stack tplat">
              <h3>{platform.name[l]}</h3>
              <p>{platform.goal[l]}</p>
            </div>
            <div className="cta-row">
              <Link className="btn ghost" href={kHref("/teamet", l)}>{COLLAB.team[l]}</Link>
              <Link className="btn ghost" href={kHref("/dokumentbank", l)}>{DOCUMENTS_PAGE.title[l]}</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{PLAN_HEAD.eyebrow[l]}</div>
            <h2>{PLAN_HEAD.title[l]}</h2>
            <p className="measure">{PLAN_HEAD.text[l]} <Src id={PLAN_HEAD.src} /></p>
            <p className="measure small">{PLAN_HEAD.visit[l]}</p>
          </Reveal>
          <Reveal className="timeline" stagger>
            {projectPhases(l).map((ph) => (
              <div key={ph.name}>
                <span className="tw">{ph.when}</span>
                <b>{ph.name}</b>
                <span>{ph.text}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{SUCCESS_HEAD.eyebrow[l]}</div>
            <h2>{SUCCESS_HEAD.title[l]}</h2>
            <p className="lede">{SUCCESS_HEAD.text[l]}</p>
          </Reveal>
          <Reveal>
            <ul className="mticks">
              {SUCCESS.map((s) => <li key={s.no}>{s[l]}</li>)}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{COLLAB.eyebrow[l]}</div>
            <h2>{COLLAB.title[l]}</h2>
            <p className="lede">{COLLAB.text[l]}</p>
            <p className="small measure">{COLLAB.contact[l]}</p>
            <div className="cta-row" style={{ marginTop: 8 }}>
              <Link className="btn" href={kHref("/teamet", l)}>{COLLAB.team[l]}</Link>
              <Link className="btn ghost" href={kHref("/kontakt", l)}>{CONTACT_PAGE.title[l]}</Link>
            </div>
          </Reveal>
          <Reveal as="figure" className="fig sketch" delay={120}>
            <Image src={SKETCH.src} alt={COLLAB.sketch.alt[l]} width={SKETCH.w} height={SKETCH.h} sizes="(max-width: 900px) 100vw, 58vw" quality={85} />
            <figcaption><span>{COLLAB.sketch.caption[l]}</span></figcaption>
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <div className="wrap split rev">
          <Reveal className="photo">
            <Image src={p.src} alt={p.alt[l]} width={p.w} height={p.h} sizes="(max-width: 900px) 100vw, 58vw" quality={85} />
            <span className="small">{p.caption[l]}. {p.by[l]}: <a href={p.url} target="_blank" rel="noopener noreferrer">{p.credit}</a>, {p.license}</span>
          </Reveal>
          <Reveal className="stack">
            <div className="eyebrow">{PLACE.eyebrow[l]}</div>
            <h2>{PLACE.title[l]}</h2>
            <p className="lede">{PLACE.text[l]} <Src id={PLACE.src} /></p>
            <div className="cta-row"><Link className="btn ghost" href={kHref("/kart", l)}>{PLACE.maps[l]}</Link><Link className="btn ghost" href={kHref("/galleri", l)}>{PLACE.photos[l]}</Link></div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
