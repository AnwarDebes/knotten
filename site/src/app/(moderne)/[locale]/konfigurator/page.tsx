import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import { pageMeta } from "@/lib/meta";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import ModerneConfigurator from "@/components/configurator/moderne/ModerneConfigurator";
import { initialFrom, loadConfiguratorData } from "@/components/configurator/data.server";
import { copy } from "@/components/configurator/text";

export const generateMetadata = pageMeta("/konfigurator", {
  no: { title: "Sett sammen huset", description: "Velg tomt og si hvordan du vil ha huset: planløsning, fasade, energi, interiør og uteområder. Energitallene regnes for huset på tomten. Foreløpig, en illustrasjon og ikke et tilbud." },
  en: { title: "Configure your house", description: "Choose a plot and say how you would like the house: plan, facade, energy, interior and outdoors. The energy figures are worked out for the house on its plot. Provisional, an illustration and not an offer." },
});

export default async function Konfigurator({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const t = copy(locale);
  const data = await loadConfiguratorData();
  const initial = initialFrom(await searchParams, data);
  return (
    <>
      <Nav locale={locale} />
      <PageHead title={t.title} lede={t.lede} />
      <ModerneConfigurator locale={locale} data={data} initial={initial} />
    </>
  );
}
