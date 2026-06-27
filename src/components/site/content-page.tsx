import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { PageHero } from "@/components/site/page-hero";

type Block = { heading: string; body: string };

/**
 * Generic content page: a shared hero (eyebrow, title, lead, optional note), a
 * stack of content blocks, optional extra children, and the Meld interesse call
 * to action. Used by the shell and content pages so they stay consistent.
 * Server rendered.
 */
async function ContentPage({
  namespace,
  children,
  showCta = true,
}: {
  namespace: string;
  children?: ReactNode;
  showCta?: boolean;
}) {
  const t = await getTranslations(namespace);
  const blocks = (t.raw("blocks") as Block[]) ?? [];

  return (
    <main id="main-content" className="flex-1">
      <PageHero
        eyebrow={t.has("eyebrow") ? t("eyebrow") : undefined}
        title={t("title")}
        lead={t("lead")}
        note={t.has("note") ? t("note") : undefined}
      />

      <div className="mx-auto w-full max-w-3xl space-y-12 px-6 py-16 md:py-20">
        {blocks.map((block, i) => (
          <section key={i} className="space-y-3">
            <h2 className="font-display text-foreground text-2xl font-normal tracking-tight">
              {block.heading}
            </h2>
            <p className="text-foreground/90 leading-7">{block.body}</p>
          </section>
        ))}
        {children}
      </div>

      {showCta ? <MeldInteresseCta /> : null}
    </main>
  );
}

export { ContentPage };
