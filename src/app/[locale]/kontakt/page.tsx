import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ContentPage } from "@/components/site/content-page";
import { buildPageMetadata } from "@/lib/metadata";
import { Card, CardContent } from "@/components/ui/card";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "kontakt", "/kontakt");
}

export default async function KontaktPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ContentPage namespace="kontakt">
      <Card>
        <CardContent className="text-foreground space-y-1 pt-6">
          <p className="font-semibold">Sigve Simonsen</p>
          <p className="text-muted-foreground text-sm">Daglig leder, Sigve Simonsen AS</p>
          <p className="pt-2">
            <a className="text-sea hover:underline" href="tel:+4795495152">
              +47 954 95 152
            </a>
          </p>
          <p>
            <a className="text-sea hover:underline" href="mailto:sigve.simonsen@hotmail.com">
              sigve.simonsen@hotmail.com
            </a>
          </p>
        </CardContent>
      </Card>
    </ContentPage>
  );
}
