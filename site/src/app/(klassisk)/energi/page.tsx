import { klassiskMeta } from "@/lib/meta";
import EnergiPage from "./EnergiPage";

export const metadata = klassiskMeta("/energi", { title: "Energi og teknologi", description: "Energikonseptet for Knotten: sol, bergvarme, batteri i hver bolig og smart styring, med energisporets vurdering av hvert tiltak, energiregnskapet, brønnparken og retningen fra prosjekteier. Alle tall er foreløpige." });

export default function Energi() {
  return <EnergiPage locale="no" />;
}
