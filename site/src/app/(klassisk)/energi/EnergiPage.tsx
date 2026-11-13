import Image from "next/image";
import Link from "next/link";
import PageHead from "@/components/klassisk/PageHead";
import EnergyFlow from "@/components/klassisk/EnergyFlow";
import Reveal from "@/components/klassisk/Reveal";
import { Src } from "@/components/klassisk/Source";
import EnergySimulator from "@/components/energy/EnergySimulator";
import { BUDGET, DIRECTION, DOCS, EED, MEASURES, MEASURES_COMPARED, MEASURE_GROUPS, STATUS_SOLAR, dateLong, fmt, fmtRound, outageScore, shortVerdict, type SourceId } from "@/lib/facts";
import { EED_FIGURES, EED_NEXT } from "@/lib/content/energy";
import { kHref, type KLocale } from "@/lib/klassisk/locale";
import { loadPlots } from "@/lib/data";

/** Text colour of a verdict in the measures table. */
const CLASS = { yes: "ok", maybe: "maybe", no: "no" } as const;

/**
 * "Energi og teknologi" in the Klassisk look, in Norwegian (/energi) and English (/english/energi): the system
 * sketch, every measure the project has looked at with its verdict and outage score (grouped as Moderne groups
 * them), the energy budget's figures, the borehole field in four figures, the project owner's direction, the
 * simulator and the way on to the existing buildings. Every figure comes from src/lib/facts.
 */
