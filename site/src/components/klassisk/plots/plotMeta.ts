import type { Metadata } from "next";
import { loadPlot, loadPlots } from "@/lib/data";
import { plotDescription, plotNr } from "@/lib/content/plots";
import { plotName } from "@/lib/format";
import { klassiskMeta } from "@/lib/meta";
import type { KLocale } from "@/lib/klassisk/locale";

/**
 * The canonical number in a Klassisk plot address: "07". "7" and Moderne's "plot-07" are sent on to it, anything
 * else is not a plot.
 */
export function canonicalNr(nr: string): string | null {
  const m = /^(?:plot-)?(\d{1,2})$/.exec(nr);
  return m ? m[1].padStart(2, "0") : null;
}

/** The 30 Klassisk plot pages, built with the site: /tomtene/01 to /tomtene/30 (and the same under /english). */
export async function plotParams(): Promise<{ nr: string }[]> {
  const { plots } = await loadPlots();
  return plots.map((p) => ({ nr: plotNr(p.id) }));
}

/**
 * Title, description, canonical address and the other language for a Klassisk plot page. The link preview names no
 * image of its own here, so the plot's generated share image (opengraph-image.tsx beside the page) is the one used.
 */
export async function plotMetadata(nr: string, locale: KLocale): Promise<Metadata> {
  const en = locale === "en";
  const canon = canonicalNr(nr);
  const p = canon ? await loadPlot(`plot-${canon}`) : undefined;
  if (!p || !canon) return { title: en ? "Page not found" : "Fant ikke siden", robots: { index: false } };
  const m = klassiskMeta(`/tomtene/${canon}`, { title: plotName(p.id, !en), description: plotDescription(p, locale) }, { locale });
  const og = { ...(m.openGraph ?? {}) } as Record<string, unknown>;
  delete og.images;
  return { ...m, openGraph: og as Metadata["openGraph"] };
}
