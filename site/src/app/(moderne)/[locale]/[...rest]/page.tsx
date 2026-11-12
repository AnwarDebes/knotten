import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { brand } from "@/lib/meta";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return { title: { absolute: brand("Denne siden finnes ikke") }, robots: { index: false } };
  return { title: locale === "en" ? "Page not found" : "Fant ikke siden", robots: { index: false } };
}

/**
 * Any address under /no or /en that no page answers gets the 404 in the visitor's language and design; a deeper
 * address under an unknown first part (/finnes/ikke) gets the site's one 404 (see not-found.tsx).
 */
export default function Missing() {
  notFound();
}
