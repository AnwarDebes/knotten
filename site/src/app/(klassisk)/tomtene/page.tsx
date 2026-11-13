import { klassiskMeta } from "@/lib/meta";
import PickerPage from "@/components/klassisk/plots/PickerPage";
import { FACT, word } from "@/lib/facts";

export const metadata = klassiskMeta("/tomtene", { title: "Tomtene", description: `Tomtevelger for Knotten: rundt ${FACT.plots} tomter i ${word(FACT.rows)} rekker oppover skråningen, med sol, sjø i sikt, høyde og status for hver tomt.` });

export default function Tomtene() {
  return <PickerPage locale="no" />;
}
