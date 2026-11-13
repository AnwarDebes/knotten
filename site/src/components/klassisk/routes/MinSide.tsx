import { redirect } from "next/navigation";
import { KMinSidePage } from "@/components/klassisk/members/Pages";
import { getSession } from "@/lib/auth";
import type { KLocale } from "@/lib/klassisk/locale";
import { loginPagePath, minSidePath } from "@/lib/member-paths";
import { MT } from "@/lib/member-text";
import { minSideData, signupByEmail } from "@/lib/server/member-store";

export type MinSideSearch = { ny?: string; velkommen?: string; bekreftet?: string };

/**
 * Min side in the Klassisk design, in Norwegian (/min-side) and English (/english/min-side). Visitors without a login
 * are sent to the login page of the same language by the proxy; a project account has its own page in the portal.
 */
export default async function KlassiskMinSide({ locale, search }: { locale: KLocale; search: MinSideSearch }) {
  const session = await getSession();
  const login = loginPagePath("klassisk", locale);
  if (!session) redirect(`${login}?next=${encodeURIComponent(minSidePath("klassisk", locale))}`);
  if (session.kind !== "member") redirect(`/${locale}/portal/konto`);
  const [data, byEmail] = await Promise.all([minSideData(session.id), signupByEmail()]);
  if (!data) redirect(login);
  const t = MT[locale];
  const banner = search.ny ? t.welcomeNew : search.velkommen ? t.welcomeVerified : search.bekreftet ? t.confirmed : "";
  return <KMinSidePage locale={locale} data={data} byEmail={byEmail} banner={banner} />;
}
