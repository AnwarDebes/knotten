import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { routing, type StaticPathname, type Locale } from "@/i18n/routing";

/**
 * Build per-page metadata (title, description, canonical and hreflang
 * alternates) from a page's translation namespace. hreflang points each locale
 * at its own localised path. The locale arrives as a string from Next's route
 * params and is a valid locale because the page lives under [locale].
 */
export async function buildPageMetadata(
  locale: string,
  namespace: string,
  href: StaticPathname,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace });

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = getPathname({ href, locale: l });
  }
  languages["x-default"] = getPathname({ href, locale: routing.defaultLocale });

  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: {
      canonical: getPathname({ href, locale: locale as Locale }),
      languages,
    },
    openGraph: {
      title,
      description,
    },
  };
}
