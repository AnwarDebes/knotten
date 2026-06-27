import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { PageHero } from "@/components/site/page-hero";
import { ConfiguratorTool } from "@/components/tools/configurator-tool";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "konfigurator", "/verktoy/konfigurator");
}

export default async function KonfiguratorPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("konfigurator");

  return (
    <main id="main-content" className="flex-1">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <ConfiguratorTool />
      </section>

      <MeldInteresseCta />
    </main>
  );
}
