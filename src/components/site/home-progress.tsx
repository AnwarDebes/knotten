import { getTranslations } from "next-intl/server";
import { SectionHead, ArrowLink } from "@/components/site/primitives";
import { Disclaimer } from "@/components/primitives/disclaimer";

type Step = { phase: string; label: string };

/**
 * Where the project stands: a real ordered sequence on a single connecting rail
 * (not four equal cards). The current phase is marked in Rødberg and, so the
 * state is not colour-only, named in the phase word, carries aria-current, and
 * an sr-only "current" cue.
 */
async function HomeProgress() {
  const t = await getTranslations("home.progress");
  const steps = t.raw("steps") as Step[];
  const current = t("current");

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20 md:py-28">
      <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("body")} elevation={160} />

      <ol className="relative mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <span
          aria-hidden
          className="bg-border pointer-events-none absolute top-[5px] right-0 left-0 hidden h-px lg:block"
        />
        {steps.map((s, i) => {
          const isNow = s.phase === current;
          return (
            <li
              key={i}
              aria-current={isNow ? "step" : undefined}
              className="border-border/70 relative border-t py-6 pr-8 lg:border-t-0 lg:pt-7"
            >
              <span
                aria-hidden
                className={`absolute -top-[5px] left-0 size-2.5 rounded-full border-2 lg:top-0 ${
                  isNow ? "border-rodberg bg-rodberg" : "border-border bg-background"
                }`}
              />
              <p
                className={`text-xs font-medium tracking-[0.18em] uppercase ${
                  isNow ? "text-rodberg" : "text-muted-foreground"
                }`}
              >
                {s.phase}
                {isNow ? <span className="sr-only"> (current phase)</span> : null}
              </p>
              <p className="font-display text-foreground mt-2 text-lg tracking-tight">{s.label}</p>
            </li>
          );
        })}
      </ol>

      <Disclaimer className="mt-12 max-w-2xl">{t("note")}</Disclaimer>
      <div className="mt-6">
        <ArrowLink href="/fremdrift">{t("cta")}</ArrowLink>
      </div>
    </section>
  );
}

export { HomeProgress };
