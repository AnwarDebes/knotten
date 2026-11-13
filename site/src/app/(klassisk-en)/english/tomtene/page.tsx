import { klassiskMeta } from "@/lib/meta";
import PickerPage from "@/components/klassisk/plots/PickerPage";
import { FACT, word } from "@/lib/facts";

export const metadata = klassiskMeta("/tomtene", { title: "Plots", description: `The plot picker for Knotten: about ${FACT.plots} plots in ${word(FACT.rows, "en")} rows up the slope, with sun, water in view, elevation and status for each plot.` }, { locale: "en" });

export default function Plots() {
  return <PickerPage locale="en" />;
}
