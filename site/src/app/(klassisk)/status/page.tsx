import StatusPage from "@/components/klassisk/StatusPage";
import { klassiskMeta } from "@/lib/meta";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";

export const metadata = klassiskMeta("/status", {
  title: "Status og spørsmål",
  description: "Hvor Knotten står, hva som ikke er bestemt ennå, og svar på det folk spør om: salg, pris, sjøutsikt, reguleringsplan og hvem som står bak.",
});

export default async function Status() {
  const settings = await loadPublicSettings();
  return <StatusPage locale="no" settings={settings} orgDisplay={formatOrgNumber(settings.company.org_number)} />;
}
