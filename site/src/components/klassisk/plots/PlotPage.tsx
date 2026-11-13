import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import PageHead from "@/components/klassisk/PageHead";
import Reveal from "@/components/klassisk/Reveal";
import SitePlan from "@/components/klassisk/SitePlan";
import KFollowPlotButton from "@/components/klassisk/members/FollowPlotButton";
import Stage from "@/components/Stage";
import Passport from "@/components/ui/Passport";
import HorizonChart from "@/components/charts/HorizonChart";
import JsonLd from "@/components/JsonLd";
import WithWebGL from "./WithWebGL";
import { canonicalNr } from "./plotMeta";
import { loadCommercial, loadPlots, loadSettings } from "@/lib/data";
import { STATUS_TEXT, STILL_TITLE, neighbours, plotDescription, plotNr, plotStill, priceText } from "@/lib/content/plots";
import { plotPlaceJsonLd } from "@/lib/content/jsonld";
import { kHref, type KLocale } from "@/lib/klassisk/locale";
import { plotName, plotNo, rowLabel, sunLabel } from "@/lib/format";
import { fmt } from "@/lib/facts/core";
import { SITE } from "@/lib/meta";

const TAG = { available: "green", reserved: "blue", sold: "grey", unreleased: "grey" } as const;

/**
 * One plot in the Klassisk design (/tomtene/07, /english/tomtene/07): the status and price the administrator set,
 * the 3D model standing on the plot, the sun passport, the horizon, the details, and the plots around it. The same
 * content as the Moderne plot page (/no/tomter/plot-07), in the Klassisk look.
 */
