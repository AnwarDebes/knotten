import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale, t } from "@/lib/i18n";
import { loadPlots } from "@/lib/data";
import { DIRECTION, DOCS, EED, FACT, assumption, dateLong, fmt, word } from "@/lib/facts";
import Nav from "@/components/ui/Nav";
import Ambient from "@/components/ui/Ambient";
import Film from "@/components/ui/Film";
import Stage from "@/components/Stage";
import ProofSlider from "@/components/ui/ProofSlider";
import Passport from "@/components/ui/Passport";
import Src from "@/components/ui/Source";
import TerrainCut from "@/components/ui/TerrainCut";
import MapJourney from "@/components/ui/MapJourney";
import { Figure } from "@/components/ui/Provenance";
import { Words } from "@/components/ui/Motion";
import { SITE, pageMeta } from "@/lib/meta";
import StatusLine from "@/components/ui/StatusLine";
import AboutDeveloper from "@/components/ui/AboutDeveloper";
import RightNow from "@/components/ui/home/RightNow";
import { latestNews } from "@/components/ui/home/news";
import JsonLd from "@/components/JsonLd";
import { organizationJsonLd } from "@/lib/content/jsonld";
import { HOME_PHASES, OWNER_PHOTOS, PHOTOS_TEXT, WINTER_SUN_TEXT, energyKeys, homeFacts, measuresByVerdict, measuresLine, mostWinterSun } from "@/lib/content/home";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";

export const generateMetadata = pageMeta("", {
  no: { description: `Rundt ${FACT.plots} energivennlige boliger på en skogkledd knaus over Audna, nær Sniksfjorden i Lindesnes. Terrenget er målt, solen er ekte. Stå på tomten før den finnes.` },
  en: { description: `About ${FACT.plots} energy-friendly homes on a wooded knoll above the Audna, near Sniksfjorden in Lindesnes. The terrain is measured, the sun is real. Stand on the plot before it exists.` },
});

/** The verdict chips: pine for yes, fjord blue for maybe, plain for no (amber stays for the sun and the main action). */
const CHIP = { yes: "chip chip-pine", maybe: "chip chip-fjord", no: "chip text-ink-2" } as const;

/**
 * The Moderne front page, in Norwegian at /no and in English at /en: the 3D journey as the hero, the place right now,
 * the owner's photos and the photo against the model, the maps, the energy figures, the plots with the most winter sun,
 * the buildings that stand today, where the project stands, the news and who is behind it. The same content as the
 * Klassisk front page (src/lib/content/home.ts), in the Moderne look.
 */
