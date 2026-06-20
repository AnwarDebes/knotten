import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/primitives/disclaimer";
import { PLOTS, type PlotStatus } from "@/content/plots";
import { plotSunSummary } from "@/lib/site-terrain";
import { getPublicPlots } from "@/lib/content/public";

type Props = { params: Promise<{ locale: string; code: string }> };

export const revalidate = 3600;

export function generateStaticParams() {
  return PLOTS.map((p) => ({ code: p.code.toLowerCase() }));
}

const STATUS_VARIANT: Record<PlotStatus, "success" | "warning" | "destructive"> = {
  ledig: "success",
  reservert: "warning",
  solgt: "destructive",
};

function findPlot(code: string) {
  return PLOTS.find((p) => p.code.toLowerCase() === code.toLowerCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, code } = await params;
  const plot = findPlot(code);
  if (!plot) return {};
  const t = await getTranslations({ locale, namespace: "tomt" });
  const href = { pathname: "/tomt/[code]" as const, params: { code: plot.code.toLowerCase() } };
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = getPathname({ href, locale: l });
  languages["x-default"] = getPathname({ href, locale: routing.defaultLocale });
  const title = t("metaTitle", { code: plot.code });
  const description = t("metaDescription", { code: plot.code });
  const indexable = process.env.SITE_INDEXABLE === "true";
  return {
    title,
    description,
    robots: indexable ? undefined : { index: false, follow: false },
    alternates: { canonical: getPathname({ href, locale: locale as Locale }), languages },
    openGraph: { title, description, type: "website" },
  };
}

export default async function PlotPage({ params }: Props) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const en = locale === "en";
  const plot = findPlot(code);
  if (!plot) notFound();

  const t = await getTranslations("tomt");
  const sun = plotSunSummary(plot.u, plot.v);

  // Live status and indicative price from the content layer, matched by label.
  const dbPlots = await getPublicPlots();
  const match = dbPlots.find(
    (d) =>
      d.label.toLowerCase() === plot.code.toLowerCase() ||
      d.label.toLowerCase() === `tomt ${plot.code.toLowerCase()}`,
  );
  const status = (match?.status as PlotStatus) ?? plot.status;
  const size = match?.sizeM2 ?? null;
  const price = match?.priceIndicative ?? null;
  const orientation = match?.orientation ?? null;

  return (
    <main id="main-content" className="flex-1">
      <section className="bg-secondary/30 border-b">
        <div className="mx-auto w-full max-w-3xl px-6 py-16">
          <p className="text-sea mb-3 text-sm font-medium tracking-wide uppercase">
            {t("eyebrow")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("title", { code: plot.code })}
            </h1>
            <Badge variant={STATUS_VARIANT[status]}>{t(`status.${status}`)}</Badge>
          </div>
          <p className="text-foreground mt-4 max-w-prose text-lg leading-8">{t("lead")}</p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-3xl gap-8 px-6 py-12 sm:grid-cols-2">
        <div>
          <h2 className="text-foreground mb-2 text-sm font-semibold">{t("specsHeading")}</h2>
          <dl className="border-border divide-border divide-y rounded-lg border px-4 text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">{t("size")}</dt>
              <dd className="text-foreground">{size ? `${size} m2` : t("toConfirm")}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">{t("orientation")}</dt>
              <dd className="text-foreground">
                {orientation ? t(`orientationOptions.${orientation}`) : t("toConfirm")}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">{t("price")}</dt>
              <dd className="text-foreground">
                {price
                  ? `ca. ${price.toLocaleString(en ? "en-GB" : "nb-NO")} kr`
                  : t("priceOnRequest")}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-foreground mb-2 text-sm font-semibold">{t("sunHeading")}</h2>
          <dl className="border-border divide-border divide-y rounded-lg border px-4 text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">{t("june")}</dt>
              <dd className="text-foreground">
                {sun.june} {t("hours")}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">{t("december")}</dt>
              <dd className="text-foreground">
                {sun.december} {t("hours")}
              </dd>
            </div>
          </dl>
          <p className="text-muted-foreground mt-2 text-xs">
            <Link href="/verktoy/sol" className="text-sea hover:underline">
              {t("sunTool")}
            </Link>
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 pb-12">
        <div className="border-border bg-card rounded-lg border p-6">
          <h2 className="text-foreground text-lg font-semibold">
            {t("ctaHeading", { code: plot.code })}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{t("ctaBody")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={{ pathname: "/meld-interesse", query: { tomt: plot.code } }}>
                {t("ctaButton", { code: plot.code })}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/omradet">{t("see3d")}</Link>
            </Button>
          </div>
        </div>
        <Disclaimer className="mt-3">{t("disclaimer")}</Disclaimer>
      </section>

      <MeldInteresseCta />
    </main>
  );
}
