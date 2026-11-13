import type { MetadataRoute } from "next";
import { loadPlots } from "@/lib/data";
import { TEAM_SLUGS } from "@/lib/facts/team";
import { kHref } from "@/lib/klassisk/locale";
import { SITE } from "@/lib/meta";
import { PAGES, PATTERNS, hasEnglish, plotDigits, type Pattern } from "@/lib/pages";

/**
 * Every public page of both designs in both languages, from the page registry (src/lib/pages.ts): Klassisk in
 * Norwegian (/energi) and English (/english/energi), Moderne in Norwegian (/no/energi) and English (/en/energi), and
 * a page per plot and per person on the team in each. Each entry names its language versions (hreflang), the same
 * pairs the pages themselves give: a Klassisk page and its English Klassisk twin, a Moderne page in Norwegian and
 * English. The login, account and portal pages are never listed, nor a section of a page (/omradet#kart).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (p: string) => `${SITE}${p}`;
  const klassisk = (path: string, priority: number, changeFrequency: Pattern["changes"] | "daily" | "yearly", english = true) => {
    const languages = { nb: url(kHref(path, "no")), ...(english ? { en: url(kHref(path, "en")) } : {}), "x-default": url(kHref(path, "no")) };
    return (english ? (["no", "en"] as const) : (["no"] as const)).map((l) => ({ url: url(kHref(path, l)), changeFrequency, priority, alternates: { languages } }));
  };
  const moderne = (rest: string, priority: number, changeFrequency: Pattern["changes"] | "daily" | "yearly") => {
    const languages = { nb: url(`/no${rest}`), en: url(`/en${rest}`), "x-default": url(`/no${rest}`) };
    return (["no", "en"] as const).map((l) => ({ url: url(`/${l}${rest}`), changeFrequency, priority, alternates: { languages } }));
  };

  const out: MetadataRoute.Sitemap = [];
  for (const p of PAGES) {
    if (!p.index) continue;
    const priority = p.priority ?? 0.5;
    const changes = p.changes ?? "monthly";
    if (p.klassisk) out.push(...klassisk(p.klassisk, priority, changes, hasEnglish(p)));
    if (p.moderne !== undefined && !p.moderne.includes("#")) out.push(...moderne(p.moderne, priority, changes));
  }

  // one page per plot and per person, in both designs
  const { plots } = await loadPlots();
  const ids: Record<Pattern["key"], string[]> = { plot: plots.map((p) => plotDigits(p.id)), person: TEAM_SLUGS };
  for (const pt of PATTERNS) {
    for (const id of ids[pt.key]) {
      out.push(...klassisk(pt.toKlassisk(id), pt.priority, pt.changes));
      out.push(...moderne(pt.toModerne(id), pt.priority, pt.changes));
    }
  }
  return out;
}
