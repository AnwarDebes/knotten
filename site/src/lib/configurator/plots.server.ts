import { plotIndex } from "./palette";
import type { PlotFacts } from "./state";
// imported, not read from disk: next.config.ts keeps public/twin out of the server bundles
import housesFile from "../../../public/twin/houses.json";

/**
 * The plot facts the configurator's rules need, read on the server from the model's own data:
 * public/twin/houses.json says which of the 30 houses have a lower floor (18 of them).
 */
let cache: Record<string, PlotFacts> | null = null;

export async function loadPlotFacts(): Promise<Record<string, PlotFacts>> {
  if (cache) return cache;
  const { houses } = housesFile as { houses: { id: string; lower: boolean }[] };
  const out: Record<string, PlotFacts> = {};
  for (const h of houses) out[h.id] = { id: h.id, index: plotIndex(h.id), lowerFloor: !!h.lower };
  cache = out;
  return out;
}
