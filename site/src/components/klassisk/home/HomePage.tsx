import Image from "next/image";
import Link from "next/link";
import { Src } from "@/components/klassisk/Source";
import TerrainCut from "@/components/klassisk/TerrainCut";
import PlanPreview from "@/components/klassisk/PlanPreview";
import Hero from "@/components/klassisk/Hero";
import MapJourney from "@/components/klassisk/MapJourney";
import Reveal from "@/components/klassisk/Reveal";
import StatusLine from "@/components/klassisk/StatusLine";
import AboutDeveloper from "@/components/klassisk/AboutDeveloper";
import Passport from "@/components/ui/Passport";
import JsonLd from "@/components/JsonLd";
import { latestNews } from "@/components/ui/home/news";
import Journey from "./Journey";
import RightNow from "./RightNow";
import { loadPlots } from "@/lib/data";
import { FACT, dateLong, fmt, word, type Lang } from "@/lib/facts";
import { kHref } from "@/lib/klassisk/locale";
import { SITE } from "@/lib/meta";
import { organizationJsonLd } from "@/lib/content/jsonld";
import { HOME_PHASES, JOURNEY_TEXT, OWNER_PHOTOS, PHOTOS_TEXT, WINTER_SUN_TEXT, energyKeys, measuresByVerdict, measuresLine, mostWinterSun } from "@/lib/content/home";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";

/**
 * The Klassisk front page, in Norwegian at / and in English at /english: the photo hero, then the journey through the
 * 3D model, the place right now, the owner's photos, the maps, the plots with the most winter sun, the energy figures,
 * the buildings that stand today, where the project stands, the news and who is behind it. The same content as the
 * Moderne front page (src/lib/content/home.ts), in the Klassisk look. Static: the settings and the news come from
 * Next's data cache, the live figures and the 3D model load in the browser.
 */
