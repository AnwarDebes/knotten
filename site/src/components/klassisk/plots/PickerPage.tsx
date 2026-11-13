import PlotStage from "@/components/klassisk/PlotStage";
import { loadCommercial, loadPlots, loadSettings } from "@/lib/data";
import { plotSummary } from "@/lib/content/plots";
import type { KLocale } from "@/lib/klassisk/locale";

/**
 * The Klassisk plot picker (/tomtene, /english/tomtene): every plot with its measured sun and view, and the status,
 * price and release note the administrator set in the portal. A static page; the portal's changes refresh it.
 */
export default async function PickerPage({ locale }: { locale: KLocale }) {
  const [{ plots }, com, settings] = await Promise.all([loadPlots(), loadCommercial(), loadSettings()]);
  const list = plots.map((p) => plotSummary(p, com[p.id]));
  return <PlotStage plots={list} releaseNote={settings.release_note[locale]} locale={locale} />;
}
