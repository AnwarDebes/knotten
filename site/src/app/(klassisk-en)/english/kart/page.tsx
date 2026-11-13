import { klassiskMeta } from "@/lib/meta";
import MapsPage from "@/components/klassisk/plots/MapsPage";

export const metadata = klassiskMeta("/kart", { title: "Maps and terrain", description: "The project owner's maps and a terrain map made for the website, from the sight line out to the sea to the first sketch of the rows of homes." }, { locale: "en" });

export default function Maps() {
  return <MapsPage locale="en" />;
}
