import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { getPublicNewsBySlug } from "@/lib/content/public";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 3600;
// Posts live in the content layer and render on demand; none are known at build.
export function generateStaticParams() {
  return [] as { slug: string }[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPublicNewsBySlug(slug);
  if (!post) return {};
  const en = locale === "en";
  const title = en ? post.titleEn : post.titleNo;
  const description = (en ? post.bodyEn : post.bodyNo).slice(0, 160);
  const href = { pathname: "/aktuelt/[slug]" as const, params: { slug } };
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = getPathname({ href, locale: l });
  languages["x-default"] = getPathname({ href, locale: routing.defaultLocale });
  const indexable = process.env.SITE_INDEXABLE === "true";
  return {
    title,
    description,
    robots: indexable ? undefined : { index: false, follow: false },
    alternates: { canonical: getPathname({ href, locale: locale as Locale }), languages },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

export default async function NewsPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const en = locale === "en";
  const t = await getTranslations("aktueltPost");
  const post = await getPublicNewsBySlug(slug);
  if (!post) notFound();

  const title = en ? post.titleEn : post.titleNo;
  const body = en ? post.bodyEn : post.bodyNo;
  const published = post.publishedAt
    ? new Intl.DateTimeFormat(en ? "en-GB" : "nb-NO", { dateStyle: "long" }).format(
        post.publishedAt,
      )
    : "";

  // Article structured data. The strings are plain text rendered by React (no
  // HTML), so there is no injection surface; JSON.stringify safely encodes them.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: locale,
    publisher: { "@type": "Organization", name: "Sigve Simonsen AS" },
  };

  return (
    <main id="main-content" className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto w-full max-w-3xl px-6 py-16">
        <Link href="/aktuelt" className="text-sea text-sm hover:underline">
          &larr; {t("back")}
        </Link>
        <h1 className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {published ? <p className="text-muted-foreground mt-2 text-sm">{published}</p> : null}
        <div className="text-foreground mt-6 leading-8 whitespace-pre-line">{body}</div>
      </article>
      <MeldInteresseCta />
    </main>
  );
}
