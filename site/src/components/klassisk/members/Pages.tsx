import Link from "next/link";
import Reveal from "@/components/klassisk/Reveal";
import { logout, logoutEverywhere } from "@/app/(moderne)/[locale]/login/actions";
import { CONSENT_TEXT } from "@/lib/consent";
import { summary, toSearch } from "@/lib/configurator/state";
import { STORAGE_MESSAGE } from "@/lib/errors";
import { plotNo } from "@/lib/format";
import { MT, type MLang } from "@/lib/member-text";
import { configuratorPath, contactPath, loginPagePath, plotPath } from "@/lib/member-paths";
import { kHref } from "@/lib/klassisk/locale";
import { memberPlace, type MinSideData } from "@/lib/server/member-store";
import {
  KChangePasswordForm, KDeleteAccountForm, KDeleteHouseButton, KEmailChangeForm, KFollowForm, KNotifySwitch, KProfileForm, KResendForm, KSignUpForm, KUnfollowButton,
} from "./Forms";

/**
 * The sign-up page and Min side in the Klassisk look, in Norwegian (/registrer, /min-side) and English (/english/registrer,
 * /english/min-side): both take the language as a prop. The data and the actions are shared with Moderne
 * (lib/server/member-store.ts, lib/server/members.ts).
 */
type L = { locale: MLang };

/** The Klassisk page head (as components/klassisk/PageHead), with the front page's name in the page's language. */
export function KHead({ locale, title, crumb, children, aside }: L & { title: string; crumb: string; children?: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="phead">
      <div className="wrap">
        <div className="crumb"><Link href={kHref("/", locale)}>{MT[locale].home}</Link> / {crumb}</div>
        <div className="row">
          <div>
            <h1>{title}</h1>
            {children}
          </div>
          {aside}
        </div>
      </div>
    </section>
  );
}

