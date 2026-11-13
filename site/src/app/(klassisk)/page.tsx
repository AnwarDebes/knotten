import HomePage from "@/components/klassisk/home/HomePage";
import { FACT } from "@/lib/facts";
import { klassiskMeta } from "@/lib/meta";

export const metadata = klassiskMeta("/", {
  title: "Sjøutsikt i Rødberg",
  description: `Knotten på Rødberg i Lindesnes: rundt ${FACT.plots} tomter i rekker over Sniksfjorden, planlagt som Norges mest energivennlige boligfelt. Hvert tall kan spores til kilden.`,
});

/** The Klassisk front page in Norwegian; the English twin is src/app/(klassisk-en)/english/page.tsx. */
export default function Home() {
  return <HomePage locale="no" />;
}
