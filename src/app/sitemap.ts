import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type StaticPathname } from "@/i18n/routing";
import { PLOTS } from "@/content/plots";
import { getPublicNews } from "@/lib/content/public";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Rendered on demand so published news posts always appear (they are absent
// during the isolated build); crawler traffic is light.
export const dynamic = "force-dynamic";

// Static public routes (the dynamic plot route is expanded per plot below).
const STATIC_ROUTES: StaticPathname[] = [
  "/",
  "/visjon",
  "/energikonseptet",
  "/omradet",
  "/robusthet",
  "/baerekraft",
  "/fremdrift",
  "/verktoy",
  "/verktoy/energi",
  "/verktoy/strompris",
  "/verktoy/manedskostnad",
  "/verktoy/sol",
  "/verktoy/naromrade",
  "/verktoy/strombrudd",
  "/verktoy/konfigurator",
  "/prospekt",
  "/meld-interesse",
  "/aktuelt",
  "/for-kommune-og-partnere",
  "/kontakt",
  "/personvern",
];

function staticEntry(href: StaticPathname): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = `${SITE_URL}${getPathname({ href, locale: l })}`;
  return {
    url: `${SITE_URL}${getPathname({ href, locale: routing.defaultLocale })}`,
    alternates: { languages },
  };
}

function fromUrls(no: string, en: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${no}`,
    alternates: { languages: { no: `${SITE_URL}${no}`, en: `${SITE_URL}${en}` } },
  };
}

function plotEntry(code: string): MetadataRoute.Sitemap[number] {
  const href = { pathname: "/tomt/[code]" as const, params: { code } };
  return fromUrls(getPathname({ href, locale: "no" }), getPathname({ href, locale: "en" }));
}

function newsEntry(slug: string): MetadataRoute.Sitemap[number] {
  const href = { pathname: "/aktuelt/[slug]" as const, params: { slug } };
  return fromUrls(getPathname({ href, locale: "no" }), getPathname({ href, locale: "en" }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const news = await getPublicNews();
  return [
    ...STATIC_ROUTES.map(staticEntry),
    ...PLOTS.map((p) => plotEntry(p.code.toLowerCase())),
    ...news.map((n) => newsEntry(n.slug)),
  ];
}
