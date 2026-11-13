import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import Src from "@/components/ui/Source";
import { FACT, fmt } from "@/lib/facts";
import { MAP, MAP_ORDER, MAPS_TITLE } from "@/lib/content/maps";
import { PHOTO, photoCredit, type PhotoKey } from "@/lib/content/photos";
import { pageMeta } from "@/lib/meta";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export const generateMetadata = pageMeta("/omradet", {
  no: { title: "Området", description: "En skogkledd knaus over Audna, nær der elva renner ut i Sniksfjorden. Kartene bak planen i full størrelse, og bilder fra fjorden, Snig, Vigeland og Spangereid." },
  en: { title: "The area", description: "A wooded knoll above the Audna, near where the river flows into Sniksfjorden. The maps behind the plan in full size, and photos of the fjord, Snig, Vigeland and Spangereid." },
});

/** The photos of the area, two to a row and the panorama across: the same five as the Klassisk photos page. */
const AREA: { key: PhotoKey; wide: boolean }[] = [{ key: "sniksfjorden", wide: false }, { key: "snig", wide: false }, { key: "audna", wide: true }, { key: "spangereid", wide: false }, { key: "vigeland", wide: false }];

export default async function Area({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const no = locale === "no";
  const nb = (v: number) => fmt(v, no ? "no" : "en");
  const facts = no
    ? [["Sted", "Rødberg, Lindesnes kommune, Agder"], ["Ved", "Audna, nær utløpet i Sniksfjorden ved Snig"], ["Posisjon", `${FACT.lat} N, ${FACT.lon} Ø`], ["Høyde", `Knotten om lag ${FACT.knotten_m} moh., Løkkeheia bak feltet ${nb(FACT.lokkeheia_m)} moh.`], ["Eiendom", `gnr ${FACT.gnr} bnr ${FACT.bnr} (${nb(FACT.parcel_bnr10_m2)} m²) og bnr ${FACT.bnr_extra}, til sammen ${nb(FACT.parcel_m2)} m²`], ["Stedsnavn rundt", "Løkkeheia, Storhaugen, Haugen og Gjedeland"], ["Veier", "Rødbergsveien, Spangereidveien (fv. 460)"], ["Vann", "Audna, bekkene Harebekken og Ravnåsbekken"], ["Postnummer", FACT.postcode]]
    : [["Place", "Rødberg, Lindesnes municipality, Agder"], ["By", "The Audna, near its outlet into Sniksfjorden at Snig"], ["Position", `${FACT.lat} N, ${FACT.lon} E`], ["Elevation", `Knotten about ${FACT.knotten_m} m, Løkkeheia behind the field ${nb(FACT.lokkeheia_m)} m`], ["Parcel", `cadastral ${FACT.gnr}/${FACT.bnr} (${nb(FACT.parcel_bnr10_m2)} m²) and ${FACT.gnr}/${FACT.bnr_extra}, ${nb(FACT.parcel_m2)} m² in all`], ["Place names around", "Løkkeheia, Storhaugen, Haugen and Gjedeland"], ["Roads", "Rødbergsveien, Spangereidveien (fv. 460)"], ["Water", "The Audna, the streams Harebekken and Ravnåsbekken"], ["Postcode", FACT.postcode]];
  return (
    <>
      <Nav locale={locale} />
      <PageHead
        title={no ? "Området" : "The area"}
        lede={no
          ? "En skogkledd knaus over Audna, nær der elva renner ut i Sniksfjorden. Gårder i sør, åsen i vest, sjøen i sør. Vigeland, med skole, butikker og E39, ligger noen få kilometer nordøst."
          : "A wooded knoll above the Audna, near where the river flows into Sniksfjorden. Farms to the south, the ridge to the west, the sea to the south. Vigeland, with school, shops and the E39, is a few kilometres north-east."}
      />
      <section className="wrap pb-16 grid gap-12 lg:grid-cols-[1fr_1fr] items-start">
        <div>
          <table className="table max-w-[70ch]"><tbody>{facts.map(([a, b]) => <tr key={a}><th className="w-[130px]">{a}</th><td>{b}</td></tr>)}</tbody></table>
          <p className="provenance mt-4 max-w-[60ch]">{no ? "Stedsnavn og høyder fra Kartverket og prosjekteiers kart, veier fra OpenStreetMap, eiendom fra Matrikkelen. Avstander og tjenester legges inn med kilde av markedssporet." : "Place names and elevations from Kartverket and the project owner's maps, roads from OpenStreetMap, parcel from Matrikkelen. Distances and services are added with sources by the market track."}</p>
        </div>
        <div>
          <h2 className="display text-[clamp(34px,4.6vw,64px)] max-w-[12ch] rise">{no ? "Fra veien til toppen." : "From the road to the top."}</h2>
          <p className="lede mt-5 max-w-[46ch] rise rise-late">
            {no
              ? `Terrengprofilen i Norgeskart er ${nb(FACT.profile_m)} meter lang, fra vannet ved Spangereidveien og opp til Knotten. Den flate delen ved veien er der kontorbygget og bolighuset står i dag; sørhellingen over er der tomtene ligger.`
              : `The terrain profile in Norgeskart is ${nb(FACT.profile_m)} metres long, from the water by Spangereidveien up to Knotten. The flat part by the road is where the office building and the house stand today; the south slope above is where the plots sit.`}
          </p>
          <p className="mt-4 text-[16px] text-ink-2 max-w-[52ch]">
            {no
              ? "Knotten er et eget eid byggefelt, og prosjekteier er Sigve Simonsen AS. Skissen er prosjekteiers første tanke om hvor veien og husene kan ligge; utlegget i modellen er regnet fra terrenget og byttes ut med den regulerte planen."
              : "Knotten is a privately owned building site, and the project owner is Sigve Simonsen AS. The sketch is the project owner's first thought on where the road and the houses might go; the layout in the model is computed from the terrain and will be replaced by the regulated plan."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-ghost no-underline" href="#kart">{MAPS_TITLE[locale]}</Link>
            <Link className="btn btn-ghost no-underline" href="#bilder">{no ? "Bilder" : "Photos"}</Link>
          </div>
        </div>
      </section>

      <section id="kart" className="wrap section-tight scroll-mt-24" aria-labelledby="kart-h">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] items-end mb-8">
          <h2 id="kart-h" className="display text-[clamp(34px,4.6vw,64px)] max-w-[12ch]">{MAPS_TITLE[locale]}</h2>
          <p className="lede max-w-[46ch] md:justify-self-end">
            {no
              ? "Kartene prosjekteier har lagt til grunn, og et terrengkart laget for nettsiden, i full størrelse: eiendomsgrensene, høydekurvene, siktlinjen til havet, terrengprofilen og den første skissen til situasjonsplan."
              : "The maps the project owner has based the plan on, and a terrain map made for the website, in full size: the property boundaries, the contours, the sight line to the sea, the terrain profile and the first sketch of the site plan."}
          </p>
        </div>
        {/* every map at its own size, never upscaled: the wide ones across the page with the words under them, the
            small ones beside their words, so no row is left half empty */}
        <div className="grid gap-5">
          {MAP_ORDER.map((k) => {
            const m = MAP[k];
            const wide = m.w > 800;
            return (
              <figure key={k} className={`panel overflow-hidden grid ${wide ? "" : "md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"}`}>
                <div className="bg-bg-2 grid place-items-center p-3 md:p-5">
                  <Image src={m.src} alt={m.alt[locale]} width={m.w} height={m.h} sizes={wide ? "(max-width: 1440px) 100vw, 1360px" : "(max-width: 768px) 100vw, 720px"} quality={92} unoptimized={m.w < 900} className="block max-w-full h-auto rounded-[6px]" />
                </div>
                <figcaption className={`p-5 md:p-7 ${wide ? "grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] md:gap-10" : "self-center"}`}>
                  <div>
                    <h3 className="display text-[26px]">{m.title[locale]}</h3>
                    <p className="provenance mt-2">{m.credit[locale]}</p>
                  </div>
                  <p className={`${wide ? "" : "mt-3"} text-[15.5px] text-ink-2 max-w-[70ch]`}>{m.text[locale]} <Src id={m.source} locale={locale} /></p>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      <section id="bilder" className="wrap section scroll-mt-24" aria-labelledby="bilder-h">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] items-end mb-8">
          <h2 id="bilder-h" className="display text-[clamp(34px,4.6vw,64px)] max-w-[12ch]">{no ? "Bilder" : "Photos"}</h2>
          <p className="lede max-w-[46ch] md:justify-self-end">
            {no
              ? <>Vigeland ligger noen få kilometer nordøst for feltet, der Audna møter E39. Tettstedet hadde {nb(FACT.vigeland_pop)} innbyggere i {FACT.vigeland_pop_year} og var kommunesenter fram til 2020. <Src id="vigeland" locale={locale} /> Fylkesvei 460 går sørover herfra, gjennom Spangereid til Lindesnes fyr. <Src id="fv460" locale={locale} /></>
              : <>Vigeland is a few kilometres north-east of the field, where the Audna meets the E39. The village had {nb(FACT.vigeland_pop)} inhabitants in {FACT.vigeland_pop_year} and was the municipal centre until 2020. <Src id="vigeland" locale={locale} /> County road 460 runs south from here, through Spangereid to Lindesnes lighthouse. <Src id="fv460" locale={locale} /></>}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {AREA.map(({ key: k, wide }) => {
            const p = PHOTO[k];
            const credit = photoCredit(p);
            return (
              <figure key={k} className={`frame ${wide ? "md:col-span-2" : ""}`}>
                <Image src={p.src} alt={p.alt[locale]} width={p.w} height={p.h} sizes={wide ? "(max-width: 768px) 100vw, 1360px" : "(max-width: 768px) 100vw, 680px"} quality={85} className={`w-full object-cover ${wide ? "aspect-[21/9]" : "aspect-[3/2]"}`} />
                <figcaption className="provenance px-4 py-3">
                  {p.caption[locale]}. {no ? "Foto" : "Photo"}: {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{credit}</a> : credit}, {p.license[locale]}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>
    </>
  );
}
