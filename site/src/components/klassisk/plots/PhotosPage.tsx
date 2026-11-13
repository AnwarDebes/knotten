import Image from "next/image";
import Link from "next/link";
import PageHead from "@/components/klassisk/PageHead";
import Reveal from "@/components/klassisk/Reveal";
import ProofSlider from "@/components/ui/ProofSlider";
import { PHOTO, photoCredit, type PhotoKey } from "@/lib/content/photos";
import { assumption, fmt, type Assumption } from "@/lib/facts";
import { kHref, type KLocale } from "@/lib/klassisk/locale";

type Span = "g12" | "g6" | "g4";
const VIEW: { key: PhotoKey; span: Span }[] = [{ key: "view", span: "g12" }, { key: "view2", span: "g4" }, { key: "viewWide", span: "g4" }, { key: "summer", span: "g4" }];
const AREA: { key: PhotoKey; span: Span }[] = [{ key: "sniksfjorden", span: "g6" }, { key: "snig", span: "g6" }, { key: "audna", span: "g12" }, { key: "spangereid", span: "g6" }, { key: "vigeland", span: "g6" }];
const SIZES: Record<Span, string> = { g12: "(max-width: 1240px) 100vw, 1240px", g6: "(max-width: 820px) 100vw, 620px", g4: "(max-width: 820px) 100vw, 410px" };

function Gallery({ items, locale }: { items: { key: PhotoKey; span: Span }[]; locale: KLocale }) {
  const en = locale === "en";
  return (
    <Reveal className="gallery" stagger>
      {items.map(({ key, span }) => {
        const p = PHOTO[key];
        const credit = photoCredit(p);
        return (
          <figure key={key} className={span}>
            <Image src={p.src} alt={p.alt[locale]} width={p.w} height={p.h} sizes={SIZES[span]} quality={85} />
            <figcaption>
              {p.caption[locale]}. {en ? "Photo" : "Foto"}: {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{credit}</a> : credit}, {p.license[locale]}
            </figcaption>
          </figure>
        );
      })}
    </Reveal>
  );
}

/** One of the view's measured figures, set like the Klassisk number rows, with its source and how sure it is. */
function Figure({ a, locale }: { a: Assumption; locale: KLocale }) {
  return (
    <div>
      <b>{fmt(a.value, locale)}<small> {a.unit[locale]}</small></b>
      <span>{a.label[locale]}</span>
      <span className="small">{a.source[locale]}, {a.date}{a.provisional ? ` (${locale === "en" ? "provisional" : "foreløpig"})` : ""}</span>
    </div>
  );
}

/**
 * "Bilder" (/galleri, /english/galleri): the view from the field in the project owner's photos, the view's measured
 * figures, the photograph against the model, the sight corridor, and the photos of the area from Wikimedia Commons,
 * each with who took it and the licence. The same photos as the Moderne pages (src/lib/content/photos.ts).
 */
