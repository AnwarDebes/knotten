import PageHead from "@/components/klassisk/PageHead";
import Privacy from "@/components/klassisk/Privacy";
import { klassiskMeta } from "@/lib/meta";
import { privacyStatement, privacySwitches } from "@/lib/content/privacy";
import { MODEL_ON } from "@/lib/server/assistant";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";

export const metadata = klassiskMeta("/personvern", { title: "Personvern", description: "Personvernerklæringen for Knotten: hva vi lagrer, hvorfor, hvor lenge, og hvordan du får innsyn i det eller får det slettet." });

export default async function Personvern() {
  const { company } = await loadPublicSettings();
  const s = privacyStatement("no", { company, orgDisplay: formatOrgNumber(company.org_number), modelOn: MODEL_ON, ...privacySwitches(), minSideHref: "/min-side" });
  return (
    <>
      <PageHead title="Personvern" crumb="Personvern">
        <p>{s.lede}</p>
      </PageHead>
      <Privacy locale="no" s={s} />
    </>
  );
}
