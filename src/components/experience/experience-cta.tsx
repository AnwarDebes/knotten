import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * The headline doorway into the immersive 3D experience: a large, deliberately
 * eye-catching, cool-toned banner that drops the visitor straight into the
 * walkable simulation. Styled by .exp-cta in globals.css; reduced-motion is
 * honoured by the global rule there.
 */
export async function ExperienceCta() {
  const t = await getTranslations("opplev");

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link
        href="/opplev"
        className="exp-cta group focus-visible:ring-ring relative block overflow-hidden rounded-2xl px-8 py-10 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:px-12 md:py-14"
      >
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#7fd6df] uppercase">
              {t("eyebrow")}
            </p>
            <p className="font-display max-w-2xl text-2xl leading-tight text-white md:text-4xl">
              {t("ctaCard.title")}
            </p>
            <p className="max-w-xl text-sm text-white/80 md:text-base">{t("ctaCard.body")}</p>
          </div>
          <span className="exp-cta-btn inline-flex items-center gap-2 self-start rounded-full bg-[#16c2d4] px-6 py-3 text-base font-semibold whitespace-nowrap text-[#06222b] transition-transform group-hover:scale-[1.04] md:self-auto">
            {t("ctaCard.cta")} <span aria-hidden="true">&rarr;</span>
          </span>
        </div>
      </Link>
    </section>
  );
}