export default async function HomePage({ locale }: { locale: Lang }) {
  const no = locale === "no";
  const k = (path: string) => kHref(path, locale);
  const source = no ? "Kilde" : "Source";
  const [{ plots }, { release_note, company }, news] = await Promise.all([loadPlots(), loadPublicSettings(), latestNews(2)]);
  const best = mostWinterSun(plots);
  const keys = energyKeys(locale);
  return (
    <>
      <JsonLd data={organizationJsonLd(SITE, company)} />
      <Hero locale={locale} status={<StatusLine locale={locale} text={release_note[locale]} className="rise d2" />} />

      <section className="sec alt" id="reisen" data-journey="reisen">
        <div className="wrap">
          <Reveal className="kj-head">
            <div className="stack">
              <div className="eyebrow">{no ? "Fra fjorden til stua" : "From the fjord to the living room"}</div>
              <h2>{no ? "Stå på tomten før den finnes" : "Stand on the plot before it exists"}</h2>
            </div>
            <p className="lede">{JOURNEY_TEXT[locale]} <Src id="modell" label={source} /></p>
          </Reveal>
          <Journey locale={locale} />
          <p className="small kj-hint">
            <span className="kj-fine">{no ? "Trykk «Start reisen», eller utforsk modellen selv. Klikk i modellen for å styre den; Escape gir siden tilbake." : "Press «Start the journey», or explore the model yourself. Click the model to take control; Escape hands the page back."}</span>
            <span className="kj-coarse">{no ? "Trykk «Start reisen». Trykk i modellen for å styre den, og utenfor for å bla videre." : "Tap «Start the journey». Tap the model to take control, and outside it to scroll on."}</span>
          </p>
        </div>
      </section>

      <section className="sec kcv" id="stedet" data-journey="stedet">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{no ? "Stedet" : "The place"}</div>
            <h2>{no ? "Fra elva og opp på Knotten" : "From the river up onto Knotten"}</h2>
            <p className="lede">
              {no
                ? "Feltet ligger på en knaus rett vest for Rødbergsveien, noen få kilometer sørvest for Vigeland. Nederst, mellom veien og elva, er det flatt. Så stiger terrenget bratt, og fra rekkene oppover skråningen går siktlinjen sørover, ut Sniksfjorden og til åpent hav."
                : "The field sits on a knoll just west of Rødbergsveien, a few kilometres south-west of Vigeland. At the bottom, between the road and the river, it is flat. Then the ground rises steeply, and from the rows up the slope the sight line runs south, out Sniksfjorden and to open sea."}
            </p>
            <p className="measure">
              {no
                ? `Audna er ${FACT.audna_km} kilometer lang og renner ut i fjorden ved Snig. Fjorden er om lag ${word(FACT.fjord_km)} kilometer lang, og bak den ligger havet.`
                : `The Audna is ${FACT.audna_km} kilometres long and flows into the fjord at Snig. The fjord is about ${word(FACT.fjord_km, "en")} kilometres long, and beyond it lies the sea.`} <Src id="audna" label={source} />
            </p>
            <p className="measure small">
              {no
                ? `Terrengprofilen er tegnet i Norgeskart fra vannet ved Spangereidveien til Knotten: ${fmt(FACT.profile_m)} meter, fra 0 til ${FACT.knotten_m} meter over havet.`
                : `The terrain profile is drawn in Norgeskart from the water by Spangereidveien to Knotten: ${fmt(FACT.profile_m, "en")} metres, from 0 to ${FACT.knotten_m} metres above the sea.`} <Src id="profil" label={source} />
            </p>
          </Reveal>
          <Reveal delay={120}><TerrainCut locale={locale} /></Reveal>
        </div>
        <div className="wrap"><RightNow locale={locale} /></div>
      </section>

      <section className="sec alt kcv" id="bilder" data-journey="bilder">
        <div className="wrap">
          <div className="kj-head">
            <div className="stack">
              <div className="eyebrow">{no ? "Bilder" : "Photos"}</div>
              <h2>{no ? "Slik ser det ut i dag" : "This is how it looks today"}</h2>
            </div>
            <p className="lede">{PHOTOS_TEXT[locale]} <Src id="foto" label={source} /></p>
          </div>
          <Reveal className="gallery kphotos" stagger>
            {OWNER_PHOTOS.map((p) => (
              <figure key={p.src} className="g4">
                <Image src={p.src} alt={p.caption[locale]} width={p.w} height={p.h} sizes="(max-width: 820px) 100vw, 410px" quality={85} style={p.pos ? { objectPosition: p.pos } : undefined} />
                <figcaption>{p.caption[locale]}</figcaption>
              </figure>
            ))}
          </Reveal>
          <div className="cta-row"><Link className="btn ghost" href={k("/galleri")}>{no ? "Flere bilder" : "More photos"}</Link></div>
        </div>
      </section>

      <section className="sec kcv" id="kart" data-journey="kart">
        <div className="wrap">
          <div className="eyebrow">{no ? "Fra kysten til tomten" : "From the coast to the plot"}</div>
          <h2 style={{ maxWidth: "20ch" }}>{no ? "Kartene bak planen, ett steg om gangen" : "The maps behind the plan, one step at a time"}</h2>
          <p className="lede mt">
            {no
              ? "Prosjekteiers egne kart og et terrengkart laget for nettsiden, fra siktlinjen ut til havet og helt ned til den første skissen av boligrekkene. Bla nedover, så zoomer kartet inn."
              : "The project owner's own maps and a terrain map made for the website, from the sight line out to the sea down to the first sketch of the rows of homes. Scroll down, and the map zooms in."}
          </p>
          <MapJourney locale={locale} />
        </div>
      </section>

      <section className="sec alt kcv" id="tomter" data-journey="tomter">
        <div className="wrap split rev">
          <PlanPreview locale={locale} />
          <Reveal className="stack">
            <div className="eyebrow">{no ? "Tomtene" : "Plots"}</div>
            <h2>{no ? "Rekker mot sør, mot sjøen" : "Rows facing south, towards the sea"}</h2>
            <p className="lede">
              {no
                ? `Boligene ligger i ${word(FACT.rows)} rekker langs en vei som svinger seg oppover knausen. Målet er maks ${FACT.road_grade_pct} prosent stigning; på dagens terreng er veien i modellen brattere, så reguleringsplanen må gi den lengre sløyfer og terrengarbeid. Gangstier binder rekkene sammen. Sørvendte tak bør være så enkle og sammenhengende som mulig, med få oppbygg, slik at de kan fylles med solceller.`
                : `The homes sit in ${word(FACT.rows, "en")} rows along a road that winds up the knoll. The aim is at most ${FACT.road_grade_pct} percent grade; on today's ground the road in the model is steeper, so the zoning plan must give it longer loops and earthworks. Footpaths tie the rows together. South-facing roofs should be as simple and continuous as possible, with few dormers, so that they can be filled with solar panels.`} <Src id="tak" label={source} />
            </p>
            <p className="measure">
              {no
                ? "Kontorbygget og bolighuset nederst finnes allerede. Utvidelsen av kontoret og et lager- og verkstedbygg bak bolighuset er planlagt."
                : "The office building and the house at the bottom already exist. The extension of the office and a warehouse and workshop building behind the house are planned."} <Src id="bygg" label={source} />
            </p>
          </Reveal>
        </div>
        <div className="wrap kbest">
          <div className="kj-head">
            <h3>{no ? "Mest vintersol" : "Most winter sun"}</h3>
            <p className="measure">{WINTER_SUN_TEXT[locale]}</p>
          </div>
          <Reveal className="kbest-grid" stagger>
            {best.map((p) => (
              <div key={p.id} className="kbest-card">
                {/* the passport links to the plot's own page itself (/tomtene/07, /english/tomtene/07) */}
                <Passport plot={p} locale={locale} variant="klassisk" />
              </div>
            ))}
          </Reveal>
          <div className="cta-row">
            <Link className="btn" href={k("/tomtene")}>{no ? `Alle ${plots.length} tomter` : `All ${plots.length} plots`}</Link>
            <Link className="btn ghost" href={k("/konfigurator")}>{no ? "Sett sammen huset" : "Configure your house"}</Link>
          </div>
        </div>
      </section>

      <section className="sec kcv" id="energi" data-journey="energi">
        <div className="wrap">
          <div className="eyebrow">{no ? "Energi og teknologi" : "Energy and technology"}</div>
          <h2 style={{ maxWidth: "18ch" }}>{no ? "Et robust system, ikke én teknologi" : "A robust system, not one technology"}</h2>
          <p className="lede mt">
            {no
              ? "Retningen prosjekteier har satt: sol, mulig vind, batterier i hver bolig og i fellesskap, smart styring og rom for løsninger som kommer senere. Ambisiøst, uten å binde prosjektet til umodne eller unødvendig dyre valg."
              : "The direction the project owner has set: solar, possibly wind, batteries in every home and shared, smart control and room for solutions that come later. Ambitious, without tying the project to immature or needlessly expensive choices."} <Src id="retning" label={source} />
          </p>
          <Reveal className="cols3" stagger>
            <div>
              <h3>{no ? "Batteri i hver bolig" : "A battery in every home"}</h3>
              <p>{no ? "Hver bolig bør få eget batteri og lokal energistyring, med mulig tilgang til et felles lager for feltet. Arkitekturen forberedes for energideling uten at det blir en forutsetning i første fase." : "Every home should get its own battery and local energy management, with possible access to a shared store for the field. The architecture is prepared for energy sharing without making it a prerequisite in the first phase."} <Src id="batteri" label={source} /></p>
            </div>
            <div>
              <h3>{no ? "Sol på taket og et felles anlegg" : "Solar on the roofs and a shared plant"}</h3>
              <p>{no ? `Optimaliserte solflater på boligene, kombinert med et felles solanlegg på det høyeste punktet bak feltet. Første scenario regner med cirka ${FACT.panels} paneler i fellesanlegget.` : `Optimised solar surfaces on the homes, combined with a shared solar plant at the highest point behind the field. The first scenario counts about ${FACT.panels} panels in the shared plant.`} <Src id="paneler" label={source} /></p>
            </div>
            <div>
              <h3>{no ? "Vind som supplement" : "Wind as a supplement"}</h3>
              <p>{no ? "Små vindturbiner vurderes både per bolig og som felles anlegg, for produksjon om kveldene og nettene. Lokale vindmålinger avgjør om det gir reell verdi." : "Small wind turbines are being considered for each home and as a shared plant, for production in the evenings and at night. Local wind measurements decide whether they add real value."} <Src id="vind" label={source} /></p>
            </div>
          </Reveal>

          <div className="kenergy">
            <div className="kenergy-head">
              <h3>{no ? "Energiregnskapet for hele feltet" : "The energy budget for the whole field"}</h3>
              <span className="tag">{no ? "Foreløpig" : "Provisional"}</span>
            </div>
            <div className="numrow four">
              {keys.map((e) => (
                <div key={e.key}>
                  <b>{e.value} <small>{e.unit}</small></b>
                  <span>{e.label}{e.src && <> <Src id={e.src} label={source} /></>}</span>
                  <span className="small">{e.note}</span>
                </div>
              ))}
            </div>
            <div className="kenergy-head">
              <h3>{no ? "Tiltakene, vurdert" : "The measures, assessed"}</h3>
              <Src id="tiltak" label={source} />
            </div>
            <p className="small">{measuresLine(locale)}.</p>
            <dl className="verdicts">
              {measuresByVerdict().map((g) => (
                <div key={g.verdict}>
                  <dt>{g.label[locale]}</dt>
                  <dd>{g.items.map((m) => <span key={m.id} className={`mchip ${g.verdict}`}>{m.name[locale]}</span>)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="cta-row"><Link className="btn ghost" href={k("/energi")}>{no ? "Hele energikonseptet" : "The whole energy concept"}</Link></div>
        </div>
      </section>

      <section className="sec alt kcv" id="bygg" data-journey="bygg">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{no ? "Eksisterende bygg" : "Existing buildings"}</div>
            <h2>{no ? "Kan måles, ikke bare beregnes" : "Measured, not just calculated"}</h2>
            <p className="lede">{no ? "Få nye felt har det Knotten har fra start: bygg som allerede bruker strøm, og som kan måles." : "Few new developments have what Knotten has from the start: buildings that already use power, and that can be measured."}</p>
            <div className="cta-row"><Link className="btn ghost" href={k("/eksisterende-bygg")}>{no ? "Eksisterende bygg" : "Existing buildings"}</Link></div>
          </Reveal>
          <Reveal className="stack" delay={120}>
            <p className="measure">
              {no
                ? `Kontorbygget har ${FACT.offices_now} kontorer i dag og utvides til ${FACT.offices_after}. Bolighuset ligger nederst i feltet. Et lager- og verkstedbygg er planlagt bak det. Strømforbruket deres blir referansen de nye boligene måles mot.`
                : `The office building has ${FACT.offices_now} offices today and is being extended to ${FACT.offices_after}. The house sits at the bottom of the field. A warehouse and workshop building is planned behind it. Their power use becomes the reference the new homes are measured against.`} <Src id="kontor" label={source} />
            </p>
          </Reveal>
        </div>
      </section>

      <section className="sec kcv" id="status" data-journey="status">
        <div className="wrap">
          <div className="eyebrow">{no ? "Hvor prosjektet står" : "Where the project stands"}</div>
          <h2 style={{ maxWidth: "20ch" }}>{no ? "Det som kan dokumenteres, og det som ikke kan det ennå" : "What can be documented, and what cannot yet"}</h2>
          <p className="lede mt">{no ? "Prosjektet starter før reguleringsplanen. Her er hvor det står, og hva som må på plass før neste steg." : "The project starts before the zoning plan. Here is where it stands, and what has to be in place before the next step."}</p>
          <Reveal className="phases" stagger>
            {HOME_PHASES.map((ph) => (
              <div key={ph.title.no} className={ph.now ? "now" : undefined}><b>{ph.title[locale]}</b><span>{ph.text[locale]}</span></div>
            ))}
          </Reveal>
          <div className="cta-row">
            <Link className="btn" href={k("/status")}>{no ? "Status og spørsmål" : "Status and questions"}</Link>
            <Link className="btn ghost" href={k("/prosjektet")}>{no ? "Om prosjektet" : "About the project"}</Link>
            <Link className="btn ghost" href={k("/investorer")}>{no ? "Investorer og samarbeid" : "Investors and partners"}</Link>
            <Link className="btn ghost" href={k("/dokumentbank")}>{no ? "Dokumentbank" : "Document bank"}</Link>
          </div>
        </div>
      </section>

      {news.length > 0 && (
        <section className="sec alt kcv" id="nyheter" data-journey="nyheter">
          <div className="wrap">
            <div className="eyebrow">{no ? "Nyheter" : "News"}</div>
            <h2>{no ? "Siste nytt fra prosjektet" : "Latest from the project"}</h2>
            <Reveal className="knews" stagger>
              {news.map((n) => (
                <article key={n.id}>
                  <time dateTime={n.date}>{dateLong(n.date, locale)}</time>
                  <h3>{n.title[locale]}</h3>
                  <p>{n.text[locale]}</p>
                </article>
              ))}
            </Reveal>
            <div className="cta-row"><Link className="btn ghost" href={k("/nyheter")}>{no ? "Alle nyheter" : "All news"}</Link></div>
          </div>
        </section>
      )}

      <div className="kcv" data-journey="utbygger">
        <AboutDeveloper
          locale={locale}
          company={company}
          orgDisplay={formatOrgNumber(company.org_number)}
          alt={false}
          actions={<Link className="btn ghost" href={k("/teamet")}>{no ? "Teamet" : "The team"}</Link>}
        />
      </div>

      <section className="sec alt kcv" id="kontakt" data-journey="kontakt">
        <div className="wrap band">
          <Reveal className="stack">
            <div className="eyebrow">{no ? "Meld interesse" : "Register interest"}</div>
            <h2>{no ? "Vil du følge Knotten?" : "Would you like to follow Knotten?"}</h2>
            <p className="lede">{no ? "Boligkjøper, investor, kommune eller forsker. Si fra hvem du er, så tar vi kontakt innen to virkedager." : "Home buyer, investor, municipality or researcher. Tell us who you are, and we will be in touch within two working days."}</p>
          </Reveal>
          <div className="cta-row">
            <Link className="btn" href={k("/kontakt")}>{no ? "Meld interesse" : "Register interest"}</Link>
            <Link className="btn ghost" href={k("/konfigurator")}>{no ? "Sett sammen huset" : "Configure your house"}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
