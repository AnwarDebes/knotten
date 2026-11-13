import StatusPage from "@/components/klassisk/StatusPage";
import { klassiskMeta } from "@/lib/meta";
import { statusText } from "@/components/klassisk/routes/text";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";

export const metadata = klassiskMeta("/status", statusText("en"), { locale: "en" });

/** Status and questions in English Klassisk; the Norwegian twin is /status. */
export default async function Status() {
  const settings = await loadPublicSettings();
  return <StatusPage locale="en" settings={settings} orgDisplay={formatOrgNumber(settings.company.org_number)} />;
}
