import { promises as fs } from "fs";
import path from "path";
import { plotIndex } from "./palette";
import type { PlotFacts } from "./state";

/**
 * The plot facts the configurator's rules need, read on the server from the model's own data:
 * public/twin/houses.json says which of the 30 houses have a lower floor (18 of them).
 */
let cache: Record<string, PlotFacts> | null = null;

export async function loadPlotFacts(): Promise<Record<string, PlotFacts>> {
  if (cache) return cache;
  const raw = await fs.readFile(path.join(process.cwd(), "public", "twin", "houses.json"), "utf-8");
  const { houses } = JSON.parse(raw) as { houses: { id: string; lower: boolean }[] };
  const out: Record<string, PlotFacts> = {};
  for (const h of houses) out[h.id] = { id: h.id, index: plotIndex(h.id), lowerFloor: !!h.lower };
  cache = out;
  return out;
}