export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  // /tomten or any other one-word address lands here; the layout's own check runs alongside, not before
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const d = t(locale);
  const no = locale === "no";
  const [{ plots }, settings, news] = await Promise.all([loadPlots(), loadPublicSettings(), latestNews(2)]);
  const withSea = plots.filter((p) => p.view.water_visible_deg > 0).length;
  const best = mostWinterSun(plots);
  const lang = no ? "no" : "en";
  const nb = (v: number) => fmt(v, lang);
  const p = (path: string) => `/${locale}${path}`;
  const status = settings.release_note[locale];

  return (
    <>
      <JsonLd data={organizationJsonLd(SITE, settings.company)} />
      <Ambient />
      <Nav locale={locale} />

      {/* 1. the journey is the front page: the headline with where sales stand under it, the lede beside it */}
      <section id="modell" className="wrap pt-3 md:pt-6">
        <div className="grid gap-x-12 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,25rem)] lg:items-end mb-5 md:mb-7">
          <div className="grid gap-5 md:gap-6 content-start">
            <Words as="h1" className="words-now display text-[clamp(40px,5.6vw,88px)] max-w-[19ch]" text={no ? "Planlagt som Norges mest energivennlige boligfelt." : "Planned as Norway's most energy-friendly housing development."} />
            {status.trim()
              ? <StatusLine locale={locale} text={status} className="rise-in rise-in-2" />
              : <div className="rise-in rise-in-2"><Link className="btn btn-amber" href={p("/interesse")}>{d.cta.register}</Link></div>}
          </div>
          <p className="lede max-w-[40ch] rise-in rise-in-2 lg:pb-2">
            {no
              ? `Rundt ${FACT.plots} boliger på Knotten over Sniksfjorden i Lindesnes, i modellen lagt i ${word(FACT.rows)} rekker over sørhellingen og på knausen. Ønsket er sjøutsikt fra alle tomtene, men det er ikke sikkert at det går fra alle. Reisen under går fra fjorden og helt inn i stua.`
              : `About ${FACT.plots} homes on Knotten above Sniksfjorden in Lindesnes, laid out in the model in ${word(FACT.rows, "en")} rows across the south face and on the knoll. The aim is a sea view from every plot, but it is not certain every plot will get one. The journey below runs from the fjord all the way into the living room.`}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] items-stretch">
          <div className="rise-in rise-in-2"><Stage plots={plots} locale={locale} hero /></div>
          <aside className="grid gap-4 lg:grid-rows-[auto_1fr] rise-in rise-in-3">
            <div>
              <Film locale={locale} />
              <div className="marks !pt-2.5"><span /><em className="not-italic">{no ? "Flyturen, rendret fra samme modell" : "The fly-in, rendered from the same model"}</em><span /></div>
            </div>
            <div className="paper p-5 flex flex-col gap-5">
              {[[`${FACT.plots}`, no ? `tomter i ${word(FACT.rows)} rekker; i modellen har ${withSea} av ${plots.length} sjøutsikt (beregnet)` : `plots in ${word(FACT.rows, "en")} rows; in the model ${withSea} of ${plots.length} have a sea view (computed)`], [`${EED.boreholes}`, no ? `energibrønner, ca. ${Math.round(EED.depth_m)} m dype, simulert over ${EED.years} år` : `boreholes, about ${Math.round(EED.depth_m)} m deep, simulated over ${EED.years} years`], [nb(FACT.lokkeheia_m), no ? "meter over havet på Løkkeheia rett bak feltet" : "metres above sea level on Løkkeheia just behind the field"]].map(([n, s]) => (
                <div key={s} className="grid grid-cols-[76px_1fr] items-baseline gap-3">
                  <div className="num text-[34px]">{n}</div>
                  <div className="text-[14px] leading-snug">{s}</div>
                </div>
              ))}
              <Link className="btn btn-amber btn-sm self-start mt-auto" href={p("/interesse")}>{d.cta.register}</Link>
            </div>
          </aside>
        </div>
        <div className="marks"><span /><span /><em className="not-italic">
          <span className="pointer-coarse:hidden">{no ? "Reisen starter av seg selv. Klikk i modellen for å styre den, Escape gir siden tilbake." : "The journey starts on its own. Click the model to take control, Escape hands the page back."}</span>
          <span className="hidden pointer-coarse:inline">{no ? "Trykk «Start reisen». Trykk i modellen for å styre den, og utenfor for å bla videre." : "Tap «Start the journey». Tap the model to take control, and outside it to scroll on."}</span>
        </em><span /><span /></div>
      </section>

      {/* 2. the facts, each with its source */}
      <section className="wrap mt-8 md:mt-12">
        <div className="facts rise">
          {homeFacts(locale).map((f) => (
            <div key={f.src} className="fact"><b>{f.big}</b><span>{f.text} <Src id={f.src} locale={locale} /></span></div>
          ))}
        </div>
      </section>

      {/* 3. the place, and the place right now */}
      <section className="wrap section-tight grid gap-8 lg:grid-cols-[5fr_7fr] items-center">
        <div className="rise">
          <div className="label mb-3">{no ? "Stedet" : "The place"}</div>
          <h2 className="display text-[clamp(34px,4.6vw,64px)] max-w-[12ch]">{no ? "Fra elva og opp på Knotten." : "From the river up onto Knotten."}</h2>
          <p className="lede mt-5 max-w-[46ch]">
            {no
              ? "Feltet ligger på en knaus rett vest for Rødbergsveien, nær der Audna renner ut i Sniksfjorden ved Snig. Nederst, mellom veien og elva, er det flatt. Så stiger terrenget bratt, og fra rekkene oppover hellingen går siktlinjen sørover, ut fjorden og til åpent hav."
              : "The field sits on a knoll just west of Rødbergsveien, near where the Audna flows into Sniksfjorden at Snig. At the bottom, between the road and the river, it is flat. Then the ground rises steeply, and from the rows up the slope the sight line runs south, out the fjord and to open sea."}
          </p>
          <p className="mt-4 text-[15px] text-ink-2 max-w-[48ch]">
            {no ? `Terrengprofilen er tegnet i Norgeskart fra vannet ved Spangereidveien til Knotten: ${nb(FACT.profile_m)} meter, fra 0 til ${FACT.knotten_m} meter over havet.` : `The terrain profile is drawn in Norgeskart from the water by Spangereidveien to Knotten: ${nb(FACT.profile_m)} metres, from 0 to ${FACT.knotten_m} metres above the sea.`} <Src id="profil" locale={locale} />
          </p>
        </div>
        <div className="rise rise-late"><TerrainCut locale={locale} /></div>
        <div className="lg:col-span-2 rise"><RightNow locale={locale} /></div>
      </section>

      {/* 4. the place, photographed */}
      <section className="section-tight">
        <div className="wrap grid gap-4 md:grid-cols-[1fr_1fr] items-end mb-6">
          <h2 className="display text-[clamp(36px,5.4vw,80px)] max-w-[12ch] rise">{no ? "Slik ser det ut i dag." : "This is how it looks today."}</h2>
          <p className="lede max-w-[46ch] md:justify-self-end rise rise-late">{PHOTOS_TEXT[locale]} <Src id="foto" locale={locale} /></p>
        </div>
        <div className="wrap">
          <div className="grid gap-4 md:grid-cols-3">
            {OWNER_PHOTOS.map((ph) => (
              <figure key={ph.src} className="frame">
                {/* eslint-disable-next-line @next/next/no-img-element -- the owner's photos, already sized for the web */}
                <img src={ph.src} alt={ph.caption[locale]} width={ph.w} height={ph.h} className="w-full aspect-[4/3] object-cover" style={ph.pos ? { objectPosition: ph.pos } : undefined} loading="lazy" decoding="async" />
                <figcaption className="provenance px-4 py-3">{ph.caption[locale]}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-5"><Link className="btn btn-ghost" href={p("/omradet#bilder")}>{no ? "Flere bilder" : "More photos"}</Link></div>
        </div>
      </section>

      {/* 5. measured, not drawn: the photograph against the model from the same spot */}
      <section className="wrap section-tight grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div className="rise">
          <h2 className="display text-[clamp(36px,5vw,72px)] max-w-[10ch]">{no ? "Målt, ikke tegnet." : "Measured, not drawn."}</h2>
          <p className="lede mt-5 max-w-[44ch]">
            {no
              ? "Terrenget er Kartverkets laserskanning på én meter. Trærne er funnet i det samme datasettet, som en beregning. Eiendomsgrensen er hentet fra Matrikkelen. Solen går sin ekte bane over den ekte åsen, og hver tomt i modellens rekker er sjekket mot vannet med nabohusene stående."
              : "The terrain is Kartverket's one-metre laser scan. The trees are found in the same dataset, as an estimate. The parcel boundary comes from the cadastre. The sun follows its real path over the real ridge, and every plot in the model's rows is checked against the water with the neighbouring houses standing."}
            {" "}<Src id="modell" locale={locale} />
          </p>
          <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2">
            <Figure a={assumption("trees_measured")} locale={locale} size="md" />
            <Figure a={assumption("sea_corridor_deg")} locale={locale} size="md" />
            <Figure a={assumption("open_sea_plots")} locale={locale} size="md" />
            <Figure a={assumption("trees_cleared")} locale={locale} size="md" />
          </div>
        </div>
        <div className="rise rise-late grid gap-3 content-start">
          <ProofSlider photo="/assets/incoming/web/view_from_grillbu.webp" model="/renders/web/grillbu_photo_match.webp" labels={[no ? "Fotografi" : "Photograph", no ? "Modell" : "Model"]} />
          <p className="provenance max-w-[60ch]">
            {no
              ? "Utsiktsbildet er tatt ved naboens grillbu. Modellkameraet står der bildet er tatt, funnet ved å passe horisonten og gårdene i bildet mot Kartverkets terrengmodell: 1,9 meter over bakken, mot 176 grader. Dra i skillet."
              : "The view photo was taken by the neighbour's grill hut. The model camera stands where the photo was taken, found by fitting the photo's skyline and farm buildings to Kartverket's terrain model: 1.9 metres above the ground, towards 176 degrees. Drag the divider."}
          </p>
        </div>
      </section>

      {/* 6. the maps behind the plan */}
      <section className="wrap section-tight">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] items-end mb-8">
          <h2 className="display text-[clamp(34px,4.6vw,64px)] max-w-[12ch] rise">{no ? "Kartene bak planen." : "The maps behind the plan."}</h2>
          <p className="lede max-w-[46ch] md:justify-self-end rise rise-late">
            {no ? "Prosjekteiers egne kart, fra siktlinjen ut til havet og helt ned til den første skissen av boligrekkene. Bla nedover, så bytter kartet." : "The project owner's own maps, from the sight line out to the sea down to the first sketch of the rows. Scroll, and the map changes."}
          </p>
        </div>
        <MapJourney locale={locale} />
      </section>

      {/* 7. the energy concept, as it stands */}
      <section className="wrap section-tight">
        <div className="panel overflow-hidden">
          <div className="grid lg:grid-cols-[1.1fr_1fr]">
            <div className="p-7 md:p-12 grid content-start gap-7">
              <div>
                <div className="label mb-3">{no ? "Energi og teknologi" : "Energy and technology"}</div>
                <h2 className="display text-[clamp(34px,4.6vw,64px)] max-w-[12ch]">{no ? "Et felt som skal klare seg mest mulig selv." : "A field built to look after itself as far as possible."}</h2>
                <p className="lede mt-5 max-w-[50ch]">
                  {no
                    ? "Energikonseptet utvikles av energisporet, studenter fra Universitetet i Agder i et internship. Grunnlaget finnes allerede: et energiregnskap for hele feltet, en brønnpark simulert i EED og en vurdering av tiltakene. Tallene er foreløpige og står med kilde."
                    : "The energy concept is developed by the energy track, students from the University of Agder on an internship. The basis already exists: an energy budget for the whole field, a borehole field simulated in EED and an assessment of the measures. The figures are provisional and carry their source."}
                  {" "}<Src id="retning" locale={locale} />
                </p>
              </div>
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 max-w-[560px]">
                {energyKeys(locale).map((e) => (
                  <div key={e.key}>
                    <div className="num text-[38px]">{e.value}<span className="text-[14px] font-body font-normal opacity-70 ml-0.5"> {e.unit}</span></div>
                    <div className="mt-1.5 text-[15px]">{e.label}{e.src && <> <Src id={e.src} locale={locale} /></>}</div>
                    <div className="provenance">{e.note}</div>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 text-[14px]">
                <p className="text-ink-2">{measuresLine(locale)}. <Src id="tiltak" locale={locale} /></p>
                {measuresByVerdict().map((g) => (
                  <div key={g.verdict} className="flex flex-wrap items-center gap-1.5"><span className="text-muted mr-1 w-[92px]">{g.label[locale]}</span>{g.items.map((m) => <span key={m.id} className={CHIP[g.verdict]}>{m.name[locale]}</span>)}</div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="btn btn-amber" href={p("/energi")}>{no ? "Hele energikonseptet" : "The whole energy concept"}</Link>
                <Link className="btn btn-ghost" href={p("/portal/energy")}>{no ? "Energidashbordet" : "The energy dashboard"}</Link>
              </div>
            </div>
            <div className="grid content-between gap-6 p-7 md:p-12 bg-bone/4 border-t lg:border-t-0 lg:border-l line">
              <figure className="paper p-3 md:p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- the energy track's chart, shown as it is */}
                <img src="/img/eed-temperatur.png" width={2341} height={1005} alt={no ? `Væsketemperatur i brønnparken over ${EED.years} år` : `Fluid temperature in the borehole field over ${EED.years} years`} className="w-full rounded-[8px]" loading="lazy" />
                <figcaption className="provenance mt-2.5">{no ? `Brønnparken simulert i Earth Energy Designer: ${EED.boreholes} brønner, ${EED.grid}, åpent rektangel, ${EED.spacing_m} m avstand. Væsketemperaturen stabiliserer seg over ${EED.years} år; siste år ligger den mellom ${nb(EED.fluid_min_c)} og ${nb(EED.fluid_max_c)} °C. Energisporet vurderer begge deler som bra.` : `The borehole field simulated in Earth Energy Designer: ${EED.boreholes} boreholes, ${EED.config}, ${EED.spacing_m} m apart. The fluid temperature settles over ${EED.years} years; in the last year it stays between ${nb(EED.fluid_min_c)} and ${nb(EED.fluid_max_c)} °C. The energy track judges both to be good.`}</figcaption>
              </figure>
              <div>
                <div className="text-[14px] text-muted mb-3">{no ? `Retningen fra prosjekteier, ${dateLong(DOCS.direction.date)}` : `The direction from the project owner, ${dateLong(DOCS.direction.date, "en")}`}</div>
                <ul className="grid gap-2 text-[14.5px] text-bone-2 max-w-[52ch]">
                  {DIRECTION[locale].slice(0, 5).map((s) => <li key={s} className="grid grid-cols-[10px_1fr] gap-3"><span className="w-1.5 h-1.5 rounded-full bg-amber mt-2" />{s}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. passports */}
      <section className="wrap section-tight">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] items-end">
          <div className="rise">
            <h2 className="display text-[clamp(36px,5vw,72px)] max-w-[12ch]">{no ? "Mest vintersol." : "Most winter sun."}</h2>
            <p className="lede mt-5 max-w-[50ch]">{WINTER_SUN_TEXT[locale]}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn" href={p("/tomter")}>{no ? `Alle ${plots.length} tomter` : `All ${plots.length} plots`}</Link>
            <Link className="btn btn-ghost" href={p("/konfigurator")}>{no ? "Sett sammen huset" : "Configure your house"}</Link>
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {best.map((plot, i) => <div key={plot.id} className="rise" style={{ animationDelay: `${i * 60}ms` }}><Passport plot={plot} locale={locale} /></div>)}
        </div>
      </section>

      {/* 9. what is there today, and what is planned */}
      <section className="wrap section-tight grid gap-8 lg:grid-cols-[1fr_1fr] items-center">
        <figure className="rise frame">
          {/* eslint-disable-next-line @next/next/no-img-element -- the owner's cadastral map, shown as it is */}
          <img src="/assets/incoming/web/knotten_map.webp" alt={no ? "Knotten på eiendomskartet med de planlagte byggene i grønt" : "Knotten on the cadastral map with the planned buildings in green"} className="w-full" loading="lazy" />
          <figcaption className="provenance px-4 py-3">{no ? "Knotten på eiendomskartet. Kontorbygget og bolighuset ved Rødbergsveien er der i dag; de to grønne byggene er planlagt." : "Knotten on the cadastral map. The office building and the house by Rødbergsveien are there today; the two green buildings are planned."}</figcaption>
        </figure>
        <div className="rise rise-late">
          <div className="label mb-3">{no ? "Eksisterende bygg" : "Existing buildings"}</div>
          <h2 className="display text-[clamp(34px,4.6vw,64px)] max-w-[12ch]">{no ? "Bygg som allerede bruker strøm." : "Buildings that already use power."}</h2>
          <p className="lede mt-5 max-w-[46ch]">
            {no
              ? `Kontorbygget med ${FACT.offices_now} kontorer i dag og ${FACT.offices_after} når utvidelsen står, og bolighuset nedenfor, er en del av energibildet fra dag én. De kan måles, og målte data vises når de er hentet inn. Et tilbygg til kontoret og et lager- og verkstedbygg bak bolighuset er planlagt, og ligger i modellen.`
              : `The office building with ${FACT.offices_now} offices today and ${FACT.offices_after} when the extension stands, and the house below it, are part of the energy picture from day one. They can be measured, and measured data is shown once collected. An extension to the office and a warehouse and workshop behind the house are planned, and sit in the model.`}
            {" "}<Src id="kontor" locale={locale} />
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link className="btn btn-ghost" href={p("/energi/eksisterende")}>{no ? "Eksisterende bygg" : "Existing buildings"}</Link>
            <Link className="btn btn-ghost" href={p("/omradet")}>{no ? "Området" : "The area"}</Link>
          </div>
        </div>
      </section>

      {/* 10. where the project stands */}
      <section className="wrap section-tight">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] items-end mb-8">
          <h2 className="display text-[clamp(34px,4.6vw,64px)] max-w-[12ch] rise">{no ? "Hvor prosjektet står." : "Where the project stands."}</h2>
          <p className="lede max-w-[46ch] md:justify-self-end rise rise-late">
            {no
              ? "Prosjektet starter før reguleringsplanen. Her er hvor det står, og hva som må på plass før neste steg. Alt på denne siden oppdateres når planen og rapportene kommer."
              : "The project starts before the zoning plan. Here is where it stands, and what has to be in place before the next step. Everything on this page is updated when the plan and the reports arrive."}
          </p>
        </div>
        <div className="phases rise">
          {HOME_PHASES.map((ph) => <div key={ph.title.no} className={ph.now ? "now" : ""}><b>{ph.title[locale]}</b><span>{ph.text[locale]}</span></div>)}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link className="btn" href={p("/status")}>{no ? "Status og spørsmål" : "Status and questions"}</Link>
          <Link className="btn btn-ghost" href={p("/prosjektet")}>{no ? "Om prosjektet" : "About the project"}</Link>
          <Link className="btn btn-ghost" href={p("/investor")}>{no ? "Investorer og samarbeid" : "Investors and partners"}</Link>
          <Link className="btn btn-ghost" href={p("/dokumenter")}>{no ? "Dokumentbank" : "Document bank"}</Link>
        </div>
      </section>

      {/* 11. the latest news */}
      {news.length > 0 && (
        <section className="wrap section-tight">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end mb-8">
            <div className="rise">
              <div className="label mb-3">{no ? "Nyheter" : "News"}</div>
              <h2 className="display text-[clamp(34px,4.6vw,64px)] max-w-[14ch]">{no ? "Siste nytt fra prosjektet." : "Latest from the project."}</h2>
            </div>
            <Link className="btn btn-ghost rise rise-late" href={p("/nyheter")}>{no ? "Alle nyheter" : "All news"}</Link>
          </div>
          <div className="grid gap-8 md:gap-10 md:grid-cols-2">
            {news.map((n) => (
              <article key={n.id} className="rise border-t-2 border-ink pt-5">
                <time dateTime={n.date} className="provenance">{dateLong(n.date, lang)}</time>
                <h3 className="display text-[clamp(24px,2.4vw,30px)] leading-tight mt-2">{n.title[locale]}</h3>
                <p className="mt-3 text-ink-2 max-w-[62ch]">{n.text[locale]}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* who is behind it, and the team */}
      <AboutDeveloper
        locale={locale}
        company={settings.company}
        orgDisplay={formatOrgNumber(settings.company.org_number)}
        actions={<Link className="btn btn-ghost" href={p("/team")}>{no ? "Teamet" : "The team"}</Link>}
      />

      {/* 12. invitation */}
      <section className="wrap pb-6">
        <div className="paper p-8 md:p-14 grid gap-8 md:grid-cols-[1fr_auto] items-center">
          <div className="rise">
            <h2 className="display text-[clamp(32px,4.6vw,64px)] max-w-[14ch]">{no ? "Vil du ha beskjed når tomtene slippes?" : "Want to know when the plots are released?"}</h2>
            <p className="lede mt-4 max-w-[44ch]">{no ? "Meld interesse. Du velger selv hva vi får bruke kontakten til." : "Register interest. You choose what we may use your contact for."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-amber" href={p("/interesse")}>{d.cta.register}</Link>
            <Link className="btn btn-ghost" href={p("/konfigurator")}>{no ? "Sett sammen huset" : "Configure your house"}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
