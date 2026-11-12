import type { Metadata, Viewport } from "next";
import "../(klassisk)/globals.css";
import Shell from "@/components/klassisk/Shell";
import { FACT } from "@/lib/facts";
import { KLASSISK_SHARE, SITE, TITLE_TEMPLATE, brand } from "@/lib/meta";

/**
 * Klassisk in English: the same pages as the Norwegian Klassisk, under /english (src/lib/klassisk/locale.ts).
 * A root layout of its own, so the page says lang="en" from the first byte. Each page sets its own title,
 * description and canonical address through klassiskMeta(path, text, { locale: "en" }).
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: brand("Sea view at Rødberg"), template: TITLE_TEMPLATE },
  description: `Knotten: about ${FACT.plots} plots at Rødberg in Lindesnes, planned as Norway's most energy-friendly housing development.`,
  openGraph: { siteName: "Knotten", locale: "en_GB", type: "website", images: [KLASSISK_SHARE] },
};

export const viewport: Viewport = { themeColor: "#f6f8fa" };

export default function EnglishKlassiskLayout({ children }: { children: React.ReactNode }) {
  return <Shell locale="en">{children}</Shell>;
}
