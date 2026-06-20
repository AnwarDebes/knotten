import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type StaticPathname } from "@/i18n/routing";
import { PLOTS } from "@/content/plots";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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

function plotEntry(code: string): MetadataRoute.Sitemap[number] {
  const href = { pathname: "/tomt/[code]" as const, params: { code } };
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = `${SITE_URL}${getPathname({ href, locale: l })}`;
  return {
    url: `${SITE_URL}${getPathname({ href, locale: routing.defaultLocale })}`,
    alternates: { languages },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [...STATIC_ROUTES.map(staticEntry), ...PLOTS.map((p) => plotEntry(p.code.toLowerCase()))];
}
