import { mutate, readJSON } from "./kv";
import { OPTIONS, STEPS } from "@/lib/configurator/catalog";
import { loadPlotFacts } from "@/lib/configurator/plots.server";
import { chosen, normalize, toSearch, type PlotFacts } from "@/lib/configurator/state";
import type { HouseConfig, Lang, PriceTable, SavedConfig } from "@/lib/configurator/types";

/**
 * Server records for the house configurator: saved configurations per account (shown on Min side), configurations
 * sent to Sigve Simonsen AS (each linked to the lead it created or updated), and the price table an administrator
 * sets in the portal (Husvalg og priser).
 *
 * Every configuration is cleaned before it is stored: unknown options and choices are dropped, a choice the plot
 * cannot take falls back to the standard (normalize() with the plot's facts from loadPlotFacts()), and an unknown
 * plot is refused. A sent configuration keeps only the lead's id, not the person's name or address: the lead holds
 * those, so deleting the lead leaves nothing personal here (deleteSentForLead removes the link as well).
 */
export type SentConfig = { id: string; lead: string; config: HouseConfig; at: string; design: "klassisk" | "moderne"; locale: Lang };

type Records = {
  saved: Record<string, SavedConfig[]>;
  sent: SentConfig[];
  prices: PriceTable;
  /** Who changed the price table last, and when. */
  pricesChanged?: { at: string; by: string };
};
const KEY = "configurator";
const seed = (): Records => ({ saved: {}, sent: [], prices: {} });

/** At most this many saved configurations per account. */
export const MAX_SAVED = 20;
/** The newest sent configurations kept (a cap on a public form's records; thousands of buyers is far off). */
const MAX_SENT = 5000;
/** Prices are whole kroner, at most a hundred million either way (a minus is a deduction). */
const MAX_PRICE = 100_000_000;

/** Thrown by saveConfig when the account already has MAX_SAVED configurations. */
export class ConfigLimitError extends Error {
  constructor() {
    super("limit");
    this.name = "ConfigLimitError";
  }
}

async function read(): Promise<Records> {
  return { ...seed(), ...((await readJSON<Partial<Records>>(KEY)) ?? {}) };
}

