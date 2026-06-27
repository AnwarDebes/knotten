import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { StaticPathname } from "@/i18n/routing";
import { SectionHead, ArrowLink } from "@/components/site/primitives";

type Tool = { title: string; href: string };

/**
 * Buyer tools teaser. The calculators that turn the ambition into numbers a
 * buyer recognises. Linked as a quiet editorial list, not heavy cards.
 */
async function HomeToolsTeaser() {
  const t = await getTranslations("home.toolsTeaser");
  const items = t.raw("items") as Tool[];

  return (
    <section className="border-border/70 bg-card/40 border-y">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
        <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[1fr_1.05fr] lg:items-end">
          <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("body")} elevation={140} />

          <ul className="lg:pb-1">
            {items.map((tool, i) => (
              <li key={i}>
                <Link
                  href={tool.href as StaticPathname}
                  className="group border-border/70 hover:text-sea flex items-center justify-between gap-4 border-t py-4 transition-colors"
                >
                  <span className="font-display text-foreground text-lg tracking-tight group-hover:text-current">
                    {tool.title}
                  </span>
                  <span
                    aria-hidden
                    className="text-sea transition-transform group-hover:translate-x-0.5"
                  >
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10">
          <ArrowLink href="/verktoy">{t("cta")}</ArrowLink>
        </div>
      </div>
    </section>
  );
}

export { HomeToolsTeaser };
