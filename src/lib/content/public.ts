import { getDb } from "@/db";
import { listPlots, listPublishedNews, listPublishedFaq, getBlock, getDashboard } from "./service";
import type { Plot, NewsPost, FaqEntry, ContentBlock } from "@/db/schema";
import {
  parseSimulationParams,
  DEFAULT_SIM_PARAMS,
  type SimulationParams,
} from "@/lib/energy-telemetry";

/**
 * Read helpers for the public site. Each is resilient: if the database is
 * unreachable it returns an empty set rather than failing the page, so the
 * templates fall back to their built-in placeholder copy.
 *
 * During the production build these pages are statically prerendered across
 * many parallel workers; opening the in-process dev database concurrently from
 * all of them is both pointless and contended, so the reads are skipped then.
 * The pages are ISR (revalidate set per route), so the first runtime request,
 * and every content edit (which calls revalidatePath), renders live data.
 */

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

export async function getPublicPlots(): Promise<Plot[]> {
  if (isBuildPhase) return [];
  try {
    return await listPlots(await getDb());
  } catch {
    return [];
  }
}

export async function getPublicNews(): Promise<NewsPost[]> {
  if (isBuildPhase) return [];
  try {
    return await listPublishedNews(await getDb());
  } catch {
    return [];
  }
}

export async function getPublicFaq(): Promise<FaqEntry[]> {
  if (isBuildPhase) return [];
  try {
    return await listPublishedFaq(await getDb());
  } catch {
    return [];
  }
}

export async function getPublicBlock(key: string): Promise<ContentBlock | undefined> {
  if (isBuildPhase) return undefined;
  try {
    return await getBlock(await getDb(), key);
  } catch {
    return undefined;
  }
}

/** Community-dashboard simulation parameters, admin-editable, with safe defaults. */
export async function getDashboardParams(): Promise<SimulationParams> {
  if (isBuildPhase) return DEFAULT_SIM_PARAMS;
  try {
    const row = await getDashboard(await getDb());
    return parseSimulationParams(row?.values);
  } catch {
    return DEFAULT_SIM_PARAMS;
  }
}
