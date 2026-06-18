import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContentPage } from "@/components/site/content-page";
import { buildPageMetadata } from "@/lib/metadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ locale: string }> };

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
        {tools.map((tool) => (
          <li key={tool.slug}>
            <Card className="h-full">
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle>{tool.title}</CardTitle>
                <Badge variant="outline">{common("kommerSnart")}</Badge>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm leading-6">
                {tool.body}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </ContentPage>
  );
}
