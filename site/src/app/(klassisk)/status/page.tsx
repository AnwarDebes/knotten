import StatusPage from "@/components/klassisk/StatusPage";
import { klassiskMeta } from "@/lib/meta";
import { statusText } from "@/components/klassisk/routes/text";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";

export const metadata = klassiskMeta("/status", statusText("no"));

/** Status og spørsmål in Klassisk; the English twin is /english/status. */
export default async function Status() {
  const settings = await loadPublicSettings();
  return <StatusPage locale="no" settings={settings} orgDisplay={formatOrgNumber(settings.company.org_number)} />;
}
