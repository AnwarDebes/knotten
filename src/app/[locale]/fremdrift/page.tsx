import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/primitives/disclaimer";
import { getPublicTimeline, getPublicFaq } from "@/lib/content/public";

type Props = { params: Promise<{ locale: string }> };

// Refreshed when the timeline or FAQ changes (the content actions revalidate
// this route) and hourly as a backstop.
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "fremdrift", "/fremdrift");
}

type Step = { title: string; body: string };

export default async function FremdriftPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const en = locale === "en";
  const t = await getTranslations("fremdrift");
  const cta = await getTranslations("cta");
  const [timeline, faq] = await Promise.all([getPublicTimeline(), getPublicFaq()]);
  const steps = cta.raw("whatNextSteps") as Step[];

  return (
    <main id="main-content" className="flex-1">
      <section className="bg-secondary/30 border-b">
        <div className="mx-auto w-full max-w-3xl px-6 py-16">
          <p className="text-sea mb-3 text-sm font-medium tracking-wide uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-foreground mt-4 max-w-prose text-lg leading-8">{t("lead")}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          {t("timelineHeading")}
        </h2>
        <ol className="border-border mt-4 space-y-0 border-l">
          {timeline.map((stage) => (
            <li key={stage.key} className="relative py-4 pl-6">
              <span
                aria-hidden
                className={
                  stage.isCurrent
                    ? "bg-sea absolute top-6 -left-[5px] size-2.5 rounded-full"
                    : "bg-border absolute top-6 -left-[5px] size-2.5 rounded-full"
                }
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-foreground font-medium">
                  {en ? stage.labelEn : stage.labelNo}
                </span>
                {stage.isCurrent ? <Badge variant="secondary">{t("current")}</Badge> : null}
              </div>
              <p className="text-muted-foreground text-sm">{stage.dateOrStage}</p>
            </li>
          ))}
        </ol>
        <Disclaimer className="mt-3">{t("forbehold")}</Disclaimer>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 pb-12">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          {cta("whatNextHeading")}
        </h2>
        <ol className="mt-4 space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden
                className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
              >
                {i + 1}
              </span>
              <span>
                <span className="text-foreground block font-medium">{step.title}</span>
                <span className="text-muted-foreground block text-sm">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 pb-12">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">{t("faqHeading")}</h2>
        <div className="border-border divide-border mt-4 divide-y rounded-lg border">
          {faq.map((entry) => (
            <details key={entry.key} className="group px-4">
              <summary className="text-foreground hover:text-sea cursor-pointer list-none py-4 font-medium [&::-webkit-details-marker]:hidden">
                {en ? entry.questionEn : entry.questionNo}
              </summary>
              <p className="text-muted-foreground pb-4 text-sm leading-6 whitespace-pre-line">
                {en ? entry.answerEn : entry.answerNo}
              </p>
            </details>
          ))}
        </div>
      </section>

      <MeldInteresseCta />
    </main>
  );
}
