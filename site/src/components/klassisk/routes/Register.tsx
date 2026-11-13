import { redirect } from "next/navigation";
import { KSignUpPage } from "@/components/klassisk/members/Pages";
import { getSession } from "@/lib/auth";
import { loadPlots } from "@/lib/data";
import type { KLocale } from "@/lib/klassisk/locale";
import { minSidePath, plotsFromQuery } from "@/lib/member-paths";
import { LINK_HOURS } from "@/lib/server/accounts";
import { formStamp } from "@/lib/server/human";
import { STORAGE } from "@/lib/server/kv";
import { signupByEmail } from "@/lib/server/member-store";

export type RegisterSearch = { tomt?: string | string[]; plot?: string | string[] };

/**
 * Sign-up for buyers in the Klassisk design, in Norwegian (/registrer) and English (/english/registrer). Accepts
 * ?tomt=7 or ?plot=plot-07. A buyer who is already logged in goes to Min side in the same language.
 */
export default async function KlassiskRegister({ locale, search }: { locale: KLocale; search: RegisterSearch }) {
  const session = await getSession();
  if (session?.kind === "member") redirect(minSidePath("klassisk", locale));
  const open = STORAGE !== "temp";
  const [{ plots }, byEmail, stamp] = await Promise.all([loadPlots(), open ? signupByEmail() : false, open ? formStamp("signup") : ""]);
  const ids = plots.map((p) => p.id);
  const preselect = plotsFromQuery(search).filter((p) => ids.includes(p));
  return <KSignUpPage locale={locale} open={open} plots={ids} preselect={preselect} stamp={stamp} byEmail={byEmail} hours={LINK_HOURS.verify} />;
}
