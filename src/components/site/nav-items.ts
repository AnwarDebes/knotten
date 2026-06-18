import type { AppPathname } from "@/i18n/routing";

/** All main pages, with the nav translation key and the localised route. */
export const NAV_ITEMS: { key: string; href: AppPathname }[] = [
  { key: "visjon", href: "/visjon" },
  { key: "energikonseptet", href: "/energikonseptet" },
  { key: "omradet", href: "/omradet" },
  { key: "robusthet", href: "/robusthet" },
  { key: "baerekraft", href: "/baerekraft" },
  { key: "verktoy", href: "/verktoy" },
  { key: "prospekt", href: "/prospekt" },
  { key: "aktuelt", href: "/aktuelt" },
  { key: "forPartnere", href: "/for-kommune-og-partnere" },
  { key: "kontakt", href: "/kontakt" },
];

/** Curated subset shown in the desktop header. */
export const PRIMARY_NAV: { key: string; href: AppPathname }[] = [
  { key: "visjon", href: "/visjon" },
  { key: "energikonseptet", href: "/energikonseptet" },
  { key: "omradet", href: "/omradet" },
  { key: "verktoy", href: "/verktoy" },
  { key: "kontakt", href: "/kontakt" },
];

/** Footer column groupings. */
export const FOOTER_OMRADET: { key: string; href: AppPathname }[] = [
  { key: "visjon", href: "/visjon" },
  { key: "energikonseptet", href: "/energikonseptet" },
  { key: "omradet", href: "/omradet" },
  { key: "robusthet", href: "/robusthet" },
  { key: "baerekraft", href: "/baerekraft" },
];

export const FOOTER_FORDEG: { key: string; href: AppPathname }[] = [
  { key: "verktoy", href: "/verktoy" },
  { key: "prospekt", href: "/prospekt" },
  { key: "aktuelt", href: "/aktuelt" },
  { key: "meldInteresse", href: "/meld-interesse" },
];
