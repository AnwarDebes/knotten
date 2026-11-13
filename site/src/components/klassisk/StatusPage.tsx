import Link from "next/link";
import PageHead from "./PageHead";
import Reveal from "./Reveal";
import { Src } from "./Source";
import StatusLine from "./StatusLine";
import AboutDeveloper from "./AboutDeveloper";
import JsonLd from "@/components/JsonLd";
import { OPEN_QUESTIONS, STAGES, workPlan } from "@/lib/content/status";
import { faq, faqJsonLd } from "@/lib/content/faq";
import { FINAL_PHASE, WORK_PLAN, word, type Lang } from "@/lib/facts";
import { kHref } from "@/lib/klassisk/locale";
import type { PublicSettings } from "@/lib/server/siteSettings";

/**
 * "Status og spørsmål" in the Klassisk look: where the project stands, what is not decided yet, the questions people
 * ask, and who is behind it. Every text comes from src/lib/content (status, faq, company) in both languages.
 */
export default function StatusPage({ locale, settings, orgDisplay }: { locale: Lang; settings: PublicSettings; orgDisplay: string }) {
  const no = locale === "no";
  const kilde = no ? "Kilde" : "Source";
  const items = faq(locale, { status: settings.release_note[locale], aboutHref: "#om-utbygger", interestHref: kHref("/kontakt", locale), privacyHref: kHref("/personvern", locale) });
  const plan = workPlan(locale);
  const lastWeek = FINAL_PHASE.weeks?.[1] ?? 0;
  return (
    <>
      <JsonLd data={faqJsonLd(items, locale)} />
      <PageHead title={no ? "Status og spørsmål" : "Status and questions"} crumb={no ? "Status og spørsmål" : "Status and questions"} locale={locale}>
        <p>{no ? "Hvor prosjektet står, hva som ikke er bestemt ennå, og svar på det folk spør om. Der det ikke finnes noe svar ennå, står det her." : "Where the project stands, what is not decided yet, and answers to what people ask. Where there is no answer yet, this page says so."}</p>
      </PageHead>

      <section className="sec" id="status">
        <div className="wrap">
          <StatusLine locale={locale} text={settings.release_note[locale]} onStatusPage />
          <div className="eyebrow" style={{ marginTop: 28 }}>{no ? "Hvor prosjektet står" : "Where the project stands"}</div>
          <h2 style={{ maxWidth: "22ch" }}>{no ? "Prosjektet startet før reguleringsplanen" : "The project started before the zoning plan"}</h2>
          <Reveal className="phases" stagger>
            {STAGES.map((st) => (
              <div key={st.title.no} className={st.now ? "now" : ""}>
                <b>{st.title[locale]}{st.now ? (no ? ", pågår" : ", under way") : ""}</b>
                <span>{st.text[locale]}{st.src && <Src id={st.src} label={kilde} />}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="sec alt" id="arbeidsplan">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{no ? "Arbeidsplanen" : "The work plan"}</div>
            <h2>{no ? "Arbeidet med Universitetet i Agder" : "The work with the University of Agder"}</h2>
            <p className="lede">{no ? `De to fagsporene følger en plan i ${word(WORK_PLAN.length)} faser over ${word(lastWeek)} uker, regnet fra oppstart. Sluttleveransene er en teknisk energirapport, en markeds- og investorrapport og nettsiden.` : `The two tracks follow a plan in ${word(WORK_PLAN.length, "en")} phases over ${word(lastWeek, "en")} weeks, counted from the start. The final deliverables are a technical energy report, a market and investor report and the website.`} <Src id="arbeidsplan" label={kilde} /></p>
          </Reveal>
          <Reveal className="timeline" stagger>
            {plan.map((ph) => (
              <div key={ph.name}>
                <span className="tw">{ph.when}</span>
                <b>{ph.name}</b>
                <span>{ph.text}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="sec" id="ikke-bestemt">
        <div className="wrap">
          <div className="eyebrow">{no ? "Ikke bestemt ennå" : "Not decided yet"}</div>
          <h2 style={{ maxWidth: "22ch" }}>{no ? "Det vi ikke vet ennå, sier vi" : "What we do not know yet, we say"}</h2>
          <Reveal className="openq" stagger>
            {OPEN_QUESTIONS.map((q) => (
              <div key={q.title.no}>
                <h3>{q.title[locale]}</h3>
                <p>{q.text[locale]}{q.src && <Src id={q.src} label={kilde} />}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="sec alt" id="sporsmal">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{no ? "Spørsmål og svar" : "Questions and answers"}</div>
            <h2>{no ? "Det folk spør om" : "What people ask"}</h2>
            <p className="lede">{no ? "Svarene bygger bare på det prosjektet har dokumentert. Finner du ikke svaret, spør prosjekteier." : "The answers rest only on what the project has documented. If your answer is not here, ask the project owner."}</p>
            <div className="cta-row"><Link className="btn" href={kHref("/kontakt", locale)}>{no ? "Meld interesse" : "Register interest"}</Link></div>
          </Reveal>
          <div className="faq">
            {items.map((it, i) => (
              <details key={it.id} id={`sporsmal-${it.id}`} open={i === 0}>
                <summary><h3>{it.q}</h3></summary>
                <div className="ans">
                  <p>{it.a}</p>
                  {it.link && <p><Link href={it.link.href}>{it.link.label}</Link></p>}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <AboutDeveloper locale={locale} company={settings.company} orgDisplay={orgDisplay} alt={false} />
    </>
  );
}
