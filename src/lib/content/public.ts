import { getDb } from "@/db";
import {
  listPlots,
  listPublishedNews,
  listPublishedFaq,
  getBlock,
  getDashboard,
  listTimeline,
  getNewsBySlug,
} from "./service";
import type { Plot, NewsPost, ContentBlock } from "@/db/schema";
import {
  parseSimulationParams,
  DEFAULT_SIM_PARAMS,
  type SimulationParams,
} from "@/lib/energy-telemetry";
import {
  DEFAULT_TIMELINE,
  DEFAULT_FAQ,
  type TimelineDefault,
  type FaqDefault,
} from "@/content/defaults";

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

/** A single published post by slug (null if missing or still a draft). */
export async function getPublicNewsBySlug(slug: string): Promise<NewsPost | null> {
  if (isBuildPhase) return null;
  try {
    const post = await getNewsBySlug(await getDb(), slug);
    return post && post.status === "published" ? post : null;
  } catch {
    return null;
  }
}

/** Published FAQ from the content layer, falling back to the cited defaults. */
export async function getPublicFaq(): Promise<FaqDefault[]> {
  if (isBuildPhase) return DEFAULT_FAQ;
  try {
    const rows = await listPublishedFaq(await getDb());
    if (rows.length === 0) return DEFAULT_FAQ;
    return rows.map((r) => ({
      key: r.id,
      questionNo: r.questionNo,
      questionEn: r.questionEn,
      answerNo: r.answerNo,
      answerEn: r.answerEn,
    }));
  } catch {
    return DEFAULT_FAQ;
  }
}

/** Timeline stages from the content layer, falling back to the phase defaults. */
export async function getPublicTimeline(): Promise<TimelineDefault[]> {
  if (isBuildPhase) return DEFAULT_TIMELINE;
  try {
    const rows = await listTimeline(await getDb());
    if (rows.length === 0) return DEFAULT_TIMELINE;
    return rows.map((r) => ({
      key: r.key,
      labelNo: r.labelNo,
      labelEn: r.labelEn,
      dateOrStage: r.dateOrStage ?? "",
      isCurrent: r.isCurrent,
    }));
  } catch {
    return DEFAULT_TIMELINE;
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
