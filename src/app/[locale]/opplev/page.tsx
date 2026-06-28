import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { Disclaimer } from "@/components/primitives/disclaimer";
import { ExperienceLauncher } from "@/components/experience/experience-launcher";
import { ExperienceTitle } from "@/components/experience/experience-title";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = await buildPageMetadata(locale, "opplev", "/opplev");
  // A baked still of the experience, so a shared link previews the 3D walk.
  const poster = { url: "/experience/poster.jpg", width: 1200, height: 630 };
  return {
    ...meta,
    openGraph: { ...meta.openGraph, images: [poster] },
    twitter: { card: "summary_large_image", images: [poster.url] },
  };
}

export default async function OpplevPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("opplev");

  return (
    <main id="main-content" className="flex-1">
      {/* The 3D experience fills the viewport and enters automatically; no click. */}
      <section className="relative h-[92svh] min-h-[520px] w-full overflow-hidden bg-[#0b1722]">
        <ExperienceLauncher />
        <ExperienceTitle eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
      </section>

      {/* Context, honesty and attribution below the experience (also the SEO and
          no-WebGL baseline). */}
      <section className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-12 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">
            {t("realHeading")}
          </h2>
          <p className="text-foreground leading-7">{t("realBody")}</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">
            {t("indicativeHeading")}
          </h2>
          <Disclaimer>{t("indicativeBody")}</Disclaimer>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-10">
        <p className="text-muted-foreground text-xs">{t("attribution")}</p>
      </section>

      <MeldInteresseCta />
    </main>
  );
}
