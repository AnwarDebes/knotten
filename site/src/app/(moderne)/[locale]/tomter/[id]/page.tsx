import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { isLocale, t } from "@/lib/i18n";
import { loadPlots, loadPlot, loadCommercial, loadSettings } from "@/lib/data";
import { plotName, plotNo, rowLabel, sunLabel } from "@/lib/format";
import { fmt } from "@/lib/facts/core";
import Nav from "@/components/ui/Nav";
import Stage from "@/components/Stage";
import FollowPlotButton from "@/components/members/FollowPlotButton";
import WithWebGL from "@/components/klassisk/plots/WithWebGL";
import PlanOverview from "../PlanOverview";
import Passport from "@/components/ui/Passport";
import HorizonChart from "@/components/charts/HorizonChart";
import { SITE, withAlternates } from "@/lib/meta";
import JsonLd from "@/components/JsonLd";
import { plotPlaceJsonLd } from "@/lib/content/jsonld";
import { STATUS_TEXT, STILL_TITLE, neighbours, plotDescription, plotStill, priceText } from "@/lib/content/plots";

export async function generateStaticParams() {
  const { plots } = await loadPlots();
  return plots.flatMap((p) => [{ locale: "no", id: p.id }, { locale: "en", id: p.id }]);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { id, locale } = await params;
  if (!isLocale(locale)) notFound();
  const p = await loadPlot(id);
  const no = locale === "no";
  if (!p) return { title: no ? "Fant ikke siden" : "Page not found" };
  // the plot's own share image (opengraph-image.tsx) is used, not the site's default
  return withAlternates(`/tomter/${id}`, no ? "no" : "en", { title: plotName(id, no), description: plotDescription(p, no ? "no" : "en") }, { ownImage: true });
}

