import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ContentPage } from "@/components/site/content-page";
import { buildPageMetadata } from "@/lib/metadata";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicFaq } from "@/lib/content/public";

type Props = { params: Promise<{ locale: string }> };

// Refreshed on demand when FAQ entries change (the content actions call
// revalidatePath for this route), with an hourly backstop.
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "kontakt", "/kontakt");
}

export default async function KontaktPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const en = locale === "en";
  const faq = await getPublicFaq();

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

      {faq.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-foreground text-xl font-semibold tracking-tight">
            {en ? "Frequently asked questions" : "Ofte stilte sporsmal"}
          </h2>
          <dl className="border-border divide-border mt-4 divide-y rounded-lg border px-4">
            {faq.map((entry) => (
              <div key={entry.id} className="py-4">
                <dt className="text-foreground font-medium">
                  {en ? entry.questionEn : entry.questionNo}
                </dt>
                <dd className="text-muted-foreground mt-1 text-sm leading-6 whitespace-pre-line">
                  {en ? entry.answerEn : entry.answerNo}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </ContentPage>
  );
}
