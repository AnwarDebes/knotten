import type { Metadata } from "next";
import { Newsreader, Schibsted_Grotesk } from "next/font/google";
import "../globals.css";

// Mirror the public site's type so the admin inherits the same identity and no
// unused webfonts ship. globals.css maps --font-sans to --font-schibsted.
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

export const metadata: Metadata = {
  title: "Knotten admin",
  robots: { index: false, follow: false },
};

// The admin area is always rendered on demand: every route is auth-gated and
// reads live data, so nothing here may be prerendered at build time.
export const dynamic = "force-dynamic";

/**
 * Root layout for the non-localized admin area. It is deliberately separate
 * from the public site shell: no marketing header or footer, no analytics, and
 * always noindex. Personal data lives only behind this surface.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="bg-secondary/20 text-foreground min-h-full">{children}</body>
    </html>
  );
}
