import { getTranslations } from "next-intl/server";
import { SectionHead } from "@/components/site/primitives";

type Measure = { value: string; unit: string; label: string; source: string };

/**
 * The measured-numbers band: the one place the hard figures appear. A dark
 * register that echoes the hero, set as an asymmetric ledger (figure left,
 * label and source right) rather than an even stats strip. Each row is a valid
 * dl group with the term before its descriptions.
 */
async function HomeMeasures() {
  const t = await getTranslations("home.measures");
  const items = t.raw("items") as Measure[];

  return (
    <section className="section-dark">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
        <SectionHead
          tone="dark"
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("intro")}
          elevation={70}
        />

        <dl className="mt-12 border-t border-[rgba(190,209,205,0.18)]">
          {items.map((m, i) => (
            <div
              key={i}
              className="grid grid-cols-1 items-baseline gap-x-10 gap-y-2 border-b border-[rgba(190,209,205,0.18)] py-7 md:grid-cols-[15rem_1fr]"
            >
              <dt className="font-medium text-[#e1eae6] md:col-start-2 md:row-start-1">
                {m.label}
              </dt>
              <dd className="font-display text-[2.5rem] leading-none tracking-tight text-[#f1f5f1] tabular-nums md:col-start-1 md:row-span-2 md:row-start-1">
                {m.value}
                <span className="ml-2 text-sm font-normal tracking-normal text-[#a4c5c6]">
                  {m.unit}
                </span>
              </dd>
              <dd className="text-xs text-[rgba(195,212,208,0.72)] md:col-start-2 md:row-start-2">
                {m.source}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-[rgba(195,212,208,0.72)]">
          {t("note")}
        </p>
      </div>
    </section>
  );
}

export { HomeMeasures };
