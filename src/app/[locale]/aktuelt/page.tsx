import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ContentPage } from "@/components/site/content-page";
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
  const posts = await getPublicNews();

  return (
    <ContentPage namespace="aktuelt">
      {posts.length > 0 ? (
        <div className="space-y-10">
          {posts.map((post) => (
            <article key={post.id} className="space-y-2">
              <h2 className="text-foreground text-xl font-semibold tracking-tight">
                {en ? post.titleEn : post.titleNo}
              </h2>
              {post.publishedAt ? (
                <p className="text-muted-foreground text-sm">
                  {new Intl.DateTimeFormat(en ? "en-GB" : "nb-NO", { dateStyle: "long" }).format(
                    post.publishedAt,
                  )}
                </p>
              ) : null}
              <p className="text-foreground leading-7 whitespace-pre-line">
                {en ? post.bodyEn : post.bodyNo}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </ContentPage>
  );
}
