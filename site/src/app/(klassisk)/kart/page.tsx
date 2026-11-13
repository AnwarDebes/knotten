import { klassiskMeta } from "@/lib/meta";
import MapsPage from "@/components/klassisk/plots/MapsPage";

export const metadata = klassiskMeta("/kart", { title: "Kart og terreng", description: "Prosjekteiers kart og et terrengkart laget for nettsiden, fra siktlinjen ut til havet til den første skissen av boligrekkene." });

export default function Kart() {
  return <MapsPage locale="no" />;
}
