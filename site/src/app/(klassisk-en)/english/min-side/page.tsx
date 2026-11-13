import KlassiskMinSide, { type MinSideSearch } from "@/components/klassisk/routes/MinSide";
import { mineText } from "@/components/klassisk/routes/text";
import { klassiskMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = { ...klassiskMeta("/min-side", mineText("en"), { locale: "en" }), robots: { index: false, follow: false } };

/** My page in English Klassisk (components/klassisk/routes/MinSide.tsx); the Norwegian twin is /min-side. */
export default async function MyPage({ searchParams }: { searchParams: Promise<MinSideSearch> }) {
  return <KlassiskMinSide locale="en" search={await searchParams} />;
}
