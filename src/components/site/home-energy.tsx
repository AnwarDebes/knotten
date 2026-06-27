import { getTranslations } from "next-intl/server";
import { SectionHead, ArrowLink } from "@/components/site/primitives";

type Element = { id: string; title: string; maturity: "proven" | "emerging" | "concept" };

// Maturity by shape within the cool palette, not a traffic-light trio: a filled
// fjord dot (proven), a hollow ring (emerging), a faint dot (concept). The word
// label still carries the precise meaning.
const DOT: Record<string, string> = {
  proven: "bg-foreground border-foreground",
  emerging: "border-foreground/60 bg-transparent",
  concept: "border-muted-foreground/40 bg-muted-foreground/25",
};

/**
 * Energy concept teaser. Reuses the real element list and maturity labels from
 * the energy-concept page so nothing is invented.
 */
async function HomeEnergyTeaser() {
  const t = await getTranslations("home.energyTeaser");
  const ek = await getTranslations("energikonseptet");
  const elements = ek.raw("elements") as Element[];
  const maturity = ek.raw("maturity") as Record<string, string>;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
      <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
        <div>
          <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("body")} elevation={95} />
          <div className="mt-8">
            <ArrowLink href="/energikonseptet">{t("cta")}</ArrowLink>
          </div>
        </div>

        <div className="lg:pt-2">
          <h3 className="text-foreground text-sm font-medium tracking-[0.16em] uppercase">
            {t("elementsHeading")}
          </h3>
          <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
            {elements.map((e) => (
              <li key={e.id} className="border-border/70 flex items-center gap-3 border-t py-3.5">
                <span
                  aria-hidden
                  className={`size-2 shrink-0 rounded-full border ${DOT[e.maturity]}`}
                />
                <span className="text-foreground flex-1 text-sm">{e.title}</span>
                <span className="text-muted-foreground text-xs">{maturity[e.maturity]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export { HomeEnergyTeaser };