export default async function PlotPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: l, id } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const no = locale === "no";
  const d = t(locale);
  const { plots } = await loadPlots();
  const plot = plots.find((p) => p.id === id);
  if (!plot) notFound();
  const name = plotName(id, no);
  const lang = no ? "no" : "en";
  const com = (await loadCommercial())[plot.id];
  const settings = await loadSettings();
  const statusLabel = STATUS_TEXT[com.status][lang].toLowerCase();
  const near = neighbours(plots, plot.id);
  const still = plotStill(plot, lang);
  return (
    <>
      <JsonLd data={plotPlaceJsonLd({ site: SITE, path: `/${locale}/tomter/${plot.id}`, name: `${name}, Knotten`, description: plotDescription(plot, lang), lat: plot.lat, lon: plot.lon, elevation: plot.local.z_ground, lang })} />
      <Nav locale={locale} />
      <section className="wrap pt-12 md:pt-16 pb-8 md:pb-10 grid gap-8 lg:grid-cols-[1fr_auto] items-end">
        <div>
          <Link href={`/${locale}/tomter`} className="text-[14px] text-granite no-underline hover:underline">{no ? "Alle tomter" : "All plots"}</Link>
          <h1 className="display text-[clamp(42px,6vw,88px)] mt-3">{name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[14px]">
            <span className={`chip ${com.status === "available" ? "chip-pine" : com.status === "reserved" ? "chip-amber" : ""}`}>{statusLabel}</span>
            <span className={com.price_nok ? "num text-[22px]" : "font-medium"}>{priceText(com.price_nok, lang)}</span>
            <span className="text-muted">{com.house_type[locale]}</span>
          </div>
          <p className="mt-2 text-[14.5px] text-muted max-w-[60ch]">{settings.release_note[locale]}</p>
          <p className="lede mt-5 max-w-[54ch]">
            {no ? `${plot.zone === "flat" ? "Flaten ved Rødbergsveien" : `Rekke ${rowLabel(plot)}`}, ${plot.local.z_ground.toFixed(0)} meter over havet. Huset vender mot ${plot.house.facing_deg.toFixed(0)} grader. ` : `${plot.zone === "flat" ? "The flat by Rødbergsveien" : `Row ${rowLabel(plot)}`}, ${plot.local.z_ground.toFixed(0)} m above sea level. The house faces ${plot.house.facing_deg.toFixed(0)} degrees. `}
            {plot.view.open_sea_visible
              ? (no ? `Åpent hav er synlig over ${plot.view.open_sea_deg} grader av horisonten.` : `Open sea is visible across ${plot.view.open_sea_deg} degrees of the horizon.`)
              : (no ? "Fjorden er i sikt. Åpent hav ligger bak åsen fra denne tomten." : "The fjord is in view. Open sea sits behind the hill from this plot.")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="btn" href={`/${locale}/konfigurator?tomt=${plot.id.slice(5)}`}>{no ? "Sett sammen huset på denne tomten" : "Configure a house on this plot"}</Link>
          <Link className="btn btn-amber" href={`/${locale}/interesse?plot=${plot.id}`}>{d.cta.register}</Link>
          <FollowPlotButton plotId={plot.id} locale={locale} />
        </div>
      </section>
      {/* where the browser cannot draw the model, the still from the plot below takes its place (or, without one, the
          plot on the site plan) */}
      <WithWebGL fallback={still
        ? <p role="status" className="wrap lede">{no ? "3D-modellen kan ikke vises i denne nettleseren. Her er utsikten fra tomten i modellen." : "The 3D model cannot be drawn in this browser. Here is the view from the plot in the model."}</p>
        : <div className="wrap"><PlanOverview locale={locale} selected={Number(plotNo(plot.id))} note={no ? `3D-modellen kan ikke vises i denne nettleseren. ${name} er markert på situasjonsplanen.` : `The 3D model cannot be drawn in this browser. ${name} is marked on the site plan.`} /></div>}>
        <Stage plots={plots} locale={locale} initialMode="plot" initialPlot={plot.id} compact />
      </WithWebGL>
      {still && (
        <figure className="wrap mt-8">
          <div className="frame">
            <Image src={still.src} alt={still.alt} width={still.w} height={still.h} sizes="(max-width: 1440px) 100vw, 1368px" quality={90} className="w-full h-auto" />
          </div>
          <figcaption className="mt-3 max-w-[90ch]"><span className="display text-[22px] block">{STILL_TITLE[locale]}</span><span className="provenance block mt-1.5">{still.caption}</span></figcaption>
        </figure>
      )}
      <section className="wrap section-tight grid gap-12 lg:grid-cols-[400px_1fr]">
        <Passport plot={plot} locale={locale} here />
        <div>
          <h2 className="display text-[32px]">{no ? "Horisonten rundt tomten" : "The horizon around the plot"}</h2>
          <p className="mt-3 text-[15.5px] max-w-[58ch] text-bone-2">
            {no
              ? "Terrengets høyde over horisonten i hver retning, regnet fra stuegulvet. Solen er over terrenget der dens bane ligger over den mørke linjen."
              : "The terrain's angle above the horizon in every direction, from the living-room floor. The sun is above the terrain where its path sits above the dark line."}
          </p>
          <div className="mt-5"><HorizonChart plot={plot} locale={locale} /></div>
          <table className="table mt-8">
            <tbody>
              <tr><th>{no ? "Koordinater" : "Coordinates"}</th><td>{plot.lat.toFixed(6)}, {plot.lon.toFixed(6)} (UTM32 {plot.utm32_east.toFixed(0)} E, {plot.utm32_north.toFixed(0)} N)</td></tr>
              <tr><th>{no ? "Gulvnivå" : "Floor level"}</th><td>{fmt(plot.local.z_floor, lang, 1)} {no ? "moh." : "m a.s.l."}</td></tr>
              <tr><th>{no ? "Sol 21. mars" : "Sun 21 March"}</th><td>{fmt(plot.sun.mar21.hours, lang)} h, {sunLabel(plot.sun.mar21.first_sun_cet)} {no ? "til" : "to"} {sunLabel(plot.sun.mar21.last_sun_cet)}</td></tr>
              <tr><th>{no ? "Lengste sikt over vann" : "Farthest water in view"}</th><td>{fmt(plot.view.farthest_water_m / 1000, lang, 1)} km</td></tr>
              <tr><th>{no ? "Hus i modellen" : "House in the model"}</th><td>{fmt(plot.house.width_m, lang)} × {fmt(plot.house.depth_m, lang)} m, {no ? "gesims" : "eaves"} {fmt(plot.house.eaves_m, lang)} m, {no ? "møne" : "ridge"} {fmt(plot.house.ridge_m, lang)} m ({no ? "illustrasjon" : "illustration"})</td></tr>
              <tr><th>{no ? "Planering" : "Levelling"}</th><td>≈ {fmt(plot.terrain.level_pad_cutfill_m3, lang)} m³ ({no ? "størrelsesorden" : "order of magnitude"})</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <nav className="wrap section-tight" aria-labelledby="near">
        <h2 id="near" className="display text-[32px]">{no ? "Nabotomtene" : "The neighbouring plots"}</h2>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {near.prev && <Link className="btn btn-ghost no-underline" href={`/${locale}/tomter/${near.prev.id}`}><span aria-hidden>‹ </span>{plotName(near.prev.id, no)}</Link>}
          {near.next && <Link className="btn btn-ghost no-underline" href={`/${locale}/tomter/${near.next.id}`}>{plotName(near.next.id, no)}<span aria-hidden> ›</span></Link>}
          <Link className="btn no-underline" href={`/${locale}/tomter`}>{no ? "Alle tomter" : "All plots"}</Link>
        </div>
        {near.row.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[14px]">
            <span className="text-muted mr-1">{no ? `Også i rekke ${rowLabel(plot)}:` : `Also in row ${rowLabel(plot)}:`}</span>
            {near.row.map((q) => <Link key={q.id} className="chip no-underline" href={`/${locale}/tomter/${q.id}`} prefetch={false} aria-label={plotName(q.id, no)}>{plotNo(q.id)}</Link>)}
          </div>
        )}
      </nav>
    </>
  );
}
