import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Knotten admin",
  robots: { index: false, follow: false },
};

/**
 * Root layout for the non-localized admin area. It is deliberately separate
 * from the public site shell: no marketing header or footer, no analytics, and
 * always noindex. Personal data lives only behind this surface.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="bg-secondary/20 text-foreground min-h-full">{children}</body>
    </html>
  );
}
