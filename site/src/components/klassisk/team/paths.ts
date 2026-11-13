import type { Lang } from "@/lib/facts/core";
import { kHref } from "@/lib/klassisk/locale";

/** Klassisk addresses for the team components: /teamet in Norwegian, /english/teamet in English (lib/klassisk/locale.ts). */
export function klassiskHref(path: string, locale: Lang): string {
  return kHref(path, locale);
}
