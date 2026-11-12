import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import Src from "@/components/ui/Source";
import StatusLine from "@/components/ui/StatusLine";
import AboutDeveloper from "@/components/ui/AboutDeveloper";
import JsonLd from "@/components/JsonLd";
import { pageMeta } from "@/lib/meta";
import { OPEN_QUESTIONS, STAGES, workPlan } from "@/lib/content/status";
import { faq, faqJsonLd } from "@/lib/content/faq";
import { FINAL_PHASE, WORK_PLAN, word } from "@/lib/facts";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";

export const generateMetadata = pageMeta("/status", {
  no: { title: "Status og spørsmål", description: "Hvor Knotten står, hva som ikke er bestemt ennå, og svar på det folk spør om: salg, pris, sjøutsikt, reguleringsplan og hvem som står bak." },
  en: { title: "Status and questions", description: "Where Knotten stands, what is not decided yet, and answers to what people ask: sale, price, sea view, the zoning plan and who is behind it." },
});

/** Where the project stands, what is not decided yet, the questions people ask, and who is behind it. */
export default async function Status({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const no = locale === "no";
  const settings = await loadPublicSettings();
  const items = faq(locale, { status: settings.release_note[locale], aboutHref: "#om-utbygger", interestHref: `/${locale}/interesse`, privacyHref: `/${locale}/personvern` });
  const plan = workPlan(locale);
  const lastWeek = FINAL_PHASE.weeks?.[1] ?? 0;
  return (
    <>
      <JsonLd data={faqJsonLd(items, locale)} />
      <Nav locale={locale} />
      <PageHead
        title={no ? "Status og spørsmål." : "Status and questions."}
        lede={no ? "Hvor prosjektet står, hva som ikke er bestemt ennå, og svar på det folk spør om. Der det ikke finnes noe svar ennå, står det her." : "Where the project stands, what is not decided yet, and answers to what people ask. Where there is no answer yet, this page says so."}
      >
        <StatusLine locale={locale} text={settings.release_note[locale]} className="mt-8" onStatusPage />
      </PageHead>

      <section id="status" className="wrap section-tight">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] items-end mb-8">
          <h2 className="display text-[clamp(34px,4.6vw,64px)] max-w-[13ch] rise">{no ? "Hvor prosjektet står." : "Where the project stands."}</h2>
          <p className="lede max-w-[46ch] md:justify-self-end rise rise-late">{no ? "Prosjektet startet før reguleringsplanen, så energi, boliger og marked kan planlegges sammen. Dette er stegene, og hvor det står i dag." : "The project started before the zoning plan, so energy, homes and market can be planned together. These are the steps, and where it stands today."}</p>
        </div>
        <div className="phases rise">
          {STAGES.map((st) => (
            <div key={st.title.no} className={st.now ? "now" : ""}>
              <b>{st.title[locale]}{st.now ? <span className="label !inline ml-2">{no ? "pågår" : "under way"}</span> : null}</b>
              <span>{st.text[locale]}{st.src && <Src id={st.src} locale={locale} />}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="arbeidsplan" className="wrap section-tight grid gap-8 lg:grid-cols-[5fr_7fr] items-start">
        <div className="rise">
          <div className="label mb-3">{no ? "Arbeidsplanen" : "The work plan"}</div>
          <h2 className="display text-[clamp(30px,3.8vw,52px)] max-w-[14ch]">{no ? "Arbeidet med Universitetet i Agder." : "The work with the University of Agder."}</h2>
          <p className="lede mt-5 max-w-[46ch]">
            {no ? `De to fagsporene følger en plan i ${word(WORK_PLAN.length)} faser over ${word(lastWeek)} uker, regnet fra oppstart. Sluttleveransene er en teknisk energirapport, en markeds- og investorrapport og nettsiden.` : `The two tracks follow a plan in ${word(WORK_PLAN.length, "en")} phases over ${word(lastWeek, "en")} weeks, counted from the start. The final deliverables are a technical energy report, a market and investor report and the website.`}
            {" "}<Src id="arbeidsplan" locale={locale} />
          </p>
        </div>
        <ol className="panel divide-y divide-[var(--line)] rise rise-late">
          {plan.map((ph, i) => (
            <li key={ph.name} className="grid grid-cols-[44px_1fr] sm:grid-cols-[44px_150px_1fr] gap-x-4 gap-y-1 px-5 py-4 md:px-6">
              <span className="num text-[22px] text-muted" aria-hidden>{i + 1}</span>
              <span className="font-medium">{ph.name}<span className="block text-[13.5px] font-normal text-muted">{ph.when}</span></span>
              <span className="col-start-2 sm:col-start-3 text-[15px] text-ink-2">{ph.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="ikke-bestemt" className="wrap section-tight">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] items-end mb-8">
          <h2 className="display text-[clamp(34px,4.6vw,64px)] max-w-[13ch] rise">{no ? "Ikke bestemt ennå." : "Not decided yet."}</h2>
          <p className="lede max-w-[46ch] md:justify-self-end rise rise-late">{no ? "Det prosjektet ikke vet ennå, står her i klartekst, ikke som et anslag." : "What the project does not know yet is written here plainly, not as an estimate."}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {OPEN_QUESTIONS.map((q, i) => (
            <div key={q.title.no} className="panel p-6 md:p-7 rise" style={{ animationDelay: `${i * 50}ms` }}>
              <h3 className="display text-[26px]">{q.title[locale]}</h3>
              <p className="mt-3 text-[15.5px] text-ink-2 max-w-[56ch]">{q.text[locale]}{q.src && <Src id={q.src} locale={locale} />}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="sporsmal" className="wrap section-tight grid gap-8 lg:grid-cols-[5fr_7fr] items-start">
        <div className="rise lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
          <div className="label mb-3">{no ? "Spørsmål og svar" : "Questions and answers"}</div>
          <h2 className="display text-[clamp(30px,3.8vw,52px)] max-w-[12ch]">{no ? "Det folk spør om." : "What people ask."}</h2>
          <p className="lede mt-5 max-w-[44ch]">{no ? "Svarene bygger bare på det prosjektet har dokumentert. Finner du ikke svaret, spør prosjekteier." : "The answers rest only on what the project has documented. If your answer is not here, ask the project owner."}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link className="btn btn-amber no-underline" href={`/${locale}/interesse`}>{no ? "Meld interesse" : "Register interest"}</Link>
            <Link className="btn btn-ghost no-underline" href={`/${locale}/kontakt`}>{no ? "Kontakt" : "Contact"}</Link>
          </div>
        </div>
        <div className="border-t line">
          {items.map((it, i) => (
            <details key={it.id} id={`sporsmal-${it.id}`} open={i === 0} className="group border-b line">
              <summary className="cursor-pointer list-none flex items-baseline justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                <h3 className="display text-[clamp(21px,2vw,27px)] leading-tight">{it.q}</h3>
                <span aria-hidden className="text-fjord text-[26px] leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="pb-6 grid gap-3 max-w-[64ch] text-[16px] text-ink-2">
                <p>{it.a}</p>
                {it.link && <p><Link href={it.link.href} className="text-fjord underline underline-offset-4">{it.link.label}</Link></p>}
              </div>
            </details>
          ))}
        </div>
      </section>

      <AboutDeveloper locale={locale} company={settings.company} orgDisplay={formatOrgNumber(settings.company.org_number)} />
      <div className="pb-10" />
    </>
  );
}