export default async function EnergiPage({ locale }: { locale: KLocale }) {
  const en = locale === "en";
  const L = locale;
  const { plots } = await loadPlots();
  const S = (id: SourceId) => <Src id={id} label={en ? "Source" : undefined} />;
  const n = (v: number, digits?: number) => fmt(v, L, digits);
  const r = (v: number, step: number) => fmtRound(v, step, L);
  const about = en ? "about" : "ca.";
  const tag = <span className="tag">{en ? "Provisional" : "Foreløpig"}</span>;
  const title = en ? "Energy and technology" : "Energi og teknologi";

  return (
    <>
      <PageHead title={title} crumb={title} locale={L}>
        <p>
          {en
            ? "How the sun, the wind, the batteries and the buildings fit together. The direction was set by the project owner in September 2026 and is a working basis, not final decisions."
            : "Slik henger solen, vinden, batteriene og byggene sammen. Retningen er satt av prosjekteier i september 2026 og er et arbeidsgrunnlag, ikke endelige beslutninger."}{" "}
          {S("retning")}
        </p>
      </PageHead>
      <section className="sec" style={{ paddingTop: 32 }}>
        <div className="wrap">
          <Reveal><EnergyFlow locale={L} /></Reveal>

          {/* the measures: all of them, in the same groups as the Moderne page */}
          <div className="split" style={{ marginTop: 56 }}>
            <Reveal className="stack">
              <div className="eyebrow">{en ? "Measures assessed" : "Tiltak som er vurdert"}</div>
              <h2>{en ? "What is in, and what is out" : "Hva som er inne, og hva som er ute"}</h2>
              <p className="measure">
                {en
                  ? `${MEASURES.length} measures. The energy track compared ${MEASURES_COMPARED} of them on cost, feasibility, robustness in a power cut and how much energy they give or save; the shared solar plant came later with the project owner's direction. The assessments are provisional, and the building standard for the homes is not set. Where the energy track and the project owner differ, both are given.`
                  : `${MEASURES.length} tiltak. Energisporet sammenlignet ${MEASURES_COMPARED} av dem etter kostnad, gjennomførbarhet, robusthet ved strømbrudd og hvor mye energi de gir eller sparer; det felles solanlegget kom senere med retningen fra prosjekteier. Vurderingene er foreløpige, og byggestandarden for boligene er ikke fastsatt. Der energisporet og prosjekteier er uenige, står begge.`}{" "}
                {S("tiltak")}
              </p>
              <p className="small">
                {en
                  ? `Comparison table from the energy track, ${dateLong(DOCS.measures.date, "en")}, direction from the project owner, ${dateLong(DOCS.direction.date, "en")}, and clarifications in the project, 27 September 2026. Robustness in a power cut is scored from 0 to 10.`
                  : `Sammenligningstabell fra energisporet, ${dateLong(DOCS.measures.date)}, retning fra prosjekteier ${dateLong(DOCS.direction.date)}, og avklaringer i prosjektet 27. september 2026. Robusthet ved strømbrudd er gitt fra 0 til 10.`}
              </p>
            </Reveal>
            <Reveal className="tbl mtbl" delay={120}>
              <table>
                <caption className="sr">{en ? `The ${MEASURES.length} measures, with the verdict and the robustness in a power cut` : `De ${MEASURES.length} tiltakene, med vurdering og robusthet ved strømbrudd`}</caption>
                <thead><tr><th scope="col">{en ? "Measure" : "Tiltak"}</th><th scope="col">{en ? "Verdict" : "Vurdering"}</th><th scope="col">{en ? "In a power cut" : "Robusthet ved strømbrudd"}</th></tr></thead>
                {MEASURE_GROUPS.map((g) => (
                  <tbody key={g.id}>
                    <tr className="mgroup"><th scope="rowgroup" colSpan={3}>{g.name[L]}</th></tr>
                    {MEASURES.filter((m) => m.category === g.id).map((m) => (
                      <tr key={m.id}>
                        <th scope="row">{m.name[L]}</th>
                        <td className={CLASS[m.verdict]}>{shortVerdict(m, L)}</td>
                        <td data-label={en ? "power cut" : "strømbrudd"}>{outageScore(m, L)}</td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </Reveal>
          </div>

          {/* the energy budget, in three rows of three */}
          <Reveal className="numrow" style={{ marginTop: 56 }} stagger>
            <div>{tag}<b>{`${about} ${r(BUDGET.demand_total_kwh, 10000)} kWh`}</b><span>{en ? `total energy demand a year for the homes, the office and the warehouse, with a realistic range of ±${BUDGET.demand_range_pct} %` : `samlet energibehov per år for boliger, kontor og lager, med et realistisk spenn på ±${BUDGET.demand_range_pct} %`} {S("budsjett")}</span></div>
            <div>{tag}<b>{`${n(BUDGET.results.self_sufficiency_pct)} %`}</b><span>{en ? "power self-sufficiency in the working version of the energy budget. Expected to fall once the solar output is corrected." : "selvforsyning av strøm i arbeidsversjonen av energiregnskapet. Ventes å gå ned når solproduksjonen korrigeres."} {S("selvforsyning")}</span></div>
            <div>{tag}<b>{`${BUDGET.battery.total_kwh} kWh`}</b><span>{en ? `total battery capacity, ${BUDGET.battery.per_home_kwh} kWh per home, one cycle a day.` : `samlet batterikapasitet, ${BUDGET.battery.per_home_kwh} kWh per bolig, én syklus per dag.`} {S("budsjett")}</span></div>
          </Reveal>

          {/* the borehole field: the analysis in four figures */}
          <div className="split" style={{ marginTop: 64 }}>
            <Reveal className="stack">
              <div className="eyebrow">{en ? "Ground heat" : "Grunnvarme"}</div>
              <h2>{en ? `The borehole field, simulated over ${EED.years} years` : `Brønnfeltet, simulert over ${EED.years} år`}</h2>
              <p className="measure">
                {en
                  ? "The energy track has simulated a borehole field in Earth Energy Designer, the most common tool for ground heat in Norway. The pictures are from the analysis."
                  : "Energisporet har simulert et brønnfelt i Earth Energy Designer, det vanligste verktøyet for grunnvarme i Norge. Bildene er fra analysen."}{" "}
                {S("eed")}
              </p>
            </Reveal>
            <Reveal className="eedgrid" stagger>
              {EED_FIGURES.map((f) => (
                <figure key={f.id} className={f.wide ? "wide" : ""}>
                  <div className="mapimg"><Image src={f.src} alt={f.alt[L]} width={f.w} height={f.h} sizes="(max-width: 900px) 100vw, 40vw" quality={90} /></div>
                  <figcaption>
                    <b>{f.title[L]}</b> {f.text[L]}
                    <span className="small">{f.credit[L]}. <a href={f.src} target="_blank" rel="noopener">{en ? "Open the full picture" : "Åpne hele bildet"}</a></span>
                  </figcaption>
                </figure>
              ))}
              <figure className="wide">
                <div className="mapimg"><ul className="notelist">{EED_NEXT.items.map((t) => <li key={t.no}>{t[L]}</li>)}</ul></div>
                <figcaption><b>{EED_NEXT.title[L]}</b> <span className="small">{EED_NEXT.credit[L]}</span></figcaption>
              </figure>
            </Reveal>
          </div>

          <Reveal className="numrow" style={{ marginTop: 56 }} stagger>
            <div>{tag}<b>{`${n(BUDGET.pv.annual_kwh)} kWh`}</b><span>{en ? `solar power a year in the energy budget, which itself says the figure is about 30 % too high. The status summary estimates about ${r(STATUS_SOLAR.annual_kwh, 1000)} kWh from ${n(STATUS_SOLAR.area_m2)} m² of panels.` : `solstrøm per år i energiregnskapet, som selv sier at tallet er om lag 30 % for høyt. Statusoppsummeringen anslår om lag ${r(STATUS_SOLAR.annual_kwh, 1000)} kWh fra ${n(STATUS_SOLAR.area_m2)} m² paneler.`} {S("sol")}</span></div>
            <div>{tag}<b>{`${about} ${r(BUDGET.results.saving_per_home_nok, 1000)} kr`}</b><span>{en ? "estimated yearly saving per home against direct electric heating without solar or batteries, simplified split." : "anslått årlig besparelse per bolig mot direkte elektrisk oppvarming uten sol og batteri, forenklet fordeling."} {S("besparelse")}</span></div>
            <div>{tag}<b>{`${about} ${r(BUDGET.results.co2_saved_kg, 1000)} kg`}</b><span>{en ? `CO₂ saved a year against the reference, with ${n(BUDGET.prices.co2_kg_per_kwh)} kg per kWh of grid power as the method's choice.` : `CO₂ spart per år mot referansen, med ${n(BUDGET.prices.co2_kg_per_kwh)} kg per kWh nettstrøm som metodevalg.`} {S("co2")}</span></div>
          </Reveal>
          <Reveal className="numrow" style={{ marginTop: 16 }} stagger>
            <div>{tag}<b>{`${n(BUDGET.bedrock.delivered_kwh)} kWh`}</b><span>{en ? `heat a year from the bedrock plant: ${n(BUDGET.bedrock.extracted_kwh)} kWh from the boreholes, with a seasonal factor of ${n(BUDGET.bedrock.scop)}.` : `varme per år fra bergvarmeanlegget: ${n(BUDGET.bedrock.extracted_kwh)} kWh fra brønnene, med årsvarmefaktor ${n(BUDGET.bedrock.scop)}.`} {S("budsjett")}</span></div>
            <div>{tag}<b>{`${n(BUDGET.wind.annual_kwh)} kWh`}</b><span>{en ? `wind power a year if it is built: ${BUDGET.wind.turbines} turbines of ${BUDGET.wind.kw_each} kW at a capacity factor of ${BUDGET.wind.capacity_factor_pct} %. Needs a wind measurement on site.` : `vindkraft per år hvis det bygges: ${BUDGET.wind.turbines} turbiner à ${BUDGET.wind.kw_each} kW med kapasitetsfaktor ${BUDGET.wind.capacity_factor_pct} %. Krever vindmåling på stedet.`} {S("vind")}</span></div>
            <div>{tag}<b>{`${n(BUDGET.prices.buy_nok, 2)} kr/kWh`}</b><span>{en ? `purchase price of power in the budget: a spot price of ${n(BUDGET.prices.spot_nok, 2)} kr, which the sheet calls very uncertain, plus ${n(BUDGET.prices.grid_nok, 2)} kr grid fee. Surplus sells for ${n(BUDGET.prices.sell_nok, 2)} kr/kWh.` : `kjøpspris for strøm i regnskapet: spotpris ${n(BUDGET.prices.spot_nok, 2)} kr, som arket kaller svært usikker, pluss ${n(BUDGET.prices.grid_nok, 2)} kr i nettleie. Overskudd selges for ${n(BUDGET.prices.sell_nok, 2)} kr/kWh.`} {S("budsjett")}</span></div>
          </Reveal>
        </div>
      </section>

      {/* the project owner's direction, point by point */}
      <section className="sec alt">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{en ? "From the project owner" : "Fra prosjekteier"}</div>
            <h2>{en ? "The direction" : "Retningen"}</h2>
            <p className="lede">
              {en
                ? `The direction from the project owner, ${dateLong(DOCS.direction.date, "en")}. Not final decisions, but what is to be investigated now.`
                : `Retningen fra prosjekteier, ${dateLong(DOCS.direction.date)}. Ikke endelige beslutninger, men det som skal undersøkes nå.`}{" "}
              {S("retning")}
            </p>
            <div className="cta-row" style={{ marginTop: 8 }}><Link className="btn ghost" href={kHref("/dokumentbank", L)}>{en ? "Read the note" : "Les notatet"}</Link></div>
          </Reveal>
          <Reveal delay={120}>
            <ol className="dirlist">
              {DIRECTION[L].map((line, i) => <li key={i}><span className="dn" aria-hidden="true">{i + 1}</span><span>{line}</span></li>)}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <Reveal className="stack">
            <div className="eyebrow">{en ? "Simulated hour by hour" : "Simulert time for time"}</div>
            <h2>{en ? "The field through a whole year" : "Feltet gjennom et helt år"}</h2>
            <p className="measure">
              {en
                ? "The energy budget works month by month. Here the whole field is computed hour by hour through a typical year for Knotten, with weather from the EU's PVGIS, the panels of every house on its own roof and use as in the budget. Choose measures and see what they mean, and try a power cut."
                : "Energiregnskapet regner måned for måned. Her regnes hele feltet time for time gjennom et typisk år for Knotten, med vær fra EUs PVGIS, panelene på hvert hus sitt eget tak og forbruk etter regnskapet. Velg tiltak og se hva de betyr, og prøv et strømbrudd."}
            </p>
          </Reveal>
          <div style={{ marginTop: 32 }}>
            <EnergySimulator plots={plots} locale={L} variant="klassisk" />
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap band">
          <Reveal className="stack">
            <div className="eyebrow">{en ? "Existing buildings" : "Eksisterende bygg"}</div>
            <h2>{en ? "Existing buildings as proof" : "Eksisterende bygg som bevis"}</h2>
            <p className="lede">
              {en
                ? "The office building and the house on the property use power today and can be measured. That is where theory can meet reality."
                : "Kontorbygget og bolighuset på eiendommen bruker strøm i dag og kan måles. Der kan teorien møte virkeligheten."}
            </p>
          </Reveal>
          <div className="cta-row"><Link className="btn" href={kHref("/eksisterende-bygg", L)}>{en ? "See the buildings" : "Se byggene"}</Link></div>
        </div>
      </section>
    </>
  );
}
