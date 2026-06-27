import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/site/primitives";

/**
 * The closing call to action, in the dark register so the page opens and closes
 * in the same dusk light. The "what happens next" steps are a real sequence, so
 * they are numbered honestly. Server rendered, no client JavaScript.
 */
async function MeldInteresseCta() {
  const t = await getTranslations("cta");
  const steps = t.raw("whatNextSteps") as { title: string; body: string }[];

  return (
    <section className="section-dark">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 md:py-24 lg:grid-cols-2 lg:gap-16">
        <div>
          <Eyebrow tone="dark">{t("eyebrow")}</Eyebrow>
          <h2 className="font-display mt-5 text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.07] font-normal tracking-[-0.018em] text-balance text-[#f1f5f1]">
            {t("heading")}
          </h2>
          <p className="mt-5 max-w-prose text-lg leading-8 text-[rgba(225,234,230,0.82)]">
            {t("body")}
          </p>
          <Button asChild size="lg" variant="rodberg" className="mt-8">
            <Link href="/meld-interesse">{t("button")}</Link>
          </Button>
        </div>

        <div className="lg:pt-2">
          <h3 className="text-sm font-medium tracking-[0.16em] text-[#a4c5c6] uppercase">
            {t("whatNextHeading")}
          </h3>
          <ol className="mt-6 space-y-1">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4 border-t border-[rgba(190,209,205,0.18)] py-5">
                <span aria-hidden className="bg-rodberg-on-dark mt-2.5 h-px w-5 shrink-0" />
                <span>
                  <span className="block font-medium text-[#e1eae6]">{step.title}</span>
                  <span className="mt-1 block text-sm text-[rgba(195,212,208,0.82)]">
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export { MeldInteresseCta };
