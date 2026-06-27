import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { PageHero } from "@/components/site/page-hero";
import { PriceResilienceTool } from "@/components/tools/price-resilience-tool";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "stromtrygghet", "/verktoy/strompris");
}

export default async function StromtrygghetPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("stromtrygghet");

  return (
    <main id="main-content" className="flex-1">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <PriceResilienceTool />
      </section>

      <MeldInteresseCta />
    </main>
  );
}
