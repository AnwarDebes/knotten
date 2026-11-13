import KlassiskMinSide, { type MinSideSearch } from "@/components/klassisk/routes/MinSide";
import { mineText } from "@/components/klassisk/routes/text";
import { klassiskMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = { ...klassiskMeta("/min-side", mineText("no")), robots: { index: false, follow: false } };

/** Min side in Klassisk (components/klassisk/routes/MinSide.tsx); the English twin is /english/min-side. */
export default async function MinSide({ searchParams }: { searchParams: Promise<MinSideSearch> }) {
  return <KlassiskMinSide locale="no" search={await searchParams} />;
}
