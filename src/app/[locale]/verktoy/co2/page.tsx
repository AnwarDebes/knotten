import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { PageHero } from "@/components/site/page-hero";
import { Co2Tool } from "@/components/tools/co2-tool";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "co2", "/verktoy/co2");
}

export default async function Co2Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("co2");

  return (
    <main id="main-content" className="flex-1">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <Co2Tool />
      </section>

      <MeldInteresseCta />
    </main>
  );
}
