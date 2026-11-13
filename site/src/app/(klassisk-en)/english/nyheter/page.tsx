import KlassiskNews from "@/components/klassisk/routes/News";
import { newsText } from "@/components/klassisk/routes/text";
import { klassiskMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = klassiskMeta("/nyheter", newsText("en"), { locale: "en" });

/** News in English Klassisk (components/klassisk/routes/News.tsx); the Norwegian twin is /nyheter. */
export default function News() {
  return <KlassiskNews locale="en" />;
}
