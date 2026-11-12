import { promises as fs } from "fs";
import path from "path";
import type { PlotsFile, Plot } from "./types";
import { readStore } from "./store";
// read at build time: the server bundles leave public/twin out (next.config.ts)
import HOUSES from "../../public/twin/houses.json";

const PUBLIC = path.join(process.cwd(), "public");

let plotsCache: PlotsFile | null = null;

export async function loadPlots(): Promise<PlotsFile> {
  if (plotsCache) return plotsCache;
  const raw = await fs.readFile(path.join(PUBLIC, "data", "plots.json"), "utf-8");
  plotsCache = JSON.parse(raw) as PlotsFile;
  return plotsCache;
}

export async function loadPlot(id: string): Promise<Plot | undefined> {
  const { plots } = await loadPlots();
  return plots.find((p) => p.id === id);
}

/** Plot status/price overlay. In production this is the `plot` table; here a small JSON. */
export type PlotCommercial = { id: string; status: "available" | "reserved" | "sold" | "unreleased"; price_nok?: number; note?: string; house_type: { no: string; en: string } };

/** Which of the model's example houses have a lower floor under the view side (public/twin/houses.json). */
const LOWER = new Set((HOUSES as { houses: { id: string; lower?: boolean }[] }).houses.filter((h) => h.lower).map((h) => h.id));

/**
 * The model's example house on a plot, as the 3D shows it: one floor, and a lower floor under the view side where
 * the ground in front lies low enough. An illustration of one house type, not a design.
 */
export function houseLabel(p: Plot): { no: string; en: string } {
  if (p.zone === "flat") return { no: "Modell: 1 etasje, flaten", en: "Model: one floor, the flat" };
  return LOWER.has(p.id) ? { no: "Modell: 1 etasje og underetasje", en: "Model: one floor and a lower floor" } : { no: "Modell: 1 etasje", en: "Model: one floor" };
}

/** Status, price and note per plot, as the administrator set them; unreleased until then. */
export async function loadCommercial(): Promise<Record<string, PlotCommercial>> {
  const { plots } = await loadPlots();
  const store = await readStore();
  const out: Record<string, PlotCommercial> = {};
  for (const p of plots) {
    const s = store.plots[p.id];
    out[p.id] = { id: p.id, status: s?.status ?? "unreleased", price_nok: s?.price_nok, note: s?.note, house_type: houseLabel(p) };
  }
  return out;
}

/** Published news, newest first. */
export async function loadNews() {
  const store = await readStore();
  return store.news.filter((n) => n.published).sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadSettings() {
  return (await readStore()).settings;
}

export { fmtHours, sunLabel } from "./format";
