import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { Disclaimer } from "@/components/primitives/disclaimer";

type Block = { heading: string; body: string };

/**
 * Generic content page: hero (eyebrow, title, lead), a stack of content
 * blocks, optional extra children, an optional note rendered as a disclaimer,
 * and the Meld interesse call to action. Used by the shell and content pages so
 * they stay consistent. Server rendered.
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
      <section className="bg-secondary/30 border-b">
        <div className="mx-auto w-full max-w-3xl px-6 py-16">
          {t.has("eyebrow") ? (
            <p className="text-sea mb-3 text-sm font-medium tracking-wide uppercase">
              {t("eyebrow")}
            </p>
          ) : null}
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-foreground mt-4 max-w-prose text-lg leading-8">{t("lead")}</p>
          {t.has("note") ? <Disclaimer className="mt-6">{t("note")}</Disclaimer> : null}
        </div>
      </section>

      <div className="mx-auto w-full max-w-3xl space-y-10 px-6 py-14">
        {blocks.map((block, i) => (
          <section key={i} className="space-y-2">
            <h2 className="text-foreground text-xl font-semibold tracking-tight">
              {block.heading}
            </h2>
            <p className="text-foreground leading-7">{block.body}</p>
          </section>
        ))}
        {children}
      </div>

      {showCta ? <MeldInteresseCta /> : null}
    </main>
  );
}

export { ContentPage };
