"use client";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Turnstile from "@/components/Turnstile";
import { keepValues } from "@/components/keepValues";
import { useSignUp } from "@/components/members/useMemberForm";
import { changePassword, type FormState } from "@/app/(moderne)/[locale]/login/actions";
import { confirmEmailLink, deleteMyAccount, deleteSavedHouse, requestEmailChange, resendVerification, setFollow, setNotify, updateMemberProfile, type MemberState } from "@/lib/server/members";
import { CONSENT_TEXT, CONTACT_NOTICE } from "@/lib/consent";
import { plotNo } from "@/lib/format";
import { MT, splitNotice, type MLang } from "@/lib/member-text";
import { privacyPath } from "@/lib/member-paths";
import type { Design } from "@/lib/design";

/**
 * The sign-up and Min side forms in the Klassisk look (plain CSS in (klassisk)/globals.css). Every form takes the
 * page's language and says it is Klassisk, so links and answers come back to the Klassisk pages; the server actions
 * are the same as Moderne's (lib/server/members.ts).
 */
type Base = { locale: MLang };
const PURPOSES = ["buy", "invest", "partner", "curious"] as const;
const OPTIONAL = ["updates", "plot_alerts"] as const;

const Hidden = ({ locale }: Base) => (
  <>
    <input type="hidden" name="locale" value={locale} />
    <input type="hidden" name="lang" value={locale} />
    <input type="hidden" name="design" value="klassisk" />
  </>
);

export function KMsg({ state }: { state: MemberState | FormState }) {
  if (!state?.error && !state?.ok) return null;
  return <div className={`full auth-msg${state.error ? " err" : " ok"}`} role={state.error ? "alert" : "status"}>{state.error ?? state.ok}</div>;
}

/** A password with a show button: the label names only the input; the button and the hint are separate. */
export function KPassword({ locale, name, autoComplete, label, help, full = false }: Base & { name: string; autoComplete: string; label: string; help?: string; full?: boolean }) {
  const [shown, setShown] = useState(false);
  const id = useId();
  const t = MT[locale];
  return (
    <div className={`${full ? "full " : ""}field`}>
      <label htmlFor={id}>{label}</label>
      <span className="pw">
        <input id={id} name={name} type={shown ? "text" : "password"} autoComplete={autoComplete} required minLength={autoComplete === "new-password" ? 10 : undefined} aria-describedby={help ? `${id}-help` : undefined} />
        <button type="button" onClick={() => setShown((v) => !v)} aria-controls={id}>{shown ? t.hide : t.show}<span className="sr"> {t.pwWord}</span></button>
      </span>
      {help && <span className="small" id={`${id}-help`}>{help}</span>}
    </div>
  );
}

