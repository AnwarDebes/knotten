import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Nav from "@/components/ui/Nav";
import { ChangePasswordForm } from "@/components/auth/AuthForms";
import { DeleteAccountForm, DeleteHouseButton, EmailChangeForm, FollowForm, NotifySwitch, ProfileForm, ResendForm, UnfollowButton } from "@/components/members/MinSideForms";
import { logout, logoutEverywhere } from "@/app/(moderne)/[locale]/login/actions";
import { getSession } from "@/lib/auth";
import { CONSENT_TEXT } from "@/lib/consent";
import { summary, toSearch } from "@/lib/configurator/state";
import { plotNo } from "@/lib/format";
import { isLocale, type Locale } from "@/lib/i18n";
import { MT } from "@/lib/member-text";
import { configuratorPath, plotPath } from "@/lib/member-paths";
import { memberPlace, minSideData, signupByEmail } from "@/lib/server/member-store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { title: locale === "en" ? "My page" : "Min side", robots: { index: false, follow: false } };
}

const SECTIONS = ["tomter", "hus", "varsler", "profil", "passord", "data", "slett"] as const;

/**
 * Min side for a buyer's own account, in the Moderne look (Norwegian and English): followed plots with live status
 * and price, saved houses, notifications, profile, password, the data export and deleting the account. Every form
 * posts to lib/server/members.ts. Visitors without a login are sent to the login page by the proxy; a project
 * account has its own page in the portal.
 */
