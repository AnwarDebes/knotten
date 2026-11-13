import { klassiskMeta } from "@/lib/meta";
import ByggPage from "./ByggPage";

export const metadata = klassiskMeta("/eksisterende-bygg", { title: "Eksisterende bygg", description: "Kontorbygget og bolighuset som står på eiendommen i dag, og tilbygget til kontoret og lager- og verkstedbygget som er planlagt. Målt forbruk blir sammenligningsgrunnlaget for de nye boligene." });

export default function Bygg() {
  return <ByggPage locale="no" />;
}