// ------------------------------------------------------------------ sign-up
export function KSignUpForm({ locale, plots, preselect, stamp, byEmail, hours }: Base & { plots: string[]; preselect: string[]; stamp: string; byEmail: boolean; hours: number }) {
  const t = MT[locale];
  const { state, action, pending, token, setToken, done } = useSignUp();
  const [before, word, after] = splitNotice(CONTACT_NOTICE[locale], t.privacyWord);
  if (state?.done) {
    return (
      <div ref={done} tabIndex={-1} role="status" className="mdone" lang={locale === "en" ? "en" : undefined}>
        <div className="eyebrow">{t.signupEyebrow}</div>
        <h2>{t.checkTitle}</h2>
        <p className="lede">{state.ok}</p>
        <p className="small">{t.checkMore(hours)}</p>
      </div>
    );
  }
  return (
    <form className="form auth-form" action={action} onSubmit={keepValues(action)} lang={locale === "en" ? "en" : undefined}>
      <Hidden locale={locale} />
      <input type="hidden" name="stamp" value={stamp} />
      <input type="hidden" name="turnstile" value={token} />
      <KMsg state={state} />
      <label>{t.name}<input type="text" name="name" autoComplete="name" required maxLength={80} /></label>
      <label>{t.email}<input type="email" name="email" autoComplete="email" inputMode="email" required maxLength={200} /></label>
      <label>{t.phone}<input type="tel" name="phone" autoComplete="tel" maxLength={40} /></label>
      <fieldset className="full consents">
        <legend>{t.purposeLegend}</legend>
        {PURPOSES.map((p) => (
          <label key={p} className="choice"><input type="radio" name="purpose" value={p} defaultChecked={p === "buy"} /> {t.purposes[p]}</label>
        ))}
      </fieldset>
      <fieldset className="full consents">
        <legend>{t.plotsLegend}</legend>
        <div className="pick">
          {plots.map((p) => (
            <label key={p}>
              <input type="checkbox" name="plots" value={p} defaultChecked={preselect.includes(p)} />
              <span><span className="sr">{t.plot} </span>{plotNo(p)}</span>
            </label>
          ))}
        </div>
        <span className="small">{t.plotsHelp}</span>
      </fieldset>
      {!byEmail && (
        <>
          <KPassword locale={locale} name="password" autoComplete="new-password" label={t.password} help={t.pwHelp} />
          <KPassword locale={locale} name="confirm" autoComplete="new-password" label={t.confirm} />
        </>
      )}
      <fieldset className="full consents">
        <legend>{t.consentsLegend}</legend>
        {OPTIONAL.map((p) => (
          <label key={p} className="consent"><input type="checkbox" name={`consent_${p}`} /><span>{CONSENT_TEXT[p].text[locale]}</span></label>
        ))}
      </fieldset>
      <label className="sr" aria-hidden>Nettside<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="full"><Turnstile locale={locale} onToken={setToken} /></div>
      <p className="full small notice">
        {before}<Link href={privacyPath("klassisk", locale)}>{word}</Link>{after} {t.rights}
      </p>
      <p className="full small notice">{byEmail ? t.mailNote : t.noMailNote}</p>
      <div className="full"><button className="btn" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.creating} …` : t.create}</button></div>
    </form>
  );
}

// ------------------------------------------------------------------ Min side
export function KProfileForm({ locale, name, phone, lang, design }: Base & { name: string; phone?: string; lang: MLang; design: Design }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(updateMemberProfile, undefined);
  return (
    <form className="form" action={action} onSubmit={keepValues(action)}>
      <Hidden locale={locale} />
      <KMsg state={state} />
      <label>{t.name}<input type="text" name="name" autoComplete="name" defaultValue={name} required maxLength={80} /></label>
      <label>{t.phone}<input type="tel" name="phone" autoComplete="tel" defaultValue={phone ?? ""} maxLength={40} /></label>
      <label>{t.language}<select key={lang} name="pref_lang" defaultValue={lang}><option value="no">{t.norwegian}</option><option value="en">{t.english}</option></select></label>
      <label>{t.design}<select key={design} name="pref_design" defaultValue={design}><option value="klassisk">{t.klassisk}</option><option value="moderne">{t.moderne}</option></select></label>
      <div className="full"><button className="btn sm" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.saving} …` : t.save}</button></div>
    </form>
  );
}

export function KEmailChangeForm({ locale, email, byEmail }: Base & { email: string; byEmail: boolean }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(requestEmailChange, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);
  return (
    <form ref={form} className="form auth-form" action={action} onSubmit={keepValues(action)}>
      <Hidden locale={locale} />
      <input type="text" name="username" autoComplete="username" defaultValue={email} className="sr" tabIndex={-1} aria-hidden readOnly />
      <KMsg state={state} />
      <p className="full small">{byEmail ? t.changeMail : t.changeNoMail}</p>
      <label>{t.newEmail}<input type="email" name="email" autoComplete="email" inputMode="email" required maxLength={200} /></label>
      <KPassword locale={locale} name="password" autoComplete="current-password" label={t.currentPw} />
      <div className="full"><button className="btn sm ghost" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.saving} …` : t.sendChange}</button></div>
    </form>
  );
}

export function KResendForm({ locale }: Base) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(resendVerification, undefined);
  return (
    <form className="form" action={action} style={{ gridTemplateColumns: "1fr" }}>
      <Hidden locale={locale} />
      <KMsg state={state} />
      {!state?.ok && <div><button className="btn sm" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.sending} …` : t.sendLink}</button></div>}
    </form>
  );
}

