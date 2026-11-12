import { klassiskMeta } from "@/lib/meta";
import PlotStage from "@/components/klassisk/PlotStage";
import { FACT, word } from "@/lib/facts";

export const metadata = klassiskMeta("/tomtene", { title: "Tomtene", description: `Tomtevelger for Knotten: rundt ${FACT.plots} tomter i ${word(FACT.rows)} rekker oppover skråningen.` });

export default function Tomtene() {
  return <PlotStage />;
}
