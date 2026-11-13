import KlassiskPrivacy, { privacyText } from "@/components/klassisk/routes/PrivacyPage";
import { klassiskMeta } from "@/lib/meta";

export const metadata = klassiskMeta("/personvern", privacyText("no"));

/** Personvern in Klassisk (components/klassisk/routes/PrivacyPage.tsx, in both languages). */
export default function Personvern() {
  return <KlassiskPrivacy locale="no" />;
}
