import type { Metadata } from "next";
import { serif, sans } from "@/components/klassisk/fonts-404";
import NotFoundPage from "@/components/NotFoundPage";
import { brand } from "@/lib/meta";

export const metadata: Metadata = { title: brand("Denne siden finnes ikke"), robots: { index: false } };

/**
 * The 404 for addresses no route matches. The site has two root layouts (one per design), so this page brings its
 * own document. Unknown first parts of the address (/finnes-ikke) are caught by the Moderne [locale] route instead,
 * and its not-found page shows this same page (components/NotFoundPage.tsx): one 404 for the whole site.
 */
export default function GlobalNotFound() {
  return (
    <html lang="nb" className={`${serif.variable} ${sans.variable}`}>
      <body className="nf-body">
        <NotFoundPage />
      </body>
    </html>
  );
}
