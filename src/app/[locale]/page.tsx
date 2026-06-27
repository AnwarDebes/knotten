import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { HomeHero } from "@/components/site/home-hero";
import { HomePlace } from "@/components/site/home-place";
import { HomePillars } from "@/components/site/home-pillars";
import { HomeMeasures } from "@/components/site/home-measures";
import { HomeEnergyTeaser } from "@/components/site/home-energy";
import { HomeAreaTeaser } from "@/components/site/home-area";
import { HomeToolsTeaser } from "@/components/site/home-tools";
import { HomeProgress } from "@/components/site/home-progress";
import { HomeDeveloper } from "@/components/site/home-developer";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { ExperienceCta } from "@/components/experience/experience-cta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = getPathname({ href: "/", locale: l });
  languages["x-default"] = getPathname({ href: "/", locale: routing.defaultLocale });
  return {
    alternates: { canonical: getPathname({ href: "/", locale: locale as Locale }), languages },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main id="main-content" className="flex-1">
      <HomeHero />
      <HomePlace />
      <HomePillars />
      <HomeMeasures />
      <HomeEnergyTeaser />
      <HomeAreaTeaser />
      <ExperienceCta />
      <HomeToolsTeaser />
      <HomeProgress />
      <HomeDeveloper />
      <MeldInteresseCta />
    </main>
  );
}
