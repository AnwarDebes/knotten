import { klassiskMeta } from "@/lib/meta";
import EnergiPage from "@/app/(klassisk)/energi/EnergiPage";

export const metadata = klassiskMeta("/energi", { title: "Energy and technology", description: "The energy concept for Knotten: solar, bedrock heat, a battery in every home and smart control, with the energy track's assessment of every measure, the energy budget, the borehole field and the project owner's direction. All figures are provisional." }, { locale: "en" });

export default function Energy() {
  return <EnergiPage locale="en" />;
}
