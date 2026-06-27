import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Newsreader, Schibsted_Grotesk } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";
import { SkipLink } from "@/components/ui/skip-link";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Analytics } from "@/components/analytics/plausible";
import { SiteJsonLd } from "@/components/site/json-ld";

// Schibsted Grotesk carries body, UI and data: a grotesque commissioned in
// Oslo (for Schibsted's titles, Aftenposten and VG), so its Nordic provenance
// is real, not decorative. Newsreader is the display serif, used large and
// light for the emotional register. Both self-hosted via next/font, swap.
const sans = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  display: "swap",
});
const display = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const indexable = process.env.SITE_INDEXABLE === "true";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("metaTitle"),
      template: "%s | Knotten",
    },
    description: t("metaDescription"),
    robots: indexable ? undefined : { index: false, follow: false },
    openGraph: {
      siteName: "Knotten",
      type: "website",
      locale: locale === "no" ? "nb_NO" : "en_GB",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  const nav = await getTranslations("nav");

  return (
    <html lang={locale} className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={messages}>
          <SkipLink>{nav("skipToContent")}</SkipLink>
          <SiteHeader />
          {children}
          <SiteFooter />
        </NextIntlClientProvider>
        <SiteJsonLd />
        <Analytics />
      </body>
    </html>
  );
}
