import Image from "next/image";
import Link from "next/link";
import { PHOTOS } from "@/lib/klassisk/photos";
import { kHref } from "@/lib/klassisk/locale";
import { homeFacts } from "@/lib/content/home";
import { FACT, type Lang } from "@/lib/facts";
import { Src } from "./Source";
import CountUp from "./CountUp";

/** What the hero says, in both languages (the photos' credits are the same in both). */
const TEXT = {
  no: {
    kicker: "Rødberg i Lindesnes, ved Audna elvas utløp",
    h1: "Et boligfelt som ser havet, og som skal klare seg mest mulig selv.",
    lede: `Rundt ${FACT.plots} tomter på Knotten, i rekker oppover en skogkledd knaus over Sniksfjorden. Ønsket er sjøutsikt fra alle tomtene, men det er ikke sikkert at det går fra alle. Feltet planlegges fra første dag med lavt energibehov, egen energiproduksjon, lagring og robusthet ved strømbrudd. Alle tall vi viser kan spores til sin kilde.`,
    plots: "Se tomtene",
    interest: "Meld interesse",
    pin: "Sikt mot åpent hav",
    caption: "Utsikten mot Sniksfjorden, fra nabotomten litt nedenfor feltet",
    alt: { view: PHOTOS.view.alt, sniksfjorden: PHOTOS.sniksfjorden.alt, spangereid: PHOTOS.spangereid.alt },
    credit: "Små bilder: Rolfsteinar (CC BY-SA 3.0) og Flums (CC BY-SA 4.0), Wikimedia Commons",
    source: "Kilde",
  },
  en: {
    kicker: "Rødberg in Lindesnes, at the mouth of the Audna",
    h1: "Homes facing the sea, built to look after themselves as far as possible.",
    lede: `About ${FACT.plots} plots on Knotten, in rows up a wooded knoll above Sniksfjorden. The aim is a sea view from every plot, but it is not certain every plot will get one. From the first day the field is planned for low energy demand, its own energy production, storage and resilience in a power cut. Every figure we show can be traced to its source.`,
    plots: "See the plots",
    interest: "Register interest",
    pin: "View to open sea",
    caption: "The view towards Sniksfjorden, from the neighbouring plot a little below the field",
    alt: {
      view: "The view from Knotten towards Sniksfjorden and the sea, photographed from the neighbouring plot",
      sniksfjorden: "Sniksfjorden seen from the high ground at Snig, out towards the sea",
      spangereid: "Spangereid from the air, with the fjord, the beach and the canal",
    },
    credit: "Small photos: Rolfsteinar (CC BY-SA 3.0) and Flums (CC BY-SA 4.0), Wikimedia Commons",
    source: "Source",
  },
} as const;

/**
 * Hero: text left, the real view photo right at its native resolution (never upscaled), with the two summer photos
 * tucked in as small cards, and the four facts under it. In the page's language: Norwegian at /, English at /english.
 */
export default function Hero({ status, locale = "no" }: { status?: React.ReactNode; locale?: Lang }) {
  const T = TEXT[locale];
  const v = PHOTOS.view;
  const s1 = PHOTOS.sniksfjorden;
  return (
    <section className="hero2" id="hero" data-journey="hero">
      <div className="wrap hero2-grid">
        <div className="hero2-text">
          <div className="kicker rise">{T.kicker}</div>
          <h1 className="rise d1">{T.h1}</h1>
          {status}
          <p className="lede rise d2">{T.lede}</p>
          <div className="cta-row rise d3">
            <Link className="btn" href={kHref("/tomtene", locale)}>{T.plots}</Link>
            <Link className="btn ghost" href={kHref("/kontakt", locale)}>{T.interest}</Link>
          </div>
        </div>
        <div className="hero2-media rise d1">
          <figure className="hero2-main">
            <Image src={v.src} alt={T.alt.view} width={v.w} height={v.h} priority sizes="(max-width: 900px) 100vw, 46vw" quality={88} />
            <div className="pin" style={{ left: "60%", top: "34%" }}><i />{T.pin}</div>
            <figcaption>{T.caption} <Src id="foto" label={T.source} /></figcaption>
          </figure>
          <figure className="hero2-small a"><Image src={s1.src} alt={T.alt.sniksfjorden} width={s1.w} height={s1.h} sizes="260px" quality={88} /><figcaption>Sniksfjorden</figcaption></figure>
          <figure className="hero2-small b"><Image src="/img/spangereid-card.jpg" alt={T.alt.spangereid} width={720} height={886} sizes="200px" quality={88} /><figcaption>Spangereid</figcaption></figure>
          <p className="hero2-credit small">{T.credit}</p>
        </div>
      </div>
      <div className="wrap">
        <div className="facts">
          {homeFacts(locale).map((f) => (
            <div key={f.src} className="fact">
              {f.count ? <CountUp value={f.count.value} prefix={f.count.prefix} suffix={f.count.suffix} locale={locale} /> : <b>{f.big}</b>}
              <span>{f.text} <Src id={f.src} label={T.source} /></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
