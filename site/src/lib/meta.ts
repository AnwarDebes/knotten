import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { kHref, type KLocale } from "@/lib/klassisk/locale";

/**
 * The public address in link previews, canonical links, language alternates, the sitemap and robots.txt:
 * SITE_URL when it is set; on Vercel, the production domain Vercel gives the project; otherwise this computer.
 */
function siteUrl(): string {
  const set = process.env.SITE_URL?.trim();
  if (set) return set;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}
export const SITE = siteUrl().replace(/\/$/, "");

/** One title separator for the whole site: "Energi og teknologi | Knotten". */
export const TITLE_SEP = " | ";
export const brand = (title: string) => `${title}${TITLE_SEP}Knotten`;
export const TITLE_TEMPLATE = `%s${TITLE_SEP}Knotten`;

/** The share image of the Klassisk design (src/app/(klassisk)/delingsbilde.png/route.tsx). */
export const KLASSISK_SHARE = { url: "/delingsbilde.png", width: 1200, height: 630, alt: "Knotten, Rødberg i Lindesnes: planlagt som Norges mest energivennlige boligfelt" };
/** The share image of the Moderne pages that have none of their own. */
const MODERNE_SHARE = { no: "Utsikten sørover mot Sniksfjorden", en: "The view south towards Sniksfjorden" };

type Text = { title?: string; description: string };

/**
 * Title, description and language alternates for a public Moderne page, in the page's own language:
 * `export const generateMetadata = pageMeta("/utsikt", { no: {...}, en: {...} })`. The layout adds
 * " | Knotten" to the title; leave the title out on the front page to get the layout's own.
 */
export function pageMeta(path: string, text: { no: Text; en: Text }) {
  return async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const { locale } = await params;
    if (!isLocale(locale)) notFound();
    return withAlternates(path, locale, text[locale]);
  };
}

/**
 * The same for a page that builds its own text (a plot page): canonical address, both languages, preview.
 * `ownImage`: the page has an opengraph-image file of its own, which Next only uses when the page's
 * metadata names no image.
 */
export function withAlternates(path: string, locale: "no" | "en", { title, description }: Text, { ownImage = false }: { ownImage?: boolean } = {}): Metadata {
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: `/${locale}${path}`, languages: { nb: `/no${path}`, en: `/en${path}`, "x-default": `/no${path}` } },
    openGraph: {
      ...(title ? { title: brand(title) } : {}),
      description,
      url: `/${locale}${path}`,
      siteName: "Knotten",
      locale: locale === "no" ? "nb_NO" : "en_GB",
      type: "website",
      ...(ownImage ? {} : { images: [{ url: "/img/view.jpg", width: 1440, height: 1440, alt: MODERNE_SHARE[locale] }] }),
    },
  };
}

/**
 * Title, description, canonical address, link preview and the other language for a Klassisk page:
 * `export const metadata = klassiskMeta("/energi", { title: "Energi og teknologi", description: "..." })`, and for
 * its English twin under /english: `klassiskMeta("/energi", { title: "Energy and technology", ... }, { locale: "en" })`.
 * `path` is the page path without the language prefix. Leave the title out on the front page to get the layout's own.
 */
export function klassiskMeta(path: string, { title, description }: Text, { noindex = false, locale = "no" }: { noindex?: boolean; locale?: KLocale } = {}): Metadata {
  const page = path || "/";
  const here = kHref(page, locale);
  return {
    // the front page sits in the layout's own segment, where the layout's title template does not reach
    ...(title ? { title: page === "/" ? { absolute: brand(title) } : title } : {}),
    description,
    alternates: { canonical: here, languages: { nb: kHref(page, "no"), en: kHref(page, "en"), "x-default": kHref(page, "no") } },
    openGraph: {
      title: title ? brand(title) : "Knotten",
      description,
      url: here,
      siteName: "Knotten",
      locale: locale === "en" ? "en_GB" : "nb_NO",
      type: "website",
      images: [KLASSISK_SHARE],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
