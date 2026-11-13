import HomePage from "@/components/klassisk/home/HomePage";
import { FACT } from "@/lib/facts";
import { klassiskMeta } from "@/lib/meta";

export const metadata = klassiskMeta("/", {
  title: "Sea view at Rødberg",
  description: `Knotten at Rødberg in Lindesnes: about ${FACT.plots} plots in rows above Sniksfjorden, planned as Norway's most energy-friendly housing development. Every figure can be traced to its source.`,
}, { locale: "en" });

/** The Klassisk front page in English; the Norwegian twin is src/app/(klassisk)/page.tsx. */
export default function Home() {
  return <HomePage locale="en" />;
}
