import { promises as fs } from "fs";
import path from "path";
import type { PlotsFile, Plot } from "./types";
import type { NewsItem, PublicSettings } from "./store";
import { readPublicPlots, readPublicSettings, readPublishedNews } from "./server/publicRecords";
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

/** A plot's status and price as the administrator set them, with the model's house on it. */
export type PlotCommercial = { id: string; status: "available" | "reserved" | "sold" | "unreleased"; price_nok?: number; house_type: { no: string; en: string } };

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

/**
 * Status and price per plot, as the administrator set them; unreleased until then. The administrator's note on a
 * plot is for the portal only (it may name a buyer) and is not part of this. Like the news and the settings below,
 * this is read through the public pages' cache (lib/server/publicRecords.ts): a change in the admin shows on the
 * next page load, and the pages render even when storage does not answer.
 */
export async function loadCommercial(): Promise<Record<string, PlotCommercial>> {
  const [{ plots }, set] = await Promise.all([loadPlots(), readPublicPlots()]);
  const out: Record<string, PlotCommercial> = {};
  for (const p of plots) {
    const s = set[p.id];
    out[p.id] = { id: p.id, status: s?.status ?? "unreleased", price_nok: s?.price_nok, house_type: houseLabel(p) };
  }
  return out;
}

/** Published news, newest first. */
export async function loadNews(): Promise<NewsItem[]> {
  return readPublishedNews();
}

/** The settings a public page shows: the status line and the company facts. */
export async function loadSettings(): Promise<PublicSettings> {
  return readPublicSettings();
}

export { fmtHours, sunLabel } from "./format";
