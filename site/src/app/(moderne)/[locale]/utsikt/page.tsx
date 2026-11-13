import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import ProofSlider from "@/components/ui/ProofSlider";
import { Figure } from "@/components/ui/Provenance";
import { assumption } from "@/lib/facts";
import { PHOTO, VIEW_PHOTOS, photoCredit } from "@/lib/content/photos";
import { pageMeta } from "@/lib/meta";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export const generateMetadata = pageMeta("/utsikt", {
  no: { title: "Utsikten", description: "Fra Knotten går blikket sørover langs Audna, ut Sniksfjorden og videre til åpent hav, regnet ut fra terrenget i hver grad rundt horisonten." },
  en: { title: "The view", description: "From Knotten the eye runs south along the Audna, out Sniksfjorden and on to open sea, computed from the terrain in every degree around the horizon." },
});

export default async function View({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const no = locale === "no";
  return (
    <>
      <Nav locale={locale} />
      <PageHead
        title={no ? "Utsikten" : "The view"}
        lede={no
          ? "Fra Knotten går blikket sørover langs Audna, ut Sniksfjorden og videre til åpent hav. Det er ikke et løfte, det er en siktlinje, regnet ut fra terrenget i hver grad rundt horisonten."
          : "From Knotten the eye runs south along the Audna, out Sniksfjorden and on to open sea. That is not a promise, it is a sight line, computed from the terrain in every degree around the horizon."}
      />
      <section className="wrap pb-12">
        {/* the project owner's photos of the view (src/lib/content/photos.ts, the same as the Klassisk photos page) */}
        <div className="grid gap-4 md:grid-cols-3">
          {VIEW_PHOTOS.map((k, i) => {
            const p = PHOTO[k];
            return (
              <figure key={k} className={`frame ${i === 0 ? "md:col-span-3" : ""}`}>
                <Image src={p.src} alt={p.alt[locale]} width={p.w} height={p.h} sizes={i === 0 ? "(max-width: 768px) 100vw, 1360px" : "(max-width: 768px) 100vw, 460px"} quality={85} priority={i === 0} className={`w-full object-cover ${i === 0 ? "aspect-[21/9]" : "aspect-[4/3]"}`} />
                <figcaption className="provenance px-4 py-3">{p.caption[locale]}. {no ? "Foto" : "Photo"}: {photoCredit(p)}</figcaption>
              </figure>
            );
          })}
        </div>
      </section>
      <section className="wrap pb-16 grid gap-x-10 gap-y-12 sm:grid-cols-3">
        <Figure a={assumption("sea_corridor_deg")} locale={locale} />
        <Figure a={assumption("open_sea_plots")} locale={locale} />
        <Figure a={assumption("lokkeheia")} locale={locale} />
      </section>
      <section className="wrap section-tight">
        <div className="panel p-6 md:p-10 grid gap-10 lg:grid-cols-[1fr_1.4fr] items-center">
          <div>
            <h2 className="display text-[clamp(34px,4.5vw,60px)]">{no ? "Fotografi mot modell" : "Photograph against model"}</h2>
            <p className="lede mt-5 max-w-[44ch]">
              {no
                ? "Naboens grillbu ligger på kanten av åsen øst for feltet. Fotografiet derfra viser gården, elvesvingen og fjorden. Modellkameraet står på samme punkt. Dra i skillet."
                : "The neighbour's grill hut sits on the edge of the hill east of the field. The photograph from there shows the farm, the river bend and the fjord. The model camera stands on the same point. Drag the divider."}
            </p>
          </div>
          <ProofSlider photo={PHOTO.view.src} model="/renders/web/grillbu_photo_match.webp" labels={[no ? "Fotografi" : "Photograph", no ? "Modell" : "Model"]} />
        </div>
      </section>
      <section className="wrap section grid gap-12 lg:grid-cols-2 items-start">
        <div>
          <h2 className="display text-[clamp(30px,4vw,48px)]">{no ? "Siktkorridoren" : "The sight corridor"}</h2>
          <p className="mt-4 text-[16px] max-w-[52ch] text-bone-2">
            {no
              ? "Hver stripe er én grad. Mørk blå: siktlinjen når vann lenger unna enn 7 km, altså åpent hav. Fra det høyeste punktet på eiendommen, i stuehøyde, er korridoren 164 til 189 grader (beregnet)."
              : "Each stripe is one degree. Dark blue: the sight line reaches water beyond 7 km, which is open sea. From the highest point of the property, at living-room height, the corridor is 164 to 189 degrees (computed)."}
          </p>
          <Image src="/renders/sightline_panorama.png" alt={no ? "Siktpanorama fra det høyeste punktet på eiendommen: én stripe per grad, mørk blå der siktlinjen når åpent hav" : "Sight line panorama from the highest point of the property: one stripe per degree, dark blue where the sight line reaches open sea"} width={905} height={270} unoptimized className="w-full h-auto mt-6 rounded-[var(--radius)] bg-bone" />
          <p className="provenance mt-2.5">{no ? "Kartverket DTM 1 m, terrarium 20 og 80 m, refraksjon k = 1,17. Beregnet 2026-09-05." : "Kartverket DTM 1 m, terrarium 20 and 80 m, refraction k = 1.17. Computed 2026-09-05."}</p>
        </div>
        <figure className="frame">
          <Image src="/renders/web/knotten_view_model.webp" alt={no ? "Modellens utsikt sørover fra det høyeste punktet på eiendommen, over det ryddede feltet mot fjorden" : "The model's view south from the highest point of the property, over the cleared field towards the fjord"} width={1320} height={880} sizes="(max-width: 1024px) 100vw, 680px" quality={90} className="w-full h-auto" />
          <figcaption className="provenance px-4 py-3">{no ? "Fra det høyeste punktet på eiendommen, 5 m over bakken, retning 174 grader, feltet ryddet." : "From the highest point of the property, 5 m above ground, bearing 174 degrees, field cleared."}</figcaption>
        </figure>
      </section>
    </>
  );
}
