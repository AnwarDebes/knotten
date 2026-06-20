import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContentPage } from "@/components/site/content-page";
import { Link } from "@/i18n/navigation";
import { buildPageMetadata } from "@/lib/metadata";
import { getPublicNews } from "@/lib/content/public";

type Props = { params: Promise<{ locale: string }> };

// Refreshed on demand when a post is published or edited (the news content
// actions call revalidatePath for this route), with an hourly backstop.
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "aktuelt", "/aktuelt");
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const en = locale === "en";
  const t = await getTranslations("aktueltPost");
  const posts = await getPublicNews();

  return (
    <ContentPage namespace="aktuelt">
      {posts.length > 0 ? (
        <ul className="divide-border divide-y">
          {posts.map((post) => {
            const body = en ? post.bodyEn : post.bodyNo;
            return (
              <li key={post.id} className="py-6">
                <h2 className="text-foreground text-xl font-semibold tracking-tight">
                  <Link
                    href={{ pathname: "/aktuelt/[slug]", params: { slug: post.slug } }}
                    className="hover:text-sea"
                  >
                    {en ? post.titleEn : post.titleNo}
                  </Link>
                </h2>
                {post.publishedAt ? (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {new Intl.DateTimeFormat(en ? "en-GB" : "nb-NO", { dateStyle: "long" }).format(
                      post.publishedAt,
                    )}
                  </p>
                ) : null}
                <p className="text-foreground mt-2 leading-7">
                  {body.length > 200 ? `${body.slice(0, 200)}...` : body}
                </p>
                <Link
                  href={{ pathname: "/aktuelt/[slug]", params: { slug: post.slug } }}
                  className="text-sea mt-2 inline-block text-sm hover:underline"
                >
                  {t("readMore")}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </ContentPage>
  );
}
