import PageHead from "@/components/klassisk/PageHead";
import Privacy from "@/components/klassisk/Privacy";
import type { KLocale } from "@/lib/klassisk/locale";
import { privacyStatement, privacySwitches } from "@/lib/content/privacy";
import { minSidePath } from "@/lib/member-paths";
import { page } from "@/lib/pages";
import { MODEL_ON } from "@/lib/server/assistant";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";

/** The page's title and description, for the two routes' metadata. */
export const privacyText = (locale: KLocale) =>
  locale === "en"
    ? { title: "Privacy", description: "The privacy statement for Knotten: what we store, why, for how long, and how you can see it or have it deleted." }
    : { title: "Personvern", description: "Personvernerklæringen for Knotten: hva vi lagrer, hvorfor, hvor lenge, og hvordan du får innsyn i det eller får det slettet." };

/** Personvern in the Klassisk design, in Norwegian (/personvern) and English (/english/personvern). */
export default async function KlassiskPrivacy({ locale }: { locale: KLocale }) {
  const { company } = await loadPublicSettings();
  const s = privacyStatement(locale, { company, orgDisplay: formatOrgNumber(company.org_number), modelOn: MODEL_ON, ...privacySwitches(), minSideHref: minSidePath("klassisk", locale) });
  const name = page("privacy").name[locale];
  return (
    <>
      <PageHead title={name} crumb={name} locale={locale}>
        <p>{s.lede}</p>
      </PageHead>
      <Privacy locale={locale} s={s} />
    </>
  );
}
