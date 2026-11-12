import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Nav from "@/components/ui/Nav";
import SignUpForm from "@/components/members/SignUpForm";
import { getSession } from "@/lib/auth";
import { loadPlots } from "@/lib/data";
import { STORAGE_MESSAGE } from "@/lib/errors";
import { isLocale, type Locale } from "@/lib/i18n";
import { MT } from "@/lib/member-text";
import { contactPath, loginPagePath, minSidePath, plotsFromQuery } from "@/lib/member-paths";
import { pageMeta } from "@/lib/meta";
import { formStamp } from "@/lib/server/human";
import { LINK_HOURS } from "@/lib/server/accounts";
import { STORAGE } from "@/lib/server/kv";
import { signupByEmail } from "@/lib/server/member-store";

export const dynamic = "force-dynamic";

const meta = pageMeta("/registrer", {
  no: { title: "Opprett konto", description: "Opprett en kjøperkonto for Knotten: følg tomtene, lagre husene du setter sammen og bestem hva vi kan sende deg." },
  en: { title: "Create an account", description: "Create a buyer account for Knotten: follow the plots, save the houses you put together and decide what we may send you." },
});
export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return { ...(await meta(props)), robots: { index: false, follow: true } };
}

/** Sign-up for buyers (Moderne look, Norwegian and English). The form posts to lib/server/members.ts. */
export default async function Registrer({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ tomt?: string | string[]; plot?: string | string[] }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const t = MT[locale];
  const session = await getSession();
  // a buyer who is logged in already has Min side
  if (session?.kind === "member") redirect(minSidePath("moderne", locale));
  const open = STORAGE !== "temp";
  const [{ plots }, byEmail, stamp] = await Promise.all([loadPlots(), open ? signupByEmail() : false, open ? formStamp("signup") : ""]);
  const ids = plots.map((p) => p.id);
  const preselect = plotsFromQuery(await searchParams).filter((p) => ids.includes(p));
  return (
    <>
      <Nav locale={locale} />
      <section className="wrap pt-10 md:pt-16 pb-16 md:pb-24 grid gap-10 lg:gap-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-start">
        <div className="grid gap-6 lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
          <div className="label uppercase tracking-[.12em]">{t.signupEyebrow}</div>
          <h1 className="display text-[clamp(42px,6vw,80px)] max-w-[12ch]">{t.signupTitle}</h1>
          <p className="lede max-w-[46ch]">{t.signupLede}</p>
          <ul className="grid gap-3 max-w-[46ch]">
            {t.benefits.map((b) => (
              <li key={b} className="flex gap-3 text-[15.5px] text-ink-2"><span aria-hidden className="mt-[9px] w-[7px] h-[7px] shrink-0 rounded-full bg-[var(--fjord)]" />{b}</li>
            ))}
          </ul>
          <div className="hairline max-w-[46ch]" />
          <p className="text-[14.5px] text-ink-2">{t.haveAccount} <Link href={loginPagePath("moderne", locale)} className="text-fjord underline underline-offset-4">{t.logIn}</Link></p>
          <p className="text-[14px] text-muted max-w-[46ch]">{t.stakeholders} <Link href={contactPath("moderne", locale)} className="text-fjord underline underline-offset-4">{t.requestAccess}</Link></p>
        </div>
        <div className="panel p-5 sm:p-7 md:p-9 min-w-0">
          {open ? (
            <SignUpForm locale={locale} plots={ids} preselect={preselect} stamp={stamp} byEmail={byEmail} hours={LINK_HOURS.verify} />
          ) : (
            <div className="grid gap-3" role="status">
              <h2 className="display text-[30px]">{t.storageTitle}</h2>
              <p className="text-[15.5px] text-ink-2">{STORAGE_MESSAGE[locale]}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
