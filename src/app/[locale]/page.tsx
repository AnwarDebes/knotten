import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
// Locale is used to narrow the route param string when resolving paths.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/primitives/disclaimer";
import { MeldInteresseCta } from "@/components/site/meld-interesse-cta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = getPathname({ href: "/", locale: l });
  languages["x-default"] = getPathname({ href: "/", locale: routing.defaultLocale });
  return {
    alternates: { canonical: getPathname({ href: "/", locale: locale as Locale }), languages },
  };
}

type Highlight = { title: string; body: string };
type Block = { heading: string; body: string };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const nav = await getTranslations("nav");
  const cta = await getTranslations("cta");
  const highlights = t.raw("highlights") as Highlight[];
  const blocks = t.raw("blocks") as Block[];

  return (
    <main id="main-content" className="flex-1">
      <section className="bg-secondary/30 border-b">
        <div className="mx-auto w-full max-w-4xl px-6 py-20">
          <p className="text-sea mb-3 text-sm font-medium tracking-wide uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="text-foreground mt-5 max-w-2xl text-lg leading-8">{t("lead")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/meld-interesse">{cta("button")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/energikonseptet">{t("ctaSecondary")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, i) => (
            <li key={i}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{h.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm leading-6">
                  {h.body}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-3xl space-y-10 px-6 pb-14">
        {blocks.map((block, i) => (
          <div key={i} className="space-y-2">
            <h2 className="text-foreground text-xl font-semibold tracking-tight">
              {block.heading}
            </h2>
            <p className="text-foreground leading-7">{block.body}</p>
          </div>
        ))}
        {t.has("note") ? <Disclaimer>{t("note")}</Disclaimer> : null}
        <p className="text-muted-foreground text-sm">
          <Link href="/for-kommune-og-partnere" className="text-sea hover:underline">
            {nav("forPartnere")}
          </Link>
        </p>
      </section>

      <MeldInteresseCta />
    </main>
  );
}