export function newConfigId() {
  return `cfg-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * A configuration from outside (a form, a saved link) made safe to store: null when it is not a configuration
 * or names a plot that does not exist; otherwise only known options and choices the plot can take.
 */
export async function cleanConfig(raw: unknown): Promise<HouseConfig | null> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const c = raw as Partial<HouseConfig>;
  if (c.v !== undefined && c.v !== 1) return null;
  if (c.plot !== undefined && c.plot !== null && typeof c.plot !== "string") return null;
  const facts = await loadPlotFacts();
  const plot = c.plot ? facts[c.plot] : null;
  if (c.plot && !plot) return null;
  return normalize({ v: 1, plot: c.plot ?? null, sel: c.sel && typeof c.sel === "object" && !Array.isArray(c.sel) ? c.sel : {} }, plot);
}

/** The plot facts for a configuration's plot, for summaries and rules (null without a plot). */
export async function factsFor(config: HouseConfig): Promise<PlotFacts | null> {
  return config.plot ? (await loadPlotFacts())[config.plot] ?? null : null;
}

// ------------------------------------------------------------------ saved (Min side)

export async function listSaved(uid: string): Promise<SavedConfig[]> {
  return ((await read()).saved[uid] ?? []).slice().sort((a, b) => b.updated.localeCompare(a.updated));
}

/**
 * Saves a configuration for an account: updates the one with `id`, or adds a new one. The configuration is
 * cleaned first (an unknown plot is stored without its plot). Throws ConfigLimitError when a new one would be
 * the account's 21st.
 */
export async function saveConfig(uid: string, name: string, config: HouseConfig, id?: string): Promise<SavedConfig> {
  const now = new Date().toISOString();
  const clean = (await cleanConfig(config)) ?? (await cleanConfig({ ...config, plot: null })) ?? { v: 1, plot: null, sel: {} };
  const title = name.replace(/\s+/g, " ").trim().slice(0, 80);
  return mutate<Records, SavedConfig>(KEY, seed, (r) => {
    r.saved ??= {};
    const list = (r.saved[uid] ??= []);
    const known = id ? list.find((x) => x.id === id) : undefined;
    if (known) {
      known.name = title || known.name;
      known.config = clean;
      known.updated = now;
      return known;
    }
    if (list.length >= MAX_SAVED) throw new ConfigLimitError();
    const item: SavedConfig = { id: newConfigId(), name: title || "Mitt hus", config: clean, created: now, updated: now };
    list.unshift(item);
    return item;
  });
}

export async function deleteSaved(uid: string, id: string): Promise<void> {
  await mutate<Records, void>(KEY, seed, (r) => {
    if (r.saved?.[uid]) r.saved[uid] = r.saved[uid].filter((x) => x.id !== id);
  });
}

/** Account deletion: remove everything saved by this account. */
export async function deleteAllFor(uid: string): Promise<void> {
  await mutate<Records, void>(KEY, seed, (r) => {
    if (r.saved) delete r.saved[uid];
  });
}

// ------------------------------------------------------------------ sent to Sigve Simonsen AS

/** Stores a configuration someone sent, linked to its lead. `config` must already be cleaned (cleanConfig). */
export async function recordSent(input: { id: string; lead: string; config: HouseConfig; design: "klassisk" | "moderne"; locale: Lang }): Promise<SentConfig> {
  const item: SentConfig = { ...input, at: new Date().toISOString() };
  await mutate<Records, void>(KEY, seed, (r) => {
    r.sent ??= [];
    r.sent.push(item);
    if (r.sent.length > MAX_SENT) r.sent.splice(0, r.sent.length - MAX_SENT);
  });
  return item;
}

/** Sent configurations, newest first; for one lead when `lead` is given. */
export async function listSent(lead?: string): Promise<SentConfig[]> {
  const all = (await read()).sent ?? [];
  return all.filter((x) => !lead || x.lead === lead).slice().sort((a, b) => b.at.localeCompare(a.at));
}

/** The leads that have sent at least one configuration (for the "Husvalg" link on the leads page). */
export async function leadsWithConfig(): Promise<Set<string>> {
  return new Set(((await read()).sent ?? []).map((x) => x.lead));
}

export async function deleteSent(id: string): Promise<void> {
  await mutate<Records, void>(KEY, seed, (r) => {
    r.sent = (r.sent ?? []).filter((x) => x.id !== id);
  });
}

/** When a lead is deleted: its sent configurations go too. */
export async function deleteSentForLead(lead: string): Promise<void> {
  await mutate<Records, void>(KEY, seed, (r) => {
    r.sent = (r.sent ?? []).filter((x) => x.lead !== lead);
  });
}

// ------------------------------------------------------------------ the price table

/** Every key the price table may hold: the house's base price and each choice that is not standard. */
export function priceKeys(): string[] {
  return ["house:base", ...OPTIONS.flatMap((o) => o.choices.filter((c) => !c.standard).map((c) => `${o.id}:${c.id}`))];
}

/** Only known keys and whole kroner; the base price cannot be negative. Anything else means "on request". */
export function cleanPrices(raw: unknown): PriceTable {
  const out: PriceTable = {};
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  for (const k of priceKeys()) {
    const v = src[k];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    const kr = Math.round(v);
    if (Math.abs(kr) > MAX_PRICE || (k === "house:base" && kr < 0)) continue;
    out[k] = kr;
  }
  return out;
}

export async function getPrices(): Promise<PriceTable> {
  return cleanPrices((await read()).prices ?? {});
}

export async function pricesChanged(): Promise<{ at: string; by: string } | null> {
  return (await read()).pricesChanged ?? null;
}

/** Replaces the whole price table (the admin form sends every field). Returns what was stored. */
export async function setPrices(table: PriceTable, by: string): Promise<PriceTable> {
  const clean = cleanPrices(table);
  await mutate<Records, void>(KEY, seed, (r) => {
    r.prices = clean;
    r.pricesChanged = { at: new Date().toISOString(), by: by.slice(0, 120) };
  });
  return clean;
}

// ------------------------------------------------------------------ for the administrator and the emails

/**
 * The choices that differ from the standard, as one line: "Tomt 7. Solceller: Hele sørtaket, 18 paneler; Hjemmebatteri: 20 kWh."
 * A configuration with no changes reads "Standardleveranse" / "Standard delivery".
 */
export function describeConfig(config: HouseConfig, lang: Lang, facts: PlotFacts | null): string {
  const plot = config.plot ? `${lang === "no" ? "Tomt" : "Plot"} ${Number(config.plot.slice(5))}. ` : "";
  const picks: string[] = [];
  for (const s of STEPS) {
    for (const o of OPTIONS.filter((x) => x.step === s.id)) {
      const c = chosen(config, o.id, facts);
      if (!c.standard) picks.push(`${o.label[lang]}: ${c.label[lang]}`);
    }
  }
  return `${plot}${picks.length ? `${picks.join("; ")}.` : lang === "no" ? "Standardleveranse." : "Standard delivery."}`;
}

/** The configurator with this configuration loaded (Moderne, the portal's language). */
export function configuratorPath(config: HouseConfig, locale: Lang) {
  return `/${locale}/konfigurator${toSearch(config)}`;
}

/** How often each choice is taken, in sent and in saved configurations (standard choices included). */
export async function choiceCounts(): Promise<{ sent: number; saved: number; counts: Record<string, { sent: number; saved: number }> }> {
  const r = await read();
  const facts = await loadPlotFacts();
  const counts: Record<string, { sent: number; saved: number }> = {};
  const add = (config: HouseConfig, field: "sent" | "saved") => {
    const pf = config.plot ? facts[config.plot] ?? null : null;
    for (const o of OPTIONS) {
      // the lower floor only counts where the plot has one
      if (o.id === "underetasje" && !pf?.lowerFloor) continue;
      const key = `${o.id}:${chosen(config, o.id, pf).id}`;
      (counts[key] ??= { sent: 0, saved: 0 })[field]++;
    }
  };
  const sent = r.sent ?? [];
  const saved = Object.values(r.saved ?? {}).flat();
  for (const s of sent) add(s.config, "sent");
  for (const s of saved) add(s.config, "saved");
  return { sent: sent.length, saved: saved.length, counts };
}
