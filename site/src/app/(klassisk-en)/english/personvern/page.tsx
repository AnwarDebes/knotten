import KlassiskPrivacy, { privacyText } from "@/components/klassisk/routes/PrivacyPage";
import { klassiskMeta } from "@/lib/meta";

export const metadata = klassiskMeta("/personvern", privacyText("en"), { locale: "en" });

/** Privacy in English Klassisk (components/klassisk/routes/PrivacyPage.tsx). */
export default function Privacy() {
  return <KlassiskPrivacy locale="en" />;
}
