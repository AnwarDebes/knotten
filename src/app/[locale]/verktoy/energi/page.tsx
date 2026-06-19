import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { EnergyCalculator } from "@/components/tools/energy-calculator";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "energiKalkulator", "/verktoy/energi");
}

export default async function EnergiKalkulatorPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("energiKalkulator");

  return (
    <main id="main-content" className="flex-1">
      <section className="bg-secondary/30 border-b">
        <div className="mx-auto w-full max-w-3xl px-6 py-16">
          <p className="text-sea mb-3 text-sm font-medium tracking-wide uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-foreground mt-4 max-w-prose text-lg leading-8">{t("lead")}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <EnergyCalculator />
      </section>

      <MeldInteresseCta />
    </main>
  );
}
