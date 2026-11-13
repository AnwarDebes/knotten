import Image from "next/image";
import Link from "next/link";
import PageHead from "@/components/klassisk/PageHead";
import Reveal from "@/components/klassisk/Reveal";
import { Src } from "@/components/klassisk/Source";
import { MAP, MAP_ORDER, MAPS_TITLE } from "@/lib/content/maps";
import { kHref, type KLocale } from "@/lib/klassisk/locale";

/**
 * "Kart og terreng" (/kart, /english/kart): the eight maps behind the plan in full size, with what each shows and
 * who made it. The same list as the map journeys and the maps on the Moderne area page (src/lib/content/maps.ts).
 */
export default function MapsPage({ locale }: { locale: KLocale }) {
  const en = locale === "en";
  return (
    <>
      <PageHead title={MAPS_TITLE[locale]} crumb={MAPS_TITLE[locale]} locale={locale}>
        <p>
          {en
            ? "The maps the project owner has based the plan on, and a terrain map made for the website, in full size: property boundaries, contours, the sight line to the sea, the terrain profile and the first sketch of the site plan."
            : "Kartene prosjekteier har lagt til grunn, og et terrengkart laget for nettsiden, i full størrelse. Eiendomsgrenser, høydekurver, siktlinjen til havet, terrengprofilen og den første skissen til situasjonsplan."}
        </p>
      </PageHead>
      <section className="sec" style={{ paddingTop: 32 }}>
        <div className="wrap mapgrid">
          {MAP_ORDER.map((k, n) => {
            const m = MAP[k];
            return (
              <Reveal key={k} as="figure" className={`mapfig${m.w > 800 ? " wide" : ""}`} delay={n * 40}>
                <div className="mapimg"><Image src={m.src} alt={m.alt[locale]} width={m.w} height={m.h} sizes={m.w > 800 ? "100vw" : "50vw"} quality={92} unoptimized={m.w < 900} /></div>
                <figcaption>
                  <h2>{m.title[locale]}</h2>
                  <p>{m.text[locale]} <Src id={m.source} label={en ? "Source" : "Kilde"} /></p>
                  <span className="small">{m.credit[locale]}</span>
                </figcaption>
              </Reveal>
            );
          })}
        </div>
        <div className="wrap cta-row">
          <Link className="btn ghost" href={kHref("/tomtene", locale)}>{en ? "The plots on the site plan" : "Tomtene på situasjonsplanen"}</Link>
          <Link className="btn ghost" href={kHref("/galleri", locale)}>{en ? "Photos of the view and the area" : "Bilder av utsikten og området"}</Link>
        </div>
      </section>
    </>
  );
}
