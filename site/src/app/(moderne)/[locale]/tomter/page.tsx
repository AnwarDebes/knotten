import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { isLocale, t } from "@/lib/i18n";
import { loadPlots, loadCommercial } from "@/lib/data";
import { plotName, rowLabel, sunLabel } from "@/lib/format";
import { FACT, fmt, word } from "@/lib/facts";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import Stage from "@/components/Stage";
import WithWebGL from "@/components/klassisk/plots/WithWebGL";
import PlanOverview from "./PlanOverview";
import { SORTS, STATUS_TEXT, priceText } from "@/lib/content/plots";
import { pageMeta } from "@/lib/meta";
import { notFound } from "next/navigation";

export const generateMetadata = pageMeta("/tomter", {
  no: { title: "Tomtene", description: `Rundt ${FACT.plots} tomter i ${word(FACT.rows)} rekker på Knotten, med solpass for hver: sol gjennom året, sjø i sikt, høyde og helning.` },
  en: { title: "Plots", description: `About ${FACT.plots} plots in ${word(FACT.rows, "en")} rows on Knotten, each with a sun passport: sun through the year, water in view, elevation and slope.` },
});

export default async function Plots({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ sort?: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const { sort = "dec" } = await searchParams;
  const locale = l as Locale;
  const d = t(locale);
  const no = locale === "no";
  const { plots } = await loadPlots();
  const com = await loadCommercial();
  const sorted = [...plots].sort((a, b) =>
    sort === "sea" ? b.view.water_visible_deg - a.view.water_visible_deg
    : sort === "height" ? b.local.z_ground - a.local.z_ground
    : sort === "row" ? a.row - b.row
    : b.sun.dec21.hours - a.sun.dec21.hours);
  // (the same four orders as the Klassisk plot picker; here the winter sun comes first)
  const sorts = [SORTS[1], SORTS[2], SORTS[3], SORTS[0]].map((o) => [o.key, o.label[locale]]);
  return (
    <>
      <Nav locale={locale} />
      <PageHead
        title={d.nav.plots}
        lede={no
          ? `I modellen ligger ${plots.length} tomter innenfor eiendomsgrensen, i ${word(FACT.rows)} rekker som i prosjekteiers plan: A, B og C over hverandre i sørhellingen og D på knausen Knotten. Ønsket er sjøutsikt fra alle tomtene, men det er ikke sikkert at det går fra alle; i modellens forslag ser alle vann. Utlegget er foreløpig og byttes ut med den regulerte planen, men tallene per tomt er allerede regnet fra terrenget.`
          : `In the model, ${plots.length} plots sit inside the parcel boundary, in ${word(FACT.rows, "en")} rows as in the project owner's plan: A, B and C one above the other on the south face and D on the Knotten knoll. The aim is a sea view from every plot, but it is not certain every plot will get one; in the model's proposal all see water. The layout is provisional and will be replaced by the regulated plan, but the numbers per plot are already computed from the terrain.`}
        action={<Link className="btn btn-amber" href={`/${locale}/interesse`}>{d.cta.register}</Link>}
      />
      <WithWebGL fallback={<p role="status" className="wrap text-[15px] font-medium">{no ? "3D-modellen kan ikke vises i denne nettleseren. Situasjonsplanen under viser de samme tomtene." : "The 3D model cannot be drawn in this browser. The site plan below shows the same plots."}</p>}>
        <Stage plots={plots} locale={locale} initialMode="plot" initialPlot={sorted[0].id} compact />
      </WithWebGL>
      <section className="wrap section-tight" aria-labelledby="plan">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] items-end mb-6">
          <h2 id="plan" className="display text-[clamp(30px,4vw,48px)]">{no ? "Situasjonsplanen" : "The site plan"}</h2>
          <p className="text-[15.5px] text-ink-2 max-w-[52ch] md:justify-self-end">
            {no
              ? `Alle ${plots.length} tomtene på det målte terrenget, nord opp, med veien, gangstien og byggene som står der i dag. Velg en tomt for å se sol, sikt og horisont.`
              : `All ${plots.length} plots on the measured terrain, north up, with the road, the footpath and the buildings that stand there today. Choose a plot to see its sun, view and horizon.`}
          </p>
        </div>
        <PlanOverview locale={locale} />
      </section>
      <section className="wrap section-tight">
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <span className="text-granite mr-1">{no ? "Sorter etter" : "Sort by"}</span>
          {sorts.map(([k, label]) => (
            <Link key={k} href={`?sort=${k}`} scroll={false} aria-current={sort === k ? "true" : undefined} className={`chip no-underline ${sort === k ? "chip-amber" : ""}`}>{label}</Link>
          ))}
        </div>
        {/* on a wide screen the table fits, and its headings stay in view under the header while the rows scroll */}
        {/* (relative: the hidden link texts in the table stay inside the scrolling box, so a phone gets no sideways scroll) */}
        <div className="relative overflow-x-auto lg:overflow-visible mt-6">
          <table className="table table-sticky">
            <thead>
              <tr>
                <th>{no ? "Tomt" : "Plot"}</th>
                <th>{no ? "Rekke" : "Row"}</th>
                <th className="n">{no ? "Høyde" : "Elev."}</th>
                <th className="n">{no ? "Sol 21. des" : "Sun 21 Dec"}</th>
                <th>{no ? "Første til siste sol, des" : "First to last sun, Dec"}</th>
                <th className="n">{no ? "Sol 21. jun" : "Sun 21 Jun"}</th>
                <th className="n">{no ? "Sjø i sikt" : "Water"}</th>
                <th>{no ? "Åpent hav" : "Open sea"}</th>
                <th className="n">{no ? "Helning" : "Slope"}</th>
                <th>{no ? "Hustype" : "House type"}</th>
                <th>{no ? "Status og pris" : "Status and price"}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id}>
                  {/* (no prefetch: thirty plot pages in view would otherwise be fetched before anyone chooses one) */}
                  <td><Link href={`/${locale}/tomter/${p.id}`} prefetch={false} className="font-medium">{plotName(p.id, no)}</Link></td>
                  <td>{p.zone === "flat" ? (no ? "flaten" : "flat") : rowLabel(p)}</td>
                  <td className="n">{p.local.z_ground.toFixed(0)} m</td>
                  <td className="n">{fmt(p.sun.dec21.hours, no ? "no" : "en", 1)} h</td>
                  <td>{sunLabel(p.sun.dec21.first_sun_cet)} {no ? "til" : "to"} {sunLabel(p.sun.dec21.last_sun_cet)}</td>
                  <td className="n">{fmt(p.sun.jun21.hours, no ? "no" : "en", 1)} h</td>
                  <td className="n">{p.view.water_visible_deg}°</td>
                  <td>{p.view.open_sea_visible ? (no ? "ja" : "yes") : (no ? "nei" : "no")}</td>
                  <td className="n">{p.terrain.slope_deg.toFixed(0)}°</td>
                  <td>
                    {com[p.id].house_type[locale]}
                    <div className="mt-1"><Link href={`/${locale}/konfigurator?tomt=${p.id.slice(5)}`} prefetch={false} className="text-[13.5px]">{no ? "Sett sammen huset" : "Configure the house"}<span className="sr-only"> {no ? "på" : "on"} {plotName(p.id, no).toLowerCase()}</span></Link></div>
                  </td>
                  <td><span className={`chip ${com[p.id].status === "available" ? "chip-pine" : com[p.id].status === "reserved" ? "chip-amber" : ""}`}>{STATUS_TEXT[com[p.id].status][locale].toLowerCase()}</span><div className="text-[12.5px] text-muted mt-1 whitespace-nowrap">{priceText(com[p.id].price_nok, locale)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="provenance mt-5 max-w-[80ch]">
          {no
            ? "Sol: terrengskygge med feltet ryddet, ingen skygge mellom hus. Sjø: siktlinje til celler på havnivå; åpent hav er vann lenger unna enn 7 km. Kartverket DTM 1 m med 30 km horisont, beregnet 2026-09-30 for det foreløpige utlegget v6."
            : "Sun: terrain shading with the field cleared, no shading between houses. Water: line of sight to sea-level cells; open sea is water beyond 7 km. Kartverket DTM 1 m with a 30 km horizon, computed 2026-09-30 for the provisional layout v6."}
        </p>
      </section>
    </>
  );
}
