import { mutate, readJSON } from "./kv";
import { normalize } from "@/lib/configurator/state";
import type { HouseConfig, PriceTable, SavedConfig } from "@/lib/configurator/types";

/**
 * Server records for the house configurator: saved configurations per account (shown on Min side), configurations
 * sent to Sigve Simonsen AS (linked to the lead), and the price table an administrator sets in the portal.
 *
 * CONTRACT STUB with working basics: the configurator-model stream completes it (limits, admin views, export).
 * Min side and account deletion use listSaved, deleteSaved and deleteAllFor: keep those signatures.
 */
type Records = {
  saved: Record<string, SavedConfig[]>;
  sent: { id: string; lead: string; config: HouseConfig; at: string; design: "klassisk" | "moderne"; locale: "no" | "en" }[];
  prices: PriceTable;
};
const KEY = "configurator";
const seed = (): Records => ({ saved: {}, sent: [], prices: {} });
const MAX_SAVED = 20;

async function read(): Promise<Records> {
  return { ...seed(), ...((await readJSON<Partial<Records>>(KEY)) ?? {}) };
}

export async function listSaved(uid: string): Promise<SavedConfig[]> {
  return ((await read()).saved[uid] ?? []).slice().sort((a, b) => b.updated.localeCompare(a.updated));
}

export async function saveConfig(uid: string, name: string, config: HouseConfig, id?: string): Promise<SavedConfig> {
  const now = new Date().toISOString();
  const clean = normalize(config);
  return mutate<Records, SavedConfig>(KEY, seed, (r) => {
    r.saved ??= {};
    const list = (r.saved[uid] ??= []);
    const known = id ? list.find((x) => x.id === id) : undefined;
    if (known) {
      known.name = name.slice(0, 80) || known.name;
      known.config = clean;
      known.updated = now;
      return known;
    }
    const item: SavedConfig = { id: `cfg-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: name.slice(0, 80) || "Mitt hus", config: clean, created: now, updated: now };
    list.unshift(item);
    if (list.length > MAX_SAVED) list.length = MAX_SAVED;
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

export async function getPrices(): Promise<PriceTable> {
  return (await read()).prices ?? {};
}
