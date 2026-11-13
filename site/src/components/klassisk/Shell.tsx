import { serif, sans } from "./fonts";
import Header from "./Header";
import Footer from "./Footer";
import Contours from "./Contours";
import TerrainProgress from "./TerrainProgress";
import SourceProvider from "./Source";
import DesignSwitch from "@/components/DesignSwitch";
import Track from "@/components/Track";
import Chat from "@/components/ui/Chat";

/**
 * The whole Klassisk page around the content, used by the Klassisk layouts: Norwegian at the root and English
 * under /english (src/app/(klassisk-en)). `locale` sets the page language.
 */
export default function Shell({ children, locale = "no" }: { children: React.ReactNode; locale?: "no" | "en" }) {
  return (
    <html lang={locale === "en" ? "en" : "nb"} data-scroll-behavior="smooth" className={`${serif.variable} ${sans.variable}`}>
      <body suppressHydrationWarning>
        <a className="skip" href="#innhold">{locale === "en" ? "Skip to the content" : "Hopp til innholdet"}</a>
        <Contours />
        <SourceProvider>
          <DesignSwitch current="klassisk" />
          <Header />
          <main id="innhold" tabIndex={-1} style={{ outline: "none" }}>{children}</main>
          <Footer locale={locale} />
          <TerrainProgress />
          <Track design="klassisk" />
          <Chat locale={locale} variant="klassisk" />
        </SourceProvider>
      </body>
    </html>
  );
}
