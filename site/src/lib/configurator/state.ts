/**
 * The configurator's state: defaults, cleaning, the shareable link and the summary rows.
 * Pure functions, no React, no Node: the pages, the 3D preview, the API routes and the tests all use them.
 */
import { OPTIONS, OPTION_BY_ID, STEPS } from "./catalog";
import type { Choice, HouseConfig, Lang, OptionDef, PriceTable, SummaryRow } from "./types";

export const EMPTY: HouseConfig = { v: 1, plot: null, sel: {} };

/** Plot facts the rules need. lowerFloor comes from public/twin/houses.json (18 of 30 houses have one). */
export type PlotFacts = { id: string; index: number; lowerFloor: boolean };

const PLOT_ID = /^plot-\d{2}$/;

export function standardChoice(o: OptionDef): Choice {
  return o.choices.find((c) => c.standard) ?? o.choices[0];
}

/** True when this choice can be picked on that plot. */
export function allowed(c: Choice, plot: PlotFacts | null): boolean {
  if (c.needs === "lowerFloorPlot") return !!plot?.lowerFloor;
  return true;
}

/** The choice in effect for an option (the standard one unless the buyer picked another that is allowed). */
export function chosen(cfg: HouseConfig, optionId: string, plot: PlotFacts | null = null): Choice {
  const o = OPTION_BY_ID[optionId];
  if (!o) throw new Error(`unknown option ${optionId}`);
  const id = cfg.sel[optionId];
  const c = id ? o.choices.find((x) => x.id === id) : undefined;
  return c && allowed(c, plot) ? c : standardChoice(o);
}

/** Drops unknown options and choices, choices the plot cannot take, and standard picks (they are the default). */
export function normalize(cfg: Partial<HouseConfig> | null | undefined, plot: PlotFacts | null = null): HouseConfig {
  const out: HouseConfig = { v: 1, plot: null, sel: {} };
  if (!cfg) return out;
  if (typeof cfg.plot === "string" && PLOT_ID.test(cfg.plot)) out.plot = cfg.plot;
  const sel = cfg.sel && typeof cfg.sel === "object" ? cfg.sel : {};
  for (const [k, v] of Object.entries(sel)) {
    const o = OPTION_BY_ID[k];
    if (!o || typeof v !== "string") continue;
    const c = o.choices.find((x) => x.id === v);
    if (!c || c.standard || !allowed(c, plot)) continue;
    out.sel[k] = v;
  }
  return out;
}

/** Every option's choice id, standard ones included (what the 3D preview and the energy model read). */
export function resolved(cfg: HouseConfig, plot: PlotFacts | null = null): Record<string, Choice> {
  const out: Record<string, Choice> = {};
  for (const o of OPTIONS) out[o.id] = chosen(cfg, o.id, plot);
  return out;
}

/** Shareable link: ?tomt=07&fasade-farge=fjordbla&... Only the plot and non-standard picks, so links stay short. */
export function toSearch(cfg: HouseConfig): string {
  const p = new URLSearchParams();
  if (cfg.plot) p.set("tomt", cfg.plot.slice(5));
  for (const o of OPTIONS) {
    const v = cfg.sel[o.id];
    if (v) p.set(o.id, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function fromSearch(search: string | URLSearchParams | Record<string, string | string[] | undefined>, plot: PlotFacts | null = null): HouseConfig {
  const get = (k: string): string | undefined => {
    if (search instanceof URLSearchParams) return search.get(k) ?? undefined;
    if (typeof search === "string") return new URLSearchParams(search).get(k) ?? undefined;
    const v = search[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const t = get("tomt");
  const sel: Record<string, string> = {};
  for (const o of OPTIONS) {
    const v = get(o.id);
    if (v) sel[o.id] = v;
  }
  return normalize({ v: 1, plot: t && /^\d{1,2}$/.test(t) ? `plot-${t.padStart(2, "0")}` : null, sel }, plot);
}

/** Price of one choice: 0 when standard, the administrator's figure, or null (on request). */
export function priceOf(prices: PriceTable, optionId: string, c: Choice): number | null {
  if (c.standard) return 0;
  const v = prices[`${optionId}:${c.id}`];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** The summary, step by step, in the given language. */
export function summary(cfg: HouseConfig, lang: Lang, prices: PriceTable = {}, plot: PlotFacts | null = null): SummaryRow[] {
  const rows: SummaryRow[] = [];
  for (const s of STEPS) {
    for (const o of OPTIONS.filter((x) => x.step === s.id)) {
      const c = chosen(cfg, o.id, plot);
      rows.push({ step: s.id, option: o.id, choice: c.id, optionLabel: o.label[lang], choiceLabel: c.label[lang], standard: !!c.standard, price: priceOf(prices, o.id, c) });
    }
  }
  return rows;
}

/** Sum of the known prices, and whether any part is still on request. */
export function totals(rows: SummaryRow[], prices: PriceTable, plotPrice: number | null | undefined) {
  const base = prices["house:base"];
  let known = 0;
  let open = false;
  for (const r of rows) {
    if (r.price === null) open = true;
    else known += r.price;
  }
  if (typeof base === "number") known += base;
  else open = true;
  if (typeof plotPrice === "number") known += plotPrice;
  else open = true;
  return { known, open };
}
