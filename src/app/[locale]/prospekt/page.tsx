import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ContentPage } from "@/components/site/content-page";
import { buildPageMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "prospekt", "/prospekt");
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContentPage namespace="prospekt" />;
}
