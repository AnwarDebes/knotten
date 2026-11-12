import type { Metadata, Viewport } from "next";
import "./globals.css";
import Shell from "@/components/klassisk/Shell";
import { FACT } from "@/lib/facts";
import { KLASSISK_SHARE, SITE, TITLE_TEMPLATE, brand } from "@/lib/meta";

/**
 * The defaults for every Klassisk page. Each page sets its own title, description, canonical address and
 * link preview through klassiskMeta (src/lib/meta.ts); the canonical address is never set here, so a page
 * without its own never claims to be the front page.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: brand("Sjøutsikt i Rødberg"), template: TITLE_TEMPLATE },
  description: `Knotten: rundt ${FACT.plots} tomter på Rødberg i Lindesnes, planlagt som Norges mest energivennlige boligfelt.`,
  openGraph: { siteName: "Knotten", locale: "nb_NO", type: "website", images: [KLASSISK_SHARE] },
};

export const viewport: Viewport = { themeColor: "#f6f8fa" };

/** Klassisk, the default design: the front door (/) and the Norwegian pages beside it. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
