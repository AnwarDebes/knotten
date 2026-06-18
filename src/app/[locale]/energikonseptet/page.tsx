import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check } from "lucide-react";
import { buildPageMetadata } from "@/lib/metadata";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/primitives/disclaimer";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { EnergyIcon } from "@/components/energy/energy-icon";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "energikonseptet", "/energikonseptet");
}

type Element = {
  id: string;
  title: string;
  explainer: string;
  herNote: string;
  maturity: "proven" | "emerging" | "concept";
  source: string;
};

const MATURITY_VARIANT = {
  proven: "success",
  emerging: "warning",
  concept: "outline",
} as const;

export default async function EnergikonseptetPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("energikonseptet");
  const common = await getTranslations("common");
  const elements = t.raw("elements") as Element[];
  const maturity = t.raw("maturity") as Record<string, string>;
  const framing = t.raw("framing") as { body: string; points: string[]; note: string };

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

      <section className="bg-secondary/50 border-b">
        <div className="mx-auto w-full max-w-3xl space-y-4 px-6 py-12">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight">
            {t("framingHeading")}
          </h2>
          <p className="text-foreground leading-7">{framing.body}</p>
          <ul className="space-y-2">
            {framing.points.map((point, i) => (
              <li key={i} className="text-foreground flex items-start gap-2">
                <Check aria-hidden className="text-sea mt-1 size-4 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <Disclaimer>{framing.note}</Disclaimer>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <h2 className="text-foreground mb-8 text-2xl font-semibold tracking-tight">
          {t("elementsHeading")}
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {elements.map((el) => (
            <li key={el.id}>
              <article className="bg-card flex h-full flex-col gap-3 rounded-lg border p-6">
                <EnergyIcon id={el.id} />
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-foreground text-lg font-semibold">{el.title}</h3>
                  <Badge variant={MATURITY_VARIANT[el.maturity]}>{maturity[el.maturity]}</Badge>
                </div>
                <p className="text-foreground text-sm leading-6">{el.explainer}</p>
                <p className="border-sea text-muted-foreground border-l-2 pl-3 text-sm leading-6">
                  {el.herNote}
                </p>
                <p className="text-muted-foreground mt-auto text-xs">
                  {common("kilde")}: {el.source}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <MeldInteresseCta />
    </main>
  );
}
