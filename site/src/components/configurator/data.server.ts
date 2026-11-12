/**
 * What both configurator pages read on the server: the plots, which of them have room for a lower floor, the
 * administrator's status and price per plot and the release note. The administrator's own note per plot stays on
 * the server; the page only gets status and price.
 */
import { loadCommercial, loadPlots, loadSettings } from "@/lib/data";
import { loadPlotFacts } from "@/lib/configurator/plots.server";
import { readAddress, startStep, type Commercial, type ConfiguratorData, type Initial } from "./model";

export async function loadConfiguratorData(): Promise<ConfiguratorData> {
  const [{ plots }, com, settings, facts] = await Promise.all([loadPlots(), loadCommercial(), loadSettings(), loadPlotFacts()]);
  const commercial: Commercial = {};
  for (const p of plots) {
    const c = com[p.id];
    commercial[p.id] = { status: c?.status ?? "unreleased", price_nok: typeof c?.price_nok === "number" && Number.isFinite(c.price_nok) ? c.price_nok : null };
  }
  return { plots, facts, commercial, releaseNote: settings.release_note };
}

/** The house and the step the address asks for (a shared link, a plot page's button, a reload). */
export function initialFrom(search: Record<string, string | string[] | undefined>, data: ConfiguratorData): Initial {
  const { cfg, step, hasConfig } = readAddress(search, data.facts);
  return { cfg, step: startStep(cfg, step), fromAddress: hasConfig || !!step };
}
