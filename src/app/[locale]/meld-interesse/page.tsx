import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InterestForm } from "@/components/forms/interest-form";
import { PageHero } from "@/components/site/page-hero";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ bekreftet?: string; avmeldt?: string; tomt?: string }>;
};

// Only accept a plot reference that looks like a real plot code.
function plotRef(tomt: string | undefined): string | null {
  return tomt && /^[A-Za-z]\d{1,2}$/.test(tomt) ? tomt.toUpperCase() : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "meldInteresse", "/meld-interesse");
}

type Step = { title: string; body: string };

export default async function MeldInteressePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { bekreftet, avmeldt, tomt } = await searchParams;
  const tomtRef = plotRef(tomt);
  const t = await getTranslations("meldInteresse");
  const skjema = await getTranslations("meldInteresse.skjema");
  const cta = await getTranslations("cta");
  const steps = cta.raw("whatNextSteps") as Step[];

  return (
    <main id="main-content" className="flex-1">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        {bekreftet === "1" ? (
          <Alert variant="success" className="mb-8">
            <AlertTitle>{skjema("confirmedTitle")}</AlertTitle>
            <AlertDescription>{skjema("confirmedBody")}</AlertDescription>
          </Alert>
        ) : null}
        {bekreftet === "0" ? (
          <Alert variant="warning" className="mb-8">
            <AlertTitle>{skjema("notConfirmedTitle")}</AlertTitle>
            <AlertDescription>{skjema("notConfirmedBody")}</AlertDescription>
          </Alert>
        ) : null}
        {avmeldt === "1" ? (
          <Alert variant="success" className="mb-8">
            <AlertTitle>{skjema("withdrawnTitle")}</AlertTitle>
            <AlertDescription>{skjema("withdrawnBody")}</AlertDescription>
          </Alert>
        ) : null}

        {tomtRef ? (
          <Alert className="mb-8">
            <AlertTitle>{skjema("plotPrefilled", { code: tomtRef })}</AlertTitle>
          </Alert>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
          <div>
            <InterestForm source={tomtRef ? `tomt-${tomtRef}` : "meld-interesse"} />
          </div>
          <aside className="space-y-4">
            <h2 className="text-foreground text-lg font-semibold">{cta("whatNextHeading")}</h2>
            <ol className="space-y-4">
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
          </aside>
        </div>
      </section>
    </main>
  );
}