export function KChangePasswordForm({ locale, email }: Base & { email: string }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, undefined);
  return (
    <form className="form auth-form" action={action} onSubmit={keepValues(action)}>
      <Hidden locale={locale} />
      <input type="text" name="username" autoComplete="username" defaultValue={email} className="sr" tabIndex={-1} aria-hidden readOnly />
      <KMsg state={state} />
      <KPassword locale={locale} name="current" autoComplete="current-password" label={t.currentPw} full />
      <KPassword locale={locale} name="password" autoComplete="new-password" label={t.newPw} help={t.pwHelp} />
      <KPassword locale={locale} name="confirm" autoComplete="new-password" label={t.confirm} />
      <div className="full"><button className="btn sm" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.saving} …` : t.changePw}</button></div>
    </form>
  );
}

export function KNotifySwitch({ locale, purpose, label, hint, on, at }: Base & { purpose: "updates" | "plot_alerts"; label: string; hint?: string; on: boolean; at?: string }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(setNotify, undefined);
  const when = at ? new Date(at).toLocaleDateString(locale === "no" ? "nb-NO" : "en-GB", { timeZone: "Europe/Oslo", day: "numeric", month: "short", year: "numeric" }) : "";
  return (
    <form className="mswitch" action={action}>
      <Hidden locale={locale} />
      <input type="hidden" name="purpose" value={purpose} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <div className="mtext">
        <p>{label}</p>
        <span className="small"><span className={`tag ${on ? "green" : "grey"}`}>{on ? t.on : t.off}</span>{hint}{hint && when ? " " : ""}{when ? `${t.lastChanged} ${when}.` : ""}</span>
        {state?.error && <div className="auth-msg err" role="alert">{state.error}</div>}
      </div>
      <button className={`btn sm${on ? " ghost" : ""}`} type="submit" disabled={pending} aria-busy={pending}>{on ? t.turnOff : t.turnOn}<span className="sr">: {label}</span></button>
    </form>
  );
}

export function KFollowForm({ locale, options }: Base & { options: string[] }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(setFollow, undefined);
  if (!options.length) return <p className="small">{t.allFollowed}</p>;
  return (
    <form className="form" action={action} style={{ marginTop: 20 }}>
      <Hidden locale={locale} />
      <input type="hidden" name="op" value="follow" />
      <label>{t.followLabel}
        <select name="plot" required defaultValue="">
          <option value="" disabled>{t.choosePlot}</option>
          {options.map((p) => <option key={p} value={p}>{t.plot} {plotNo(p)}</option>)}
        </select>
      </label>
      <div style={{ alignSelf: "end" }}><button className="btn sm" type="submit" disabled={pending} aria-busy={pending}>{t.follow}</button></div>
      <KMsg state={state} />
    </form>
  );
}

export function KUnfollowButton({ locale, plot }: Base & { plot: string }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(setFollow, undefined);
  return (
    <form action={action}>
      <Hidden locale={locale} />
      <input type="hidden" name="op" value="unfollow" />
      <input type="hidden" name="plot" value={plot} />
      <button className="linkish" type="submit" disabled={pending} aria-busy={pending}>{t.unfollow}<span className="sr"> {t.plot.toLowerCase()} {plotNo(plot)}</span></button>
      {state?.error && <div className="auth-msg err" role="alert">{state.error}</div>}
    </form>
  );
}

export function KDeleteHouseButton({ locale, id, name }: Base & { id: string; name: string }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(deleteSavedHouse, undefined);
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(`${t.removeHouse(name)}?`)) e.preventDefault(); }}>
      <Hidden locale={locale} />
      <input type="hidden" name="id" value={id} />
      <button className="btn sm ghost" type="submit" disabled={pending} aria-busy={pending} aria-label={t.removeHouse(name)}>{t.remove}</button>
      {state?.error && <div className="auth-msg err" role="alert">{state.error}</div>}
    </form>
  );
}

export function KDeleteAccountForm({ locale, email }: Base & { email: string }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(deleteMyAccount, undefined);
  return (
    <form className="form auth-form" action={action} onSubmit={keepValues(action)}>
      <Hidden locale={locale} />
      <input type="text" name="username" autoComplete="username" defaultValue={email} className="sr" tabIndex={-1} aria-hidden readOnly />
      <KMsg state={state} />
      <label className="full consent"><input type="checkbox" name="delete_lead" defaultChecked /><span>{t.deleteLead}<span className="small" style={{ display: "block", marginTop: 4 }}>{t.deleteLeadHelp}</span></span></label>
      <KPassword locale={locale} name="password" autoComplete="current-password" label={t.deletePw} />
      <div className="full"><button className="btn danger" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.deleting} …` : t.deleteButton}</button></div>
    </form>
  );
}

/** The password page: confirm a new address, or an address, without choosing a password. */
export function KConfirmLinkForm({ locale, token }: Base & { token: string }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(confirmEmailLink, undefined);
  return (
    <form className="form auth-form" action={action}>
      <Hidden locale={locale} />
      <input type="hidden" name="token" value={token} />
      <KMsg state={state} />
      <div className="full"><button className="btn" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.confirming} …` : t.confirmButton}</button></div>
    </form>
  );
}
