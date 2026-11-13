import KlassiskNews from "@/components/klassisk/routes/News";
import { newsText } from "@/components/klassisk/routes/text";
import { klassiskMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = klassiskMeta("/nyheter", newsText("no"));

/** Nyheter in Klassisk (components/klassisk/routes/News.tsx); the English twin is /english/nyheter. */
export default function Nyheter() {
  return <KlassiskNews locale="no" />;
}
