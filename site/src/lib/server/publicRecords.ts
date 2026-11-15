import "server-only";
import { revalidateTag, unstable_cache, updateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { loadStore, publicPlots, publicSettings, publishedNews, seedStore, type NewsItem, type PublicPlot, type PublicSettings } from "@/lib/store";
import type { PriceTable } from "@/lib/configurator/types";
import { loadPrices } from "./configurations";
import { loadPublishedMeters, type Building } from "./records";

/**
 * The records every visitor may see, read through Next's data cache so the public pages are made once and not on
 * every visit: plot status and price, the status line and the company facts, published news, the configurator's
 * price list, and the meter readings the owner has published. These five reads are the only ones in the site that
 * go through a shared cache. Leads, accounts, buyers' own records, sessions, statistics and limits are always read
 * from storage (lib/server/kv.ts), and so is everything a change starts from: mutate reads the stored value itself.
 *
 * Each read has a tag. The server action or route that changes a record names its tag (refreshPublic in an action,
 * refreshPublicFromRoute in a route handler), and the next page load reads storage again: the plot pages, the
 * picker, the configurator, the news and the footers of both designs, in every language. As a safety net the cache
 * also asks storage again once an hour, so a change made outside the admin never lasts longer than that.
 *
 * When storage does not answer (kv.ts throws), a page still renders: with the cached value while there is one,
 * else with the last value this server process read, else with the starting point in the code (the seed). A page
 * made from such a fallback is kept for one minute, so it is made again as soon as storage is back.
 */
export const PUBLIC_TAG = {
  /** Status and price per plot (Tomter og priser in the admin). */
  plots: "public-plots",
  /** The status line and the company facts (Innstillinger). */
  settings: "public-settings",
  /** Published news (Nyheter, and a milestone put on the website). */
  news: "public-news",
  /** The configurator's price list (Husvalg og priser). */
  prices: "public-prices",
  /** The published meter readings of the buildings that stand today (Energi, Eksisterende bygg). */
  meters: "public-meters",
} as const;
export type PublicTag = keyof typeof PUBLIC_TAG;

/** How long a cached value is used before storage is asked again in the background, in seconds. */
const CHECK_AGAIN = 3600;
/** How long a page made while storage did not answer is kept, in seconds. */
const TRY_AGAIN = 60;

/**
 * Called while a page is being made from a fallback. An entry with a short lifetime lowers the lifetime of the
 * page that reads it, so that page is made again after a minute instead of staying as it is for an hour.
 */
const shortLived = unstable_cache(async () => null, ["public-fallback"], { revalidate: TRY_AGAIN });

let warned = 0;

/**
 * One cached read. `load` asks storage and returns only what the public may see; `seed` is the same part of the
 * starting point. The value is stored as JSON, so every caller gets its own copy.
 */
function publicRead<T>(tag: PublicTag, load: () => Promise<T>, seed: () => T): () => Promise<T> {
  const cached = unstable_cache(load, [`public-${tag}`], { tags: [PUBLIC_TAG[tag]], revalidate: CHECK_AGAIN });
  let last: string | null = null;
  return async () => {
    try {
      const value = await cached();
      last = JSON.stringify(value);
      return value;
    } catch (e) {
      // (a redirect or a "not found" passing through is Next's own signal, never a storage failure)
      unstable_rethrow(e);
      if (Date.now() - warned > 60_000) {
        warned = Date.now();
        console.error(`[knotten] the public pages show ${last === null ? "the starting values" : "the last values read"} for "${tag}": storage did not answer`, e);
      }
      await shortLived().catch(() => null);
      return last === null ? seed() : (JSON.parse(last) as T);
    }
  };
}

/** Status and price per plot; a plot that is not listed is not released. */
export const readPublicPlots: () => Promise<Record<string, PublicPlot>> = publicRead("plots", async () => publicPlots(await loadStore()), () => publicPlots(seedStore()));
/** The status line and the company facts. */
export const readPublicSettings: () => Promise<PublicSettings> = publicRead("settings", async () => publicSettings(await loadStore()), () => publicSettings(seedStore()));
/** Published news, newest first. */
export const readPublishedNews: () => Promise<NewsItem[]> = publicRead("news", async () => publishedNews(await loadStore()), () => publishedNews(seedStore()));
/** The configurator's price list; a choice that is not listed is "on request". */
export const readPublicPrices: () => Promise<PriceTable> = publicRead("prices", loadPrices, () => ({}));
/** The buildings whose meter readings the owner has published; none until then. */
export const readPublishedMeters: () => Promise<Building[]> = publicRead("meters", loadPublishedMeters, () => []);

/**
 * In a server action, after a change to one of these records: the next read comes from storage, and the pages that
 * show the record are made again when they are next opened. The administrator's own page shows the change at once.
 */
export function refreshPublic(...tags: PublicTag[]) {
  for (const t of tags) updateTag(PUBLIC_TAG[t]);
}

/** The same from a route handler (an upload), where updateTag is not available. */
export function refreshPublicFromRoute(...tags: PublicTag[]) {
  for (const t of tags) revalidateTag(PUBLIC_TAG[t], { expire: 0 });
}
