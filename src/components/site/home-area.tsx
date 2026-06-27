import { getTranslations } from "next-intl/server";
import { SectionHead, ArrowLink } from "@/components/site/primitives";

/**
 * Bridge from the hero's 2D section to the interactive 3D terrain on the area
 * page. Uses the real terrain render (the same Kartverket model), tuned cooler
 * to sit in the palette, and kept honest with the Kartverket attribution.
 */
async function HomeAreaTeaser() {
  const t = await getTranslations("home.areaTeaser");
  const terrain = await getTranslations("terrain");

  return (
    <section className="section-dark">
      <div className="mx-auto grid w-full max-w-6xl gap-x-16 gap-y-12 px-6 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHead
            tone="dark"
            eyebrow={t("eyebrow")}
            title={t("title")}
            lead={t("body")}
            elevation={120}
          />
          <div className="mt-8">
            <ArrowLink tone="dark" href="/omradet">
              {t("cta")}
            </ArrowLink>
          </div>
        </div>

        <figure className="relative aspect-[16/11] overflow-hidden rounded-[2px] ring-1 ring-[rgba(190,209,205,0.2)]">
          {/* A plain img keeps the next/image client runtime off the
              budget-critical home route. The image is below the fold and lazy,
              and the fixed-aspect figure reserves its box, so there is no CLS. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/terrain/fallback.jpg"
            alt={terrain("imageAlt")}
            width={1600}
            height={1100}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover [filter:saturate(0.82)]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[#0a1f27]/70 via-transparent to-transparent"
          />
          <figcaption className="absolute right-4 bottom-3 left-4 text-[0.7rem] text-white/75">
            {terrain("attribution")}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export { HomeAreaTeaser };
