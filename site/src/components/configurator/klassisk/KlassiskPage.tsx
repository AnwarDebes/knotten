/**
 * The Klassisk configurator page, in either language: the page head with its breadcrumb, then the configurator.
 * The route (/konfigurator) passes "no" today; an English Klassisk route can pass "en" without changes here.
 */
import PageHead from "@/components/klassisk/PageHead";
import type { Lang } from "@/lib/configurator/types";
import { initialFrom, loadConfiguratorData } from "../data.server";
import { copy } from "../text";
import KlassiskConfigurator from "./KlassiskConfigurator";

export default async function KlassiskPage({ locale, search }: { locale: Lang; search: Record<string, string | string[] | undefined> }) {
  const t = copy(locale);
  const data = await loadConfiguratorData();
  const initial = initialFrom(search, data);
  return (
    <>
      <PageHead title={t.title} crumb={t.crumb}>
        <p>{t.lede}</p>
      </PageHead>
      <KlassiskConfigurator locale={locale} data={data} initial={initial} />
    </>
  );
}

/** The page's title and description in either language. */
export function klassiskMeta(locale: Lang) {
  return locale === "no"
    ? { title: "Sett sammen huset", description: "Velg tomt og si hvordan du vil ha huset: planløsning, fasade, energi, interiør og uteområder. Energitallene regnes for huset på tomten. Foreløpig, en illustrasjon og ikke et tilbud." }
    : { title: "Configure your house", description: "Choose a plot and say how you would like the house: plan, facade, energy, interior and outdoors. The energy figures are worked out for the house on its plot. Provisional, an illustration and not an offer." };
}