export default function PhotosPage({ locale }: { locale: KLocale }) {
  const en = locale === "en";
  const title = en ? "Photos" : "Bilder";
  return (
    <>
      <PageHead title={title} crumb={title} locale={locale}>
        <p>
          {en
            ? "The view from the field, the photograph set against the model, and the area around Sniksfjorden. The photos of the view were taken from the neighbouring plot, a little lower than the field; the photos of the fjord, Snig, Vigeland and the Audna were taken by others and shared under a free licence. Every photo says who took it."
            : "Utsikten fra feltet, fotografiet satt mot modellen, og området rundt Sniksfjorden. Bildene av utsikten er tatt fra nabotomten, litt lavere enn feltet; bildene av fjorden, Snig, Vigeland og Audna er tatt av andre og delt med fri lisens. Hvert bilde viser hvem som tok det."}
        </p>
      </PageHead>

      <section className="sec" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <Reveal className="stack" style={{ maxWidth: "68ch" }}>
            <div className="eyebrow">{en ? "The view" : "Utsikten"}</div>
            <h2>{en ? "From the field to the sea" : "Fra feltet mot havet"}</h2>
            <p className="lede">
              {en
                ? "From Knotten the eye runs south along the Audna, out Sniksfjorden and on to open sea. That is not a promise, it is a sight line, computed from the terrain in every degree around the horizon."
                : "Fra Knotten går blikket sørover langs Audna, ut Sniksfjorden og videre til åpent hav. Det er ikke et løfte, det er en siktlinje, regnet ut fra terrenget i hver grad rundt horisonten."}
            </p>
          </Reveal>
          <Gallery items={VIEW} locale={locale} />
          <div className="numrow pk-figs">
            <Figure a={assumption("sea_corridor_deg")} locale={locale} />
            <Figure a={assumption("open_sea_plots")} locale={locale} />
            <Figure a={assumption("lokkeheia")} locale={locale} />
          </div>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{en ? "From the neighbour's grill hut" : "Fra naboens grillbu"}</div>
            <h2>{en ? "Photograph against model" : "Fotografi mot modell"}</h2>
            <p className="lede">
              {en
                ? "The neighbour's grill hut sits on the edge of the hill east of the field. The photograph from there shows the farm, the river bend and the fjord. The model camera stands on the same point. Drag the divider, or use the arrow keys."
                : "Naboens grillbu ligger på kanten av åsen øst for feltet. Fotografiet derfra viser gården, elvesvingen og fjorden. Modellkameraet står på samme punkt. Dra i skillet, eller bruk piltastene."}
            </p>
          </Reveal>
          <Reveal delay={120}>
            <ProofSlider photo={PHOTO.view.src} model="/renders/web/grillbu_photo_match.webp" labels={[en ? "Photograph" : "Fotografi", en ? "Model" : "Modell"]} variant="klassisk" />
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{en ? "The sight line" : "Siktlinjen"}</div>
            <h2>{en ? "The sight corridor" : "Siktkorridoren"}</h2>
            <p>
              {en
                ? "Each stripe is one degree. Dark blue: the sight line reaches water beyond 7 km, which is open sea. From the highest point of the property, at living-room height, the corridor is 164 to 189 degrees (computed)."
                : "Hver stripe er én grad. Mørk blå: siktlinjen når vann lenger unna enn 7 km, altså åpent hav. Fra det høyeste punktet på eiendommen, i stuehøyde, er korridoren 164 til 189 grader (beregnet)."}
            </p>
            <figure className="fig pk-fig">
              <Image src="/renders/sightline_panorama.png" alt={en ? "Sight line panorama from the highest point of the property: one stripe per degree, dark blue where the sight line reaches open sea" : "Siktpanorama fra det høyeste punktet på eiendommen: én stripe per grad, mørk blå der siktlinjen når åpent hav"} width={905} height={270} unoptimized />
              <figcaption><span>{en ? "Kartverket DTM 1 m, terrarium 20 and 80 m, refraction k = 1.17. Computed 2026-09-05." : "Kartverket DTM 1 m, terrarium 20 og 80 m, refraksjon k = 1,17. Beregnet 2026-09-05."}</span></figcaption>
            </figure>
          </Reveal>
          <Reveal as="figure" className="fig pk-fig" delay={120}>
            <Image src="/renders/web/knotten_view_model.webp" alt={en ? "The model's view south from the highest point of the property, over the cleared field towards the fjord" : "Modellens utsikt sørover fra det høyeste punktet på eiendommen, over det ryddede feltet mot fjorden"} width={1320} height={880} sizes="(max-width: 900px) 100vw, 700px" quality={90} />
            <figcaption><span>{en ? "From the highest point of the property, 5 m above ground, bearing 174 degrees, field cleared. Model view." : "Fra det høyeste punktet på eiendommen, 5 m over bakken, retning 174 grader, feltet ryddet. Modellbilde."}</span></figcaption>
          </Reveal>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap">
          <Reveal className="stack" style={{ maxWidth: "68ch" }}>
            <div className="eyebrow">{en ? "The area" : "Området"}</div>
            <h2>{en ? "The fjord, the river and the villages around" : "Fjorden, elva og bygdene rundt"}</h2>
            <p className="lede">
              {en
                ? "Knotten lies near the mouth of the Audna, where the river meets Sniksfjorden at Snig. Vigeland is a few kilometres north-east, and county road 460 runs south through Spangereid to Lindesnes lighthouse."
                : "Knotten ligger nær Audna elvas utløp, der elva møter Sniksfjorden ved Snig. Vigeland ligger noen få kilometer nordøst, og fylkesvei 460 går sørover gjennom Spangereid til Lindesnes fyr."}
            </p>
          </Reveal>
          <Gallery items={AREA} locale={locale} />
          <div className="cta-row">
            <Link className="btn ghost" href={kHref("/kart", locale)}>{en ? "Maps and terrain" : "Kart og terreng"}</Link>
            <Link className="btn ghost" href={kHref("/tomtene", locale)}>{en ? "Plots" : "Tomtene"}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