export function KSignUpPage({ locale, open, plots, preselect, stamp, byEmail, hours }: L & { open: boolean; plots: string[]; preselect: string[]; stamp: string; byEmail: boolean; hours: number }) {
  const t = MT[locale];
  return (
    <div lang={locale === "en" ? "en" : undefined}>
      <KHead locale={locale} title={t.signupTitle} crumb={t.signupTitle}>
        <p>{t.signupLede}</p>
      </KHead>
      <section className="sec">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{t.signupEyebrow}</div>
            <h2>{t.benefitsTitle}</h2>
            <ul className="mticks">{t.benefits.map((b) => <li key={b}>{b}</li>)}</ul>
            <p className="small">{t.haveAccount} <Link href={loginPagePath("klassisk", locale)}>{t.logIn}</Link></p>
            <p className="small">{t.stakeholders} <Link href={contactPath("klassisk", locale)}>{t.requestAccess}</Link></p>
          </Reveal>
          <div className="mcard">
            {open ? (
              <KSignUpForm locale={locale} plots={plots} preselect={preselect} stamp={stamp} byEmail={byEmail} hours={hours} />
            ) : (
              <div className="mdone" role="status">
                <h2>{t.storageTitle}</h2>
                <p className="lede">{STORAGE_MESSAGE[locale]}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const SECTIONS = ["tomter", "hus", "varsler", "profil", "passord", "data", "slett"] as const;

/** One section of Min side: the title on the left, the content on the right (the Klassisk split). */
function Part({ id, eyebrow, title, intro, children }: { id: string; eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <section className="msec" id={id} aria-labelledby={`h-${id}`}>
      <div className="wrap split">
        <div className="stack">
          <div className="eyebrow">{eyebrow}</div>
          <h2 id={`h-${id}`}>{title}</h2>
          <p className="small measure">{intro}</p>
        </div>
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
    </section>
  );
}

export function KMinSidePage({ locale, data, byEmail, banner }: L & { data: MinSideData; byEmail: boolean; banner: string }) {
  const t = MT[locale];
  const no = locale === "no";
  const a = data.account;
  const verified = !!a.email_verified_at;
  const place = memberPlace(a);
  const first = a.name.trim().split(/\s+/)[0] ?? "";
  const nf = new Intl.NumberFormat(no ? "nb-NO" : "en-GB");
  const day = (iso: string) => new Date(iso).toLocaleDateString(no ? "nb-NO" : "en-GB", { timeZone: "Europe/Oslo", day: "numeric", month: "short", year: "numeric" });
  const title: Record<(typeof SECTIONS)[number], string> = { tomter: t.plotsTitle, hus: t.housesTitle, varsler: t.notifyTitle, profil: t.profileTitle, passord: t.passwordTitle, data: t.dataTitle, slett: t.deleteTitle };
  const login = loginPagePath("klassisk", locale);
  return (
    <div lang={locale === "en" ? "en" : undefined}>
      <KHead
        locale={locale}
        title={t.hello(first)}
        crumb={t.minSide}
        aside={
          <form action={logout}>
            <input type="hidden" name="to" value={login} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="design" value="klassisk" />
            <button className="btn ghost sm" type="submit">{t.logOut}</button>
          </form>
        }
      >
        <p>{t.minLede}</p>
        <nav className="mnav" aria-label={t.jump}>
          {SECTIONS.map((s) => <a key={s} className="chip" href={`#${s}`}>{title[s]}</a>)}
        </nav>
      </KHead>

      {(banner || !verified) && (
        <div className="wrap" style={{ display: "grid", gap: 12, marginTop: 24 }}>
          {banner && <div className="auth-msg ok" role="status">{banner}</div>}
          {!verified && (
            <div className="mnote">
              <b>{t.unverifiedTitle}</b>
              <p>{byEmail ? t.unverifiedMail : t.unverifiedNoMail}</p>
              {byEmail && <KResendForm locale={locale} />}
            </div>
          )}
        </div>
      )}

      <div className="mbody">
        <Part id="tomter" eyebrow={t.eyebrows.tomter} title={t.plotsTitle} intro={t.plotsIntro}>
          {data.follows.length ? (
            <ul className="mrows">
              {data.follows.map((f) => (
                <li key={f.id}>
                  <div className="mgrow">
                    <span className="mname">{t.plot} {f.n}</span>
                    <span className="small"><span className={`tag ${f.status === "available" ? "green" : f.status === "reserved" ? "" : "grey"}`}>{t.status[f.status]}</span>{typeof f.price_nok === "number" ? `${nf.format(f.price_nok)} kr` : t.noPrice}</span>
                  </div>
                  <Link href={plotPath("klassisk", locale, f.id)} className="small">{t.seePicker}<span className="sr"> ({t.plot.toLowerCase()} {f.n})</span></Link>
                  <KUnfollowButton locale={locale} plot={f.id} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="lede">{t.plotsEmpty}</p>
          )}
          {data.follows.some((f) => typeof f.price_nok !== "number") && <p className="small" style={{ marginTop: 12 }}>{data.releaseNote[locale]}</p>}
          <KFollowForm locale={locale} options={data.allPlots.filter((p) => !data.member.plots.includes(p))} />
        </Part>

        <Part id="hus" eyebrow={t.eyebrows.hus} title={t.housesTitle} intro={t.housesIntro}>
          {data.saved.length ? (
            <ul className="mhouses">
              {data.saved.map((h) => {
                const extra = summary(h.config, locale).filter((r) => !r.standard);
                return (
                  <li key={h.id}>
                    <div className="mtop"><b>{h.name}</b><span className="small">{t.changed} {day(h.updated)}</span></div>
                    <p className="small" style={{ color: "var(--ink-2)" }}>{h.config.plot ? `${t.plot} ${plotNo(h.config.plot)}` : t.noPlot} · {t.choices(extra.length)}</p>
                    {extra.length > 0 && <p className="small">{extra.slice(0, 3).map((r) => `${r.optionLabel}: ${r.choiceLabel}`).join(" · ")}{extra.length > 3 ? ` · ${t.more(extra.length - 3)}` : ""}</p>}
                    <div className="cta-row">
                      <Link className="btn sm" href={configuratorPath("klassisk", locale, toSearch(h.config))}>{t.open}<span className="sr"> {h.name}</span></Link>
                      <KDeleteHouseButton locale={locale} id={h.id} name={h.name} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="lede">{t.housesEmpty}</p>
          )}
          <div className="cta-row" style={{ marginTop: 18 }}><Link className="btn ghost sm" href={configuratorPath("klassisk", locale)}>{t.configure}</Link></div>
        </Part>

        <Part id="varsler" eyebrow={t.eyebrows.varsler} title={t.notifyTitle} intro={t.notifyIntro}>
          <div>
            <KNotifySwitch locale={locale} purpose="updates" label={CONSENT_TEXT.updates.text[locale]} on={data.notify.updates.on} at={data.notify.updates.at} />
            <KNotifySwitch locale={locale} purpose="plot_alerts" label={CONSENT_TEXT.plot_alerts.text[locale]} hint={t.alertsHint} on={data.notify.plot_alerts.on} at={data.notify.plot_alerts.at} />
          </div>
          {!verified && <p className="small" style={{ marginTop: 12 }}>{t.notifyUnverified}</p>}
        </Part>

        <Part id="profil" eyebrow={t.eyebrows.profil} title={t.profileTitle} intro={t.profileIntro}>
          <KProfileForm locale={locale} name={a.name} phone={a.phone} lang={place.locale} design={place.design} />
          <div className="mline" />
          <div className="stack" style={{ gap: 8 }}>
            <span className="small">{t.emailLabel}</span>
            <span className="mmail">{a.email} <span className={`tag ${verified ? "blue" : "grey"}`}>{verified ? t.verified : t.notVerified}</span></span>
            {data.pendingEmail && <span className="small">{t.pendingEmail(data.pendingEmail)}</span>}
          </div>
          <details className="mdetails">
            <summary>{t.changeEmail}</summary>
            <KEmailChangeForm locale={locale} email={a.email} byEmail={byEmail} />
          </details>
        </Part>

        <Part id="passord" eyebrow={t.eyebrows.passord} title={t.passwordTitle} intro={t.passwordIntro}>
          <KChangePasswordForm locale={locale} email={a.email} />
          <div className="mline" />
          <p className="small" style={{ color: "var(--ink-2)" }}>{t.everywhereText}</p>
          <form action={logoutEverywhere} className="cta-row" style={{ marginTop: 12 }}>
            <input type="hidden" name="to" value={login} />
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="design" value="klassisk" />
            <button className="btn ghost sm" type="submit">{t.everywhere}</button>
          </form>
        </Part>

        <Part id="data" eyebrow={t.eyebrows.data} title={t.dataTitle} intro={t.dataIntro}>
          <div className="cta-row" style={{ marginTop: 0 }}><a className="btn ghost sm" href="/api/min-side/eksport" download>{t.download}</a></div>
        </Part>

        <Part id="slett" eyebrow={t.eyebrows.slett} title={t.deleteTitle} intro={t.deleteIntro}>
          <details className="mdetails warn" style={{ marginTop: 0 }}>
            <summary>{t.deleteTitle}</summary>
            <KDeleteAccountForm locale={locale} email={a.email} />
          </details>
        </Part>
      </div>
    </div>
  );
}
