import type { MetadataRoute } from "next";
import { loadPlots } from "@/lib/data";
import { toModerne } from "@/lib/design";
import { SITE } from "@/lib/meta";

/**
 * The public pages of both designs: Klassisk at the root (the default, Norwegian), Moderne in Norwegian and English,
 * and one page per plot. Each entry names its language versions (hreflang), the same pairs the pages themselves give:
 * a Klassisk page and its English twin in Moderne; a Moderne page in Norwegian and English. The portal, the login
 * screens and Min side are left out.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const klassisk = ["/", "/prosjektet", "/tomtene", "/energi", "/eksisterende-bygg", "/investorer", "/dokumentbank", "/kart", "/galleri", "/kilder", "/kontakt", "/status", "/personvern"];
  const moderne = ["", "/tomter", "/utsikt", "/energi", "/energi/eksisterende", "/omradet", "/prosjektet", "/investor", "/dokumenter", "/nyheter", "/interesse", "/kontakt", "/status", "/personvern"];
  const { plots } = await loadPlots();
  const url = (p: string) => `${SITE}${p}`;
  const pair = (rest: string) => ({ languages: { nb: url(`/no${rest}`), en: url(`/en${rest}`), "x-default": url(`/no${rest}`) } });
  return [
    ...klassisk.map((p) => ({
      url: url(p),
      changeFrequency: "weekly" as const,
      priority: p === "/" ? 1 : 0.7,
      alternates: { languages: { nb: url(p), en: url(toModerne(p).replace(/^\/no(?=\/|$)/, "/en")) } },
    })),
    ...["no", "en"].flatMap((l) => moderne.map((p) => ({ url: url(`/${l}${p}`), changeFrequency: "weekly" as const, priority: l === "no" ? 0.6 : 0.5, alternates: pair(p) }))),
    ...["no", "en"].flatMap((l) => plots.map((p) => ({ url: url(`/${l}/tomter/${p.id}`), changeFrequency: "monthly" as const, priority: 0.4, alternates: pair(`/tomter/${p.id}`) }))),
  ];
}
