import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Cinzel, Geist } from "next/font/google";
import "../globals.css";
import { isLocale } from "@/lib/i18n";
import { FACT } from "@/lib/facts";
import { SITE, TITLE_TEMPLATE, brand } from "@/lib/meta";
import { serif as nfSerif, sans as nfSans } from "@/components/klassisk/fonts-404";
import Track from "@/components/Track";
import Footer from "@/components/ui/Footer";
import Chat from "@/components/ui/Chat";
import Motion from "@/components/ui/Motion";
import DesignSwitch from "@/components/DesignSwitch";
import SiteOnly from "@/components/ui/SiteOnly";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz", "wdth"],
  display: "swap",
});

/* the wordmark of the logo: wide, quiet capitals. Only the logo's fallback uses it (when logo.png is
   missing), so it is fetched when needed instead of preloaded on every page */
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  preload: false,
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export function generateStaticParams() {
  return [{ locale: "no" }, { locale: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  // an unknown first part of the address (/finnes-ikke): the site's one 404, never indexed
  if (!isLocale(locale)) return { metadataBase: new URL(SITE), title: { absolute: brand("Denne siden finnes ikke") }, robots: { index: false } };
  const en = locale === "en";
  return {
    metadataBase: new URL(SITE),
    title: { default: brand(en ? "Sea view at Rødberg" : "Sjøutsikt i Rødberg"), template: TITLE_TEMPLATE },
    description: en
      ? `About ${FACT.plots} energy-friendly homes on a wooded knoll above the Audna, near Sniksfjorden in Lindesnes. The terrain is measured, the sun is real. Stand on the plot before it exists.`
      : `Rundt ${FACT.plots} energivennlige boliger på en skogkledd knaus over Audna, nær Sniksfjorden i Lindesnes. Terrenget er målt, solen er ekte. Stå på tomten før den finnes.`,
  };
}

export const viewport: Viewport = {
  themeColor: "#f5f8fa",
  width: "device-width",
  initialScale: 1,
};

/**
 * Moderne's root layout, once per language (/no and /en). The language sits on <html>, so screen
 * readers, translation tools and search engines read each page in the right language.
 */
export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  // an unknown first part of the address (/finnes-ikke) still arrives here; its page calls notFound(), and
  // not-found.tsx shows the site's one 404 (components/NotFoundPage.tsx) in a bare document, as global-not-found does
  if (!isLocale(l)) {
    return (
      <html lang="nb" className={`${nfSerif.variable} ${nfSans.variable}`}>
        <body className="nf-body">{children}</body>
      </html>
    );
  }
  const locale = l;
  return (
    <html lang={locale === "no" ? "nb" : "en"} data-scroll-behavior="smooth" className={`${bricolage.variable} ${geist.variable} ${cinzel.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <SiteOnly hideOn="portal"><DesignSwitch current="moderne" locale={locale} /></SiteOnly>
        <main className="flex-1">{children}</main>
        <SiteOnly>
          <Footer locale={locale} />
          <Chat locale={locale} />
          <Motion />
        </SiteOnly>
        <Track design="moderne" />
      </body>
    </html>
  );
}
