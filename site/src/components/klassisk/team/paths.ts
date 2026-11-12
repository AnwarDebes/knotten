import type { Lang } from "@/lib/facts/core";

/**
 * Klassisk addresses for the team components. Klassisk is Norwegian today; when an English Klassisk is wired, its
 * address prefix goes here and every link the team components draw follows.
 */
const BASE: Record<Lang, string> = { no: "", en: "" };

export function klassiskHref(path: string, locale: Lang): string {
  return `${BASE[locale]}${path}`;
}
