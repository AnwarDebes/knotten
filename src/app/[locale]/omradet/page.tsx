import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";
import { PageHero } from "@/components/site/page-hero";
import { PlotMap } from "@/components/terrain/plot-map";
import { ExperienceCta } from "@/components/experience/experience-cta";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/primitives/disclaimer";
import { getPublicPlots } from "@/lib/content/public";

type Props = { params: Promise<{ locale: string }> };

// Statically generated, refreshed on demand when the owner edits plots (the
// content actions call revalidatePath for this route) and hourly as a backstop.
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "omradet", "/omradet");
}

type Block = { heading: string; body: string };

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  ledig: "success",
  reservert: "warning",
  solgt: "destructive",
};

const COPY = {
  no: {
    heading: "Tomteoversikt",
    intro: "Status og indikative priser oppdateres fortlopende.",
    col: { name: "Tomt", status: "Status", size: "Storrelse", price: "Indikativ pris" },
    statusLabel: { ledig: "Ledig", reservert: "Reservert", solgt: "Solgt" } as Record<
      string,
      string
    >,
    forbehold:
      "Alle priser er indikative estimater og ikke endelige. Antall tomter, grenser og priser bekreftes etter oppmaling og regulering.",
    none: "-",
  },
  en: {
    heading: "Plot overview",
    intro: "Status and indicative prices are updated continuously.",
    col: { name: "Plot", status: "Status", size: "Size", price: "Indicative price" },
    statusLabel: { ledig: "Available", reservert: "Reserved", solgt: "Sold" } as Record<
      string,
      string
    >,
    forbehold:
      "All prices are indicative estimates and not final. Plot count, boundaries and prices are confirmed after survey and zoning.",
    none: "-",
  },
};

export default async function OmradetPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("omradet");
  const blocks = t.raw("blocks") as Block[];
  const plots = await getPublicPlots();
  const c = COPY[locale === "en" ? "en" : "no"];

  return (
    <main id="main-content" className="flex-1">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />

      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <PlotMap />
      </section>

      <ExperienceCta />

      {plots.length > 0 ? (
        <section className="mx-auto w-full max-w-3xl px-6 pb-12">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">{c.heading}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{c.intro}</p>
          <div className="border-border mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-muted-foreground text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">{c.col.name}</th>
                  <th className="px-4 py-2 font-medium">{c.col.status}</th>
                  <th className="px-4 py-2 font-medium">{c.col.size}</th>
                  <th className="px-4 py-2 font-medium">{c.col.price}</th>
                </tr>
              </thead>
              <tbody>
                {plots.map((p) => (
                  <tr key={p.id} className="border-border border-t">
                    <td className="text-foreground px-4 py-2">{p.label}</td>
                    <td className="px-4 py-2">
                      <Badge variant={STATUS_VARIANT[p.status] ?? "success"}>
                        {c.statusLabel[p.status] ?? p.status}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {p.sizeM2 ? `${p.sizeM2} m2` : c.none}
                    </td>
                    <td className="text-muted-foreground px-4 py-2">
                      {p.priceIndicative
                        ? `${p.priceIndicative.toLocaleString(locale === "en" ? "en-GB" : "nb-NO")} kr`
                        : c.none}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Disclaimer className="mt-3">{c.forbehold}</Disclaimer>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-3xl space-y-10 px-6 pb-12">
        {blocks.map((block, i) => (
          <div key={i} className="space-y-2">
            <h2 className="text-foreground text-xl font-semibold tracking-tight">
              {block.heading}
            </h2>
            <p className="text-foreground leading-7">{block.body}</p>
          </div>
        ))}
      </section>

      <MeldInteresseCta />
    </main>
  );
}