export default async function MinSide({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ ny?: string; velkommen?: string; bekreftet?: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const t = MT[locale];
  const no = locale === "no";
  const session = await getSession();
  if (!session) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/min-side`)}`);
  if (session.kind !== "member") redirect(`/${locale}/portal/konto`);
  const [data, byEmail] = await Promise.all([minSideData(session.id), signupByEmail()]);
  if (!data) redirect(`/${locale}/login`);
  const q = await searchParams;
  const banner = q.ny ? t.welcomeNew : q.velkommen ? t.welcomeVerified : q.bekreftet ? t.confirmed : "";
  const a = data.account;
  const verified = !!a.email_verified_at;
  const place = memberPlace(a);
  const first = a.name.trim().split(/\s+/)[0] ?? "";
  const nf = new Intl.NumberFormat(no ? "nb-NO" : "en-GB");
  const day = (iso: string) => new Date(iso).toLocaleDateString(no ? "nb-NO" : "en-GB", { timeZone: "Europe/Oslo", day: "numeric", month: "short", year: "numeric" });
  const title: Record<(typeof SECTIONS)[number], string> = { tomter: t.plotsTitle, hus: t.housesTitle, varsler: t.notifyTitle, profil: t.profileTitle, passord: t.passwordTitle, data: t.dataTitle, slett: t.deleteTitle };
  const h2 = "display text-[clamp(26px,2.6vw,34px)]";
  const card = "panel p-5 sm:p-6 md:p-8 min-w-0 scroll-mt-[96px]";
  return (
    <>
      <Nav locale={locale} />
      <section className="wrap pt-10 md:pt-16 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="label uppercase tracking-[.12em]">{t.minSide}</div>
            <h1 className="display text-[clamp(42px,6vw,80px)] mt-3 break-words">{t.hello(first)}</h1>
            <p className="lede mt-5 max-w-[54ch]">{t.minLede}</p>
          </div>
          <form action={logout}>
            <input type="hidden" name="to" value={`/${locale}/login`} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="design" value="moderne" />
            <button className="btn btn-ghost btn-sm btn-plain" type="submit">{t.logOut}</button>
          </form>
        </div>
        <nav aria-label={t.jump} className="mt-8 flex flex-wrap gap-2">
          {SECTIONS.map((s) => <a key={s} href={`#${s}`} className="chip no-underline hover:bg-[var(--sky)] !py-1.5 !px-3 !text-[13.5px]">{title[s]}</a>)}
        </nav>
      </section>

      {(banner || !verified) && (
        <div className="wrap grid gap-3 pt-2">
          {banner && <div role="status" className="rounded-[12px] px-4 py-3 text-[15px] bg-[rgba(79,113,86,.12)] text-[#2f4f38] border border-[rgba(79,113,86,.25)]">{banner}</div>}
          {!verified && (
            <div className="panel-2 p-5 md:p-6 grid gap-3">
              <p className="font-medium text-[16px]">{t.unverifiedTitle}</p>
              <p className="text-[14.5px] text-ink-2 max-w-[70ch]">{byEmail ? t.unverifiedMail : t.unverifiedNoMail}</p>
              {byEmail && <ResendForm locale={locale} />}
            </div>
          )}
        </div>
      )}

      <div className="wrap pt-6 pb-20 md:pb-28 grid gap-5 lg:grid-cols-2 items-start">
        <section id="tomter" aria-labelledby="h-tomter" className={card}>
          <h2 id="h-tomter" className={h2}>{t.plotsTitle}</h2>
          <p className="text-[14.5px] text-muted mt-2">{t.plotsIntro}</p>
          {data.follows.length ? (
            <ul className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {data.follows.map((f) => (
                <li key={f.id} className="py-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex-1 min-w-[160px]">
                    <div className="font-medium text-[16px]">{t.plot} {f.n}</div>
                    <div className="text-[13.5px] text-ink-2 mt-1 flex flex-wrap items-center gap-2">
                      <span className={`chip ${f.status === "available" ? "chip-pine" : f.status === "reserved" ? "chip-amber" : ""}`}>{t.status[f.status]}</span>
                      <span>{typeof f.price_nok === "number" ? `${nf.format(f.price_nok)} kr` : t.noPrice}</span>
                    </div>
                  </div>
                  <Link href={plotPath("moderne", locale, f.id)} className="text-[13.5px] text-fjord underline underline-offset-4">{t.seePlot}<span className="sr-only"> {f.n}</span></Link>
                  <UnfollowButton locale={locale} plot={f.id} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-[15px] text-ink-2">{t.plotsEmpty}</p>
          )}
          {data.follows.some((f) => typeof f.price_nok !== "number") && <p className="provenance mt-3">{data.releaseNote[locale]}</p>}
          <div className="mt-6"><FollowForm locale={locale} options={data.allPlots.filter((p) => !data.member.plots.includes(p))} /></div>
        </section>

        <section id="hus" aria-labelledby="h-hus" className={card}>
          <h2 id="h-hus" className={h2}>{t.housesTitle}</h2>
          <p className="text-[14.5px] text-muted mt-2">{t.housesIntro}</p>
          {data.saved.length ? (
            <ul className="mt-5 grid gap-3">
              {data.saved.map((h) => {
                const extra = summary(h.config, locale).filter((r) => !r.standard);
                return (
                  <li key={h.id} className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg)] p-4 grid gap-2 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="font-medium text-[16px] break-words min-w-0">{h.name}</span>
                      <span className="text-[13px] text-muted">{t.changed} {day(h.updated)}</span>
                    </div>
                    <p className="text-[13.5px] text-ink-2">{h.config.plot ? `${t.plot} ${plotNo(h.config.plot)}` : t.noPlot} · {t.choices(extra.length)}</p>
                    {extra.length > 0 && <p className="text-[13px] text-muted">{extra.slice(0, 3).map((r) => `${r.optionLabel}: ${r.choiceLabel}`).join(" · ")}{extra.length > 3 ? ` · ${t.more(extra.length - 3)}` : ""}</p>}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link className="btn btn-sm no-underline" href={configuratorPath("moderne", locale, toSearch(h.config))}>{t.open}<span className="sr-only"> {h.name}</span></Link>
                      <DeleteHouseButton locale={locale} id={h.id} name={h.name} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-5 text-[15px] text-ink-2">{t.housesEmpty}</p>
          )}
          <Link className="btn btn-sm btn-ghost no-underline mt-5" href={configuratorPath("moderne", locale)}>{t.configure}</Link>
        </section>

        <section id="varsler" aria-labelledby="h-varsler" className={card}>
          <h2 id="h-varsler" className={h2}>{t.notifyTitle}</h2>
          <p className="text-[14.5px] text-muted mt-2">{t.notifyIntro}</p>
          <div className="mt-5 divide-y divide-[var(--line)]">
            <NotifySwitch locale={locale} purpose="updates" label={CONSENT_TEXT.updates.text[locale]} on={data.notify.updates.on} at={data.notify.updates.at} />
            <NotifySwitch locale={locale} purpose="plot_alerts" label={CONSENT_TEXT.plot_alerts.text[locale]} hint={t.alertsHint} on={data.notify.plot_alerts.on} at={data.notify.plot_alerts.at} />
          </div>
          {!verified && <p className="provenance mt-4">{t.notifyUnverified}</p>}
        </section>

        <section id="profil" aria-labelledby="h-profil" className={card}>
          <h2 id="h-profil" className={h2}>{t.profileTitle}</h2>
          <p className="text-[14.5px] text-muted mt-2 mb-5">{t.profileIntro}</p>
          <ProfileForm locale={locale} name={a.name} phone={a.phone} lang={place.locale} design={place.design} />
          <div className="hairline my-6" />
          <div className="grid gap-1.5">
            <span className="text-[14px] font-medium text-ink">{t.emailLabel}</span>
            <p className="text-[15px] break-all">{a.email} <span className={`chip ml-1 ${verified ? "chip-fjord" : ""}`}>{verified ? t.verified : t.notVerified}</span></p>
            {data.pendingEmail && <p className="text-[13.5px] text-muted">{t.pendingEmail(data.pendingEmail)}</p>}
          </div>
          <details className="mt-4 group">
            <summary className="cursor-pointer text-fjord text-[14.5px] underline underline-offset-4 w-fit">{t.changeEmail}</summary>
            <div className="mt-4"><EmailChangeForm locale={locale} email={a.email} byEmail={byEmail} /></div>
          </details>
        </section>

        <section id="passord" aria-labelledby="h-passord" className={card}>
          <h2 id="h-passord" className={h2}>{t.passwordTitle}</h2>
          <p className="text-[14.5px] text-muted mt-2 mb-5">{t.passwordIntro}</p>
          <ChangePasswordForm locale={locale} email={a.email} />
          <div className="hairline my-6" />
          <p className="text-[14.5px] text-ink-2">{t.everywhereText}</p>
          <form action={logoutEverywhere} className="mt-3">
            <input type="hidden" name="to" value={`/${locale}/login`} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="design" value="moderne" />
            <button className="btn btn-sm btn-ghost btn-plain" type="submit">{t.everywhere}</button>
          </form>
        </section>

        <section id="data" aria-labelledby="h-data" className={card}>
          <h2 id="h-data" className={h2}>{t.dataTitle}</h2>
          <p className="text-[14.5px] text-ink-2 mt-2 max-w-[60ch]">{t.dataIntro}</p>
          <a className="btn btn-sm btn-ghost no-underline mt-5" href="/api/min-side/eksport" download>{t.download}</a>
        </section>

        <section id="slett" aria-labelledby="h-slett" className={`${card} lg:col-span-2`}>
          <h2 id="h-slett" className={h2}>{t.deleteTitle}</h2>
          <p className="text-[14.5px] text-ink-2 mt-2 max-w-[70ch]">{t.deleteIntro}</p>
          <details className="mt-4">
            <summary className="cursor-pointer text-[#8a2f1d] text-[14.5px] font-medium underline underline-offset-4 w-fit">{t.deleteTitle}</summary>
            <div className="mt-4"><DeleteAccountForm locale={locale} email={a.email} /></div>
          </details>
        </section>
      </div>
    </>
  );
}
