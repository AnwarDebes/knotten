import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContentPage } from "@/components/site/content-page";
import { buildPageMetadata } from "@/lib/metadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

// Tools that are live link to their page; the rest are marked "coming soon".
const AVAILABLE: Record<
  string,
  | "/verktoy/energi"
  | "/verktoy/strompris"
  | "/verktoy/manedskostnad"
  | "/verktoy/sol"
  | "/verktoy/naromrade"
  | "/verktoy/strombrudd"
  | "/verktoy/konfigurator"
> = {
  energi: "/verktoy/energi",
  stromtrygghet: "/verktoy/strompris",
  manedskostnad: "/verktoy/manedskostnad",
  sol: "/verktoy/sol",
  naromrade: "/verktoy/naromrade",
  strombrudd: "/verktoy/strombrudd",
  konfigurator: "/verktoy/konfigurator",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "verktoy", "/verktoy");
}

type Tool = { title: string; body: string; slug: string };

export default async function VerktoyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("verktoy");
  const common = await getTranslations("common");
  const tools = t.raw("tools") as Tool[];

  return (
    <ContentPage namespace="verktoy">
      <ul className="grid gap-6 sm:grid-cols-2">
        {tools.map((tool) => {
          const href = AVAILABLE[tool.slug];
          const card = (
            <Card className={href ? "hover:border-sea h-full transition-colors" : "h-full"}>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle>{tool.title}</CardTitle>
                {href ? (
                  <ArrowRight aria-hidden className="text-sea size-5" />
                ) : (
                  <Badge variant="outline">{common("kommerSnart")}</Badge>
                )}
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-6">
                {tool.body}
              </CardContent>
            </Card>
          );
          return (
            <li key={tool.slug}>
              {href ? (
                <Link
                  href={href}
                  className="focus-visible:ring-ring block rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>
    </ContentPage>
  );
}
