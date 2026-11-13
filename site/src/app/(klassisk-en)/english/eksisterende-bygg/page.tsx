import { klassiskMeta } from "@/lib/meta";
import ByggPage from "@/app/(klassisk)/eksisterende-bygg/ByggPage";

export const metadata = klassiskMeta("/eksisterende-bygg", { title: "Existing buildings", description: "The office building and the house that stand on the property today, and the office extension and the warehouse and workshop that are planned. Their measured consumption becomes the basis of comparison for the new homes." }, { locale: "en" });

export default function Buildings() {
  return <ByggPage locale="en" />;
}