export default async function PlotPage({ nr, locale }: { nr: string; locale: KLocale }) {
  const en = locale === "en";
  const lang = locale;
  const canon = canonicalNr(nr);
  const { plots } = await loadPlots();
  if (!canon || !plots.some((p) => p.id === `plot-${canon}`)) notFound();
  if (canon !== nr) permanentRedirect(kHref(`/tomtene/${canon}`, locale));
  const plot = plots.find((p) => p.id === `plot-${canon}`)!;
  const [com, settings] = await Promise.all([loadCommercial(), loadSettings()]);
  const c = com[plot.id];
  const name = plotName(plot.id, !en);
  const near = neighbours(plots, plot.id);
  const masl = en ? "m above sea level" : "meter over havet";
  const row = rowLabel(plot);
  const still = plotStill(plot, lang);

  return (
    <>
      <JsonLd data={plotPlaceJsonLd({ site: SITE, path: kHref(`/tomtene/${canon}`, locale), name: `${name}, Knotten`, description: plotDescription(plot, lang), lat: plot.lat, lon: plot.lon, elevation: plot.local.z_ground, lang })} />
      <PageHead
        title={name}
        locale={locale}
        crumb={<><Link href={kHref(`/tomtene?tomt=${canon}`, locale)}>{en ? "Plots" : "Tomtene"}</Link> / {name}</>}
        aside={
          <div className="cta-row pk-actions">
            <Link className="btn" href={kHref(`/kontakt?tomt=${canon}`, locale)}>{en ? "Register interest" : "Meld interesse"}</Link>
            <Link className="btn ghost" href={kHref(`/konfigurator?tomt=${canon}`, locale)}>{en ? "Configure your house" : "Sett sammen huset"}</Link>
            <KFollowPlotButton plotId={plot.id} locale={locale} />
          </div>
        }
      >
        <p>
          {en ? `Row ${row}, ${fmt(Math.round(plot.local.z_ground), lang)} ${masl}. The house faces ${Math.round(plot.house.facing_deg)} degrees. ` : `Rekke ${row}, ${fmt(Math.round(plot.local.z_ground), lang)} ${masl}. Huset vender mot ${Math.round(plot.house.facing_deg)} grader. `}
          {plot.view.open_sea_visible
            ? (en ? `Open sea is visible across ${plot.view.open_sea_deg} degrees of the horizon.` : `Åpent hav er synlig over ${plot.view.open_sea_deg} grader av horisonten.`)
            : (en ? "The fjord is in view. Open sea lies behind the hill from this plot." : "Fjorden er i sikt. Åpent hav ligger bak åsen fra denne tomten.")}
        </p>
        <p className="pk-status"><span className={`tag ${TAG[c.status]}`}>{STATUS_TEXT[c.status][lang]}</span> <b>{priceText(c.price_nok, lang)}</b></p>
        <p className="small" style={{ marginTop: 6 }}>{settings.release_note[locale]}</p>
      </PageHead>

      <section className="sec pk-model">
        <div className="wrap">
          {/* where the browser cannot draw the model, the still from the plot below takes its place (or, without one, the
              plot on the site plan) */}
          <WithWebGL
            fallback={still
              ? <p role="status" className="lede">{en ? "The 3D model cannot be drawn in this browser. Here is the view from the plot in the model." : "3D-modellen kan ikke vises i denne nettleseren. Her er utsikten fra tomten i modellen."}</p>
              : (
                <figure className="fig">
                  <SitePlan mode="plan" numbered selected={Number(plotNo(plot.id))} locale={locale} />
                  <figcaption><span>{en ? `The 3D model cannot be drawn in this browser. ${name} is marked on the site plan.` : `3D-modellen kan ikke vises i denne nettleseren. ${name} er markert på situasjonsplanen.`}</span></figcaption>
                </figure>
              )}
          >
            <Stage plots={plots} locale={locale} initialMode="plot" initialPlot={plot.id} compact variant="klassisk" />
          </WithWebGL>
          {still && (
            <figure className="pk-still">
              <Image src={still.src} alt={still.alt} width={still.w} height={still.h} sizes="(max-width: 1240px) 100vw, 1240px" quality={90} />
              <figcaption><b>{STILL_TITLE[lang]}</b>{still.caption}</figcaption>
            </figure>
          )}
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{en ? "The sun passport" : "Solpasset"}</div>
            <Passport plot={plot} locale={locale} here variant="klassisk" />
          </Reveal>
          <Reveal className="stack" delay={120}>
            <div className="eyebrow">{en ? "Sun and horizon" : "Sol og horisont"}</div>
            <h2>{en ? "The horizon around the plot" : "Horisonten rundt tomten"}</h2>
            <p>{en ? "The terrain's angle above the horizon in every direction, from the living-room floor. The sun is above the terrain where its path lies above the dark line." : "Terrengets høyde over horisonten i hver retning, regnet fra stuegulvet. Solen er over terrenget der banen ligger over den mørke linjen."}</p>
            <div className="fig"><HorizonChart plot={plot} locale={locale} variant="klassisk" /></div>
            <div className="tbl">
              <table>
                <tbody>
                  <tr><th scope="row">{en ? "Coordinates" : "Koordinater"}</th><td>{plot.lat.toFixed(6)}, {plot.lon.toFixed(6)} (UTM32 {plot.utm32_east.toFixed(0)} E, {plot.utm32_north.toFixed(0)} N)</td></tr>
                  <tr><th scope="row">{en ? "Floor level" : "Gulvnivå"}</th><td>{fmt(plot.local.z_floor, lang, 1)} {en ? "m a.s.l." : "moh."}</td></tr>
                  <tr><th scope="row">{en ? "Sun 21 March" : "Sol 21. mars"}</th><td>{fmt(plot.sun.mar21.hours, lang)} {en ? "h" : "t"}, {sunLabel(plot.sun.mar21.first_sun_cet)} {en ? "to" : "til"} {sunLabel(plot.sun.mar21.last_sun_cet)}</td></tr>
                  <tr><th scope="row">{en ? "Farthest water in view" : "Lengste sikt over vann"}</th><td>{fmt(plot.view.farthest_water_m / 1000, lang, 1)} km</td></tr>
                  <tr><th scope="row">{en ? "House in the model" : "Hus i modellen"}</th><td>{fmt(plot.house.width_m, lang)} × {fmt(plot.house.depth_m, lang)} m, {en ? "eaves" : "gesims"} {fmt(plot.house.eaves_m, lang)} m, {en ? "ridge" : "møne"} {fmt(plot.house.ridge_m, lang)} m ({en ? "illustration" : "illustrasjon"})</td></tr>
                  <tr><th scope="row">{en ? "Levelling" : "Planering"}</th><td>≈ {fmt(plot.terrain.level_pad_cutfill_m3, lang)} m³ ({en ? "order of magnitude" : "størrelsesorden"})</td></tr>
                </tbody>
              </table>
            </div>
            <p className="small">{en ? "Sun: terrain shading with the field cleared, no shading between houses. Water: line of sight to sea-level cells; open sea is water beyond 7 km. Kartverket DTM 1 m with a 30 km horizon, computed 2026-09-30 for the provisional layout v6." : "Sol: terrengskygge med feltet ryddet, ingen skygge mellom hus. Sjø: siktlinje til celler på havnivå; åpent hav er vann lenger unna enn 7 km. Kartverket DTM 1 m med 30 km horisont, beregnet 2026-09-30 for det foreløpige utlegget v6."}</p>
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <Reveal className="stack" style={{ maxWidth: "70ch" }}>
            <div className="eyebrow">{en ? "Around the plot" : "Rundt tomten"}</div>
            <h2>{en ? "The neighbouring plots" : "Nabotomtene"}</h2>
          </Reveal>
          <nav className="pk-near" aria-label={en ? "The neighbouring plots" : "Nabotomtene"}>
            <div className="cta-row">
              {near.prev && <Link className="btn ghost" href={kHref(`/tomtene/${plotNr(near.prev.id)}`, locale)}><span aria-hidden>‹ </span>{plotName(near.prev.id, !en)}</Link>}
              {near.next && <Link className="btn ghost" href={kHref(`/tomtene/${plotNr(near.next.id)}`, locale)}>{plotName(near.next.id, !en)}<span aria-hidden> ›</span></Link>}
              <Link className="btn" href={kHref(`/tomtene?tomt=${canon}`, locale)}>{en ? "All plots" : "Alle tomter"}</Link>
            </div>
            {near.row.length > 0 && (
              <p className="pk-row">
                <span className="small">{en ? `Also in row ${row}:` : `Også i rekke ${row}:`}</span>
                {near.row.map((q) => <Link key={q.id} className="chip" href={kHref(`/tomtene/${plotNr(q.id)}`, locale)} aria-label={plotName(q.id, !en)}>{plotNo(q.id)}</Link>)}
              </p>
            )}
          </nav>
        </div>
      </section>
    </>
  );
}
