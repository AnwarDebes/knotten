import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ContentPage } from "@/components/site/content-page";
import { buildPageMetadata } from "@/lib/metadata";
import { DELIVERABLES } from "@/lib/deliverables";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "forPartnere", "/for-kommune-og-partnere");
}

function kb(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const en = locale === "en";
  const t = await getTranslations("forPartnere");

  return (
    <ContentPage namespace="forPartnere">
      <section>
        <h2 className="text-foreground text-xl font-semibold tracking-tight">{t("kitHeading")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("kitIntro")}</p>
        <ul className="border-border divide-border mt-4 divide-y rounded-lg border">
          {DELIVERABLES.map((d) => (
            <li
              key={d.file}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <a
                  href={`/deliverables/${d.file}`}
                  download
                  className="text-sea plausible-event-name=Dokument+nedlasting font-medium hover:underline"
                >
                  {en ? d.titleEn : d.titleNo}
                </a>
                {d.norwegianOnly ? (
                  <span className="text-muted-foreground ml-2 text-xs">({t("norwegianOnly")})</span>
                ) : null}
              </div>
              <span className="text-muted-foreground text-xs whitespace-nowrap uppercase">
                {d.ext} &middot; {kb(d.bytes)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-3 text-xs">{t("kitNote")}</p>
      </section>
    </ContentPage>
  );
}
