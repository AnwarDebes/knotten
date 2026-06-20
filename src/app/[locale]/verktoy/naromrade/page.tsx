import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { NeighbourhoodMap } from "@/components/map/neighbourhood-map";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/primitives/disclaimer";
import { AMENITIES } from "@/content/amenities";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "naromrade", "/verktoy/naromrade");
}

export default async function NaromradePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const en = locale === "en";
  const t = await getTranslations("naromrade");

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

      <section className="mx-auto w-full max-w-5xl space-y-8 px-6 py-12">
        {/* HTML-first amenity list: server-rendered, crawlable, the accessible fallback. */}
        <div>
          <h2 className="text-foreground mb-4 text-xl font-semibold tracking-tight">
            {t("listHeading")}
          </h2>
          <ul className="border-border divide-border divide-y rounded-lg border">
            {AMENITIES.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="text-foreground font-medium">
                    {en ? a.nameEn : a.nameNo}
                    {!a.confirmed ? (
                      <Badge variant="outline" className="ml-2 align-middle">
                        {t("toConfirm")}
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t("source")}: {a.source} ({a.verified})
                  </p>
                </div>
                <span className="text-foreground text-sm whitespace-nowrap">
                  {a.distanceKm != null && a.driveMin != null
                    ? `ca. ${a.distanceKm} km / ${a.driveMin} min`
                    : t("inArea")}
                </span>
              </li>
            ))}
          </ul>
          <Disclaimer className="mt-3">{t("note")}</Disclaimer>
        </div>

        <div>
          <h2 className="text-foreground mb-4 text-xl font-semibold tracking-tight">
            {t("mapHeading")}
          </h2>
          <NeighbourhoodMap />
          <p className="text-muted-foreground mt-2 text-xs">{t("attribution")}</p>
        </div>
      </section>

      <MeldInteresseCta />
    </main>
  );
}
