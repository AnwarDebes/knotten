import { getTranslations } from "next-intl/server";
import { SectionHead } from "@/components/site/primitives";

type Pillar = { name: string; body: string };

/**
 * The four qualities, as a measured editorial ledger rather than a four-up card
 * grid. Deliberately qualitative: the hard figures live once, in the measured
 * band that follows, so nothing is repeated across a single scroll.
 */
async function HomePillars() {
  const t = await getTranslations("home.pillars");
  const items = t.raw("items") as Pillar[];

  return (
    <section className="border-border/70 bg-card/40 border-y">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
        <SectionHead eyebrow={t("eyebrow")} title={t("title")} elevation={40} />

        <ul className="mt-12">
          {items.map((p, i) => (
            <li
              key={i}
              className="border-border/70 grid grid-cols-1 gap-x-12 gap-y-2 border-t py-7 md:grid-cols-[14rem_1fr] md:py-9"
            >
              <h3 className="font-display text-foreground text-xl tracking-tight">{p.name}</h3>
              <p className="text-muted-foreground max-w-2xl leading-7">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export { HomePillars };
