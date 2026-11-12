/**
 * What the configurator pages of both designs share on top of lib/configurator: the steps as the pages show them
 * (the six catalogue steps and the summary), the plot cards, the address of a configuration, and the few rules the
 * pages need to explain a choice. No React and no Node here: the server pages and the client components of both
 * designs read it.
 */
import { OPTIONS, STEPS } from "@/lib/configurator/catalog";
import { FACADES, modelLook, plotIndex } from "@/lib/configurator/palette";
import { allowed, fromSearch, toSearch, type PlotFacts } from "@/lib/configurator/state";
import { STEP_ORDER, type Choice, type HouseConfig, type Lang, type OptionDef, type PricesResponse, type StepId, type T2 } from "@/lib/configurator/types";
import type { Plot } from "@/lib/types";

/** The catalogue's steps and, last, the summary. */
export type StepKey = StepId | "oppsummering";
export const STEP_KEYS: StepKey[] = [...STEP_ORDER, "oppsummering"];

const SUMMARY: { label: T2; intro: T2 } = {
  label: { no: "Oppsummering", en: "Summary" },
  intro: {
    no: "Valgene dine, med pris der den er satt. Del lenken, skriv ut, lagre eller send oppsettet til Sigve Simonsen AS.",
    en: "Your choices, with a price where one is set. Share the link, print, save or send the setup to Sigve Simonsen AS.",
  },
};

export function isStepKey(s: unknown): s is StepKey {
  return typeof s === "string" && (STEP_KEYS as string[]).includes(s);
}

export function stepLabel(step: StepKey, lang: Lang): string {
  if (step === "oppsummering") return SUMMARY.label[lang];
  return STEPS.find((s) => s.id === step)?.label[lang] ?? step;
}

export function stepIntro(step: StepKey, lang: Lang): string {
  if (step === "oppsummering") return SUMMARY.intro[lang];
  return STEPS.find((s) => s.id === step)?.intro[lang] ?? "";
}

/** The options of one catalogue step, in catalogue order. */
export function optionsOf(step: StepKey): OptionDef[] {
  return OPTIONS.filter((o) => o.step === step);
}

/** False when no choice of the option fits the plot (the lower floor on a plot without room for one, or no plot yet). */
export function applicable(o: OptionDef, facts: PlotFacts | null): boolean {
  return o.choices.some((c) => allowed(c, facts));
}

/** The colour a choice is shown with: its own swatch, the house's own colour in the model, or none. */
export type Swatch = { hex: string } | { mix: readonly string[] } | null;

export function swatchOf(o: OptionDef, c: Choice, plotId: string | null): Swatch {
  if (c.swatch) return { hex: c.swatch };
  // "as in the model" for the facade: each house wears its own colour, so the plot decides it
  if (o.id === "farge" && c.id === "modell") {
    const i = plotIndex(plotId);
    return i >= 0 ? { hex: modelLook(i).facade } : { mix: FACADES };
  }
  return null;
}

/** The facade the model gives a plot's house, by name ("Kull" on plot 1). */
export function modelFacadeName(plotId: string | null, lang: Lang): string | null {
  const i = plotIndex(plotId);
  return i >= 0 ? modelLook(i).facadeName[lang] : null;
}

// ------------------------------------------------------------------------------------------------ data from the server

export type PlotStatus = PricesResponse["plots"][string]["status"];

/** Status and price per plot as the administrator set them (the internal note per plot never leaves the server). */
export type Commercial = Record<string, { status: PlotStatus; price_nok: number | null }>;

/** Everything a configurator page needs from the server, the same in both designs. */
export type ConfiguratorData = {
  /** Every plot from public/data/plots.json: the 3D view places the house with them, the energy estimate reads the roof and the horizon. */
  plots: Plot[];
  /** Which plots have room for a lower floor in the model. */
  facts: Record<string, PlotFacts>;
  commercial: Commercial;
  /** The administrator's line about when the plots are released, shown where a plot has no price. */
  releaseNote: T2;
};

