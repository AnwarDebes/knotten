import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ContentPage } from "@/components/site/content-page";
import { buildPageMetadata } from "@/lib/metadata";
import { CommunityDashboard } from "@/components/dashboard/community-dashboard";

type Props = { params: Promise<{ locale: string }> };

// Refreshed when the dashboard parameters change (the content action calls
// revalidatePath for this route) and hourly as a backstop.
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata(locale, "robusthet", "/robusthet");
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ContentPage namespace="robusthet">
      <CommunityDashboard />
    </ContentPage>
  );
}
