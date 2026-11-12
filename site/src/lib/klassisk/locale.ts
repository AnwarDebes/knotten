/**
 * Klassisk in two languages: Norwegian at the root (/energi) and English under /english (/english/energi),
 * a route group of its own with its own root layout (src/app/(klassisk-en)). The page paths stay the same in
 * both languages, as they do in Moderne (/no/tomter and /en/tomter).
 * No Node or browser imports here: pages, components, the proxy and the sitemap all use it.
 */
export type KLocale = "no" | "en";

export const KLASSISK_EN = "/english";

/** The Klassisk address of a page in a language: kHref("/energi", "en") is "/english/energi", kHref("/", "en") is "/english". */
export function kHref(path: string, locale: KLocale = "no"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (locale === "no") return p;
  if (p === "/") return KLASSISK_EN;
  if (p.startsWith("/?") || p.startsWith("/#")) return KLASSISK_EN + p.slice(1);
  return KLASSISK_EN + p;
}

/** The language of a Klassisk address and the page path without the language prefix. */
export function kSplit(pathname: string): { locale: KLocale; path: string } {
  if (pathname === KLASSISK_EN || pathname.startsWith(`${KLASSISK_EN}/`)) {
    return { locale: "en", path: pathname.slice(KLASSISK_EN.length) || "/" };
  }
  return { locale: "no", path: pathname || "/" };
}