/** What a plot card shows: the measured facts and the administrator's status and price. */
export type PlotCard = {
  id: string;
  /** 7 for plot-07. */
  n: number;
  row: string;
  elevation: number;
  sunDec: number;
  sunDecPossible: number;
  seaDeg: number;
  openSea: boolean;
  openSeaDeg: number;
  lowerFloor: boolean;
  status: PlotStatus;
  price: number | null;
};

export function plotCards(data: ConfiguratorData, live: PricesResponse["plots"] | null): PlotCard[] {
  return data.plots.map((p) => {
    const set = live?.[p.id] ?? data.commercial[p.id];
    const price = set && typeof set.price_nok === "number" && Number.isFinite(set.price_nok) ? set.price_nok : null;
    return {
      id: p.id,
      n: Number(p.id.slice(5)),
      row: p.row_label ?? String(p.row),
      elevation: Math.round(p.local.z_ground),
      sunDec: p.sun.dec21.hours,
      sunDecPossible: p.sun.dec21.possible_hours,
      seaDeg: p.view.water_visible_deg,
      openSea: p.view.open_sea_visible,
      openSeaDeg: p.view.open_sea_deg,
      lowerFloor: !!data.facts[p.id]?.lowerFloor,
      status: set?.status ?? "unreleased",
      price,
    };
  });
}

export type PlotSort = "nr" | "sol" | "sjo";

export function sortCards(cards: PlotCard[], sort: PlotSort): PlotCard[] {
  const out = [...cards];
  if (sort === "sol") out.sort((a, b) => b.sunDec - a.sunDec || a.n - b.n);
  else if (sort === "sjo") out.sort((a, b) => b.seaDeg - a.seaDeg || b.openSeaDeg - a.openSeaDeg || a.n - b.n);
  else out.sort((a, b) => a.n - b.n);
  return out;
}

// ------------------------------------------------------------------------------------------------ the address

type Search = string | URLSearchParams | Record<string, string | string[] | undefined>;

function param(search: Search, key: string): string | undefined {
  if (search instanceof URLSearchParams) return search.get(key) ?? undefined;
  if (typeof search === "string") return new URLSearchParams(search).get(key) ?? undefined;
  const v = search[key];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * The configuration and the step an address asks for. The plot is read first, so a lower floor in the link is kept
 * only when that plot has room for one.
 */
export function readAddress(search: Search, facts: Record<string, PlotFacts>): { cfg: HouseConfig; step: StepKey | null; hasConfig: boolean } {
  const probe = fromSearch(search);
  const cfg = fromSearch(search, probe.plot ? facts[probe.plot] ?? null : null);
  const s = param(search, "steg");
  return { cfg, step: isStepKey(s) ? s : null, hasConfig: !!cfg.plot || Object.keys(cfg.sel).length > 0 };
}

/** The house and the step a page opens with. */
export type Initial = {
  cfg: HouseConfig;
  step: StepKey;
  /** True when the address carried a configuration or a step (a shared link, a plot page's button, a reload). */
  fromAddress: boolean;
};

/** Where a visitor starts: the step in the address; else the summary of a shared house, the house step for a plot, or the plot step. */
export function startStep(cfg: HouseConfig, step: StepKey | null): StepKey {
  if (step) return step;
  if (Object.keys(cfg.sel).length > 0) return "oppsummering";
  return cfg.plot ? "hus" : "tomt";
}

/** The address of a configuration at a step: the shareable part (lib/configurator/state toSearch) and the step. */
export function searchFor(cfg: HouseConfig, step: StepKey): string {
  const base = toSearch(cfg);
  if (!base && step === "tomt") return "";
  return `${base ? `${base}&` : "?"}steg=${step}`;
}

/** The plot number as people say it: "plot-07" to 7. */
export function plotNumber(plotId: string | null): number | null {
  const i = plotIndex(plotId);
  return i >= 0 ? i + 1 : null;
}
