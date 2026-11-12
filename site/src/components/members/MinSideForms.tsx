"use client";
import { useActionState, useEffect, useRef } from "react";
import { keepValues } from "@/components/keepValues";
import { confirmEmailLink, deleteMyAccount, deleteSavedHouse, requestEmailChange, resendVerification, setFollow, setNotify, updateMemberProfile, type MemberState } from "@/lib/server/members";
import { MT, type MLang } from "@/lib/member-text";
import { plotNo } from "@/lib/format";
import type { Design } from "@/lib/design";
import { Msg, PasswordInput } from "./SignUpForm";

/**
 * Min side's forms in the Moderne look. Each posts to a server action in lib/server/members.ts and shows the answer
 * under it; the page around them is drawn on the server and refreshed by the actions.
 */
type Base = { locale: MLang };
const Hidden = ({ locale, design = "moderne" }: { locale: MLang; design?: Design }) => (
  <>
    <input type="hidden" name="locale" value={locale} />
    <input type="hidden" name="design" value={design} />
  </>
);
const labelCls = "grid gap-1.5 text-[14px] font-medium text-ink min-w-0";

export function ProfileForm({ locale, name, phone, lang, design }: Base & { name: string; phone?: string; lang: MLang; design: Design }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(updateMemberProfile, undefined);
  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-4">
      <Hidden locale={locale} />
      <Msg state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>{t.name}<input className="input" name="name" autoComplete="name" defaultValue={name} required maxLength={80} /></label>
        <label className={labelCls}>{t.phone}<input className="input" name="phone" type="tel" autoComplete="tel" defaultValue={phone ?? ""} maxLength={40} /></label>
        <label className={labelCls}>{t.language}
          <select key={lang} className="input" name="pref_lang" defaultValue={lang}><option value="no">{t.norwegian}</option><option value="en">{t.english}</option></select>
        </label>
        <label className={labelCls}>{t.design}
          <select key={design} className="input" name="pref_design" defaultValue={design}><option value="klassisk">{t.klassisk}</option><option value="moderne">{t.moderne}</option></select>
        </label>
      </div>
      <button className="btn btn-sm justify-self-start" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.saving} …` : t.save}</button>
    </form>
  );
}

export function EmailChangeForm({ locale, email, byEmail }: Base & { email: string; byEmail: boolean }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(requestEmailChange, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);
  return (
    <form ref={form} action={action} onSubmit={keepValues(action)} className="grid gap-4">
      <Hidden locale={locale} />
      <input type="text" name="username" autoComplete="username" defaultValue={email} className="sr-only" tabIndex={-1} aria-hidden readOnly />
      <Msg state={state} />
      <p className="text-[13.5px] text-muted">{byEmail ? t.changeMail : t.changeNoMail}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>{t.newEmail}<input className="input" name="email" type="email" autoComplete="email" inputMode="email" required maxLength={200} /></label>
        <PasswordInput label={t.currentPw} name="password" autoComplete="current-password" locale={locale} />
      </div>
      <button className="btn btn-sm btn-ghost btn-plain justify-self-start" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.saving} …` : t.sendChange}</button>
    </form>
  );
}

export function ResendForm({ locale }: Base) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(resendVerification, undefined);
  return (
    <form action={action} className="grid gap-3 justify-items-start">
      <Hidden locale={locale} />
      <Msg state={state} />
      {!state?.ok && <button className="btn btn-sm btn-fjord" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.sending} …` : t.sendLink}</button>}
    </form>
  );
}

/** One notification switch: the current state in words, and a button that turns it the other way. */
export function NotifySwitch({ locale, purpose, label, hint, on, at }: Base & { purpose: "updates" | "plot_alerts"; label: string; hint?: string; on: boolean; at?: string }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(setNotify, undefined);
  const when = at ? new Date(at).toLocaleDateString(locale === "no" ? "nb-NO" : "en-GB", { timeZone: "Europe/Oslo", day: "numeric", month: "short", year: "numeric" }) : "";
  return (
    <form action={action} className="grid gap-2 py-4 first:pt-0 last:pb-0">
      <Hidden locale={locale} />
      <input type="hidden" name="purpose" value={purpose} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-[240px]">
          <p className="text-[15px] text-ink">{label}</p>
          <p className="text-[13px] text-muted mt-1">
            <span className={`chip ${on ? "chip-pine" : ""} mr-2`}>{on ? t.on : t.off}</span>
            {hint}{hint && when ? " " : ""}{when ? `${t.lastChanged} ${when}.` : ""}
          </p>
        </div>
        <button className={`btn btn-sm ${on ? "btn-ghost" : ""} btn-plain`} type="submit" disabled={pending} aria-busy={pending}>{on ? t.turnOff : t.turnOn}<span className="sr-only">: {label}</span></button>
      </div>
      {state?.error && <Msg state={state} />}
    </form>
  );
}

export function FollowForm({ locale, options }: Base & { options: string[] }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(setFollow, undefined);
  if (!options.length) return <p className="text-[14px] text-muted">{t.allFollowed}</p>;
  return (
    <form action={action} className="grid gap-3">
      <Hidden locale={locale} />
      <input type="hidden" name="op" value="follow" />
      <div className="flex flex-wrap items-end gap-3">
        <label className={`${labelCls} flex-1 basis-[180px]`}>{t.followLabel}
          <select className="input" name="plot" required defaultValue="">
            <option value="" disabled>{t.choosePlot}</option>
            {options.map((p) => <option key={p} value={p}>{t.plot} {plotNo(p)}</option>)}
          </select>
        </label>
        <button className="btn btn-sm" type="submit" disabled={pending} aria-busy={pending}>{t.follow}</button>
      </div>
      <Msg state={state} />
    </form>
  );
}

export function UnfollowButton({ locale, plot }: Base & { plot: string }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(setFollow, undefined);
  return (
    <form action={action}>
      <Hidden locale={locale} />
      <input type="hidden" name="op" value="unfollow" />
      <input type="hidden" name="plot" value={plot} />
      <button className="text-[13.5px] text-ink-2 underline underline-offset-4 hover:text-ink py-1" type="submit" disabled={pending} aria-busy={pending}>{t.unfollow}<span className="sr-only"> {t.plot.toLowerCase()} {plotNo(plot)}</span></button>
      {state?.error && <Msg state={state} />}
    </form>
  );
}

export function DeleteHouseButton({ locale, id, name }: Base & { id: string; name: string }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(deleteSavedHouse, undefined);
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(`${t.removeHouse(name)}?`)) e.preventDefault(); }}>
      <Hidden locale={locale} />
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-sm btn-ghost btn-plain" type="submit" disabled={pending} aria-busy={pending} aria-label={t.removeHouse(name)}>{t.remove}</button>
      {state?.error && <Msg state={state} />}
    </form>
  );
}

export function DeleteAccountForm({ locale, email }: Base & { email: string }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(deleteMyAccount, undefined);
  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-4 max-w-[560px]">
      <Hidden locale={locale} />
      <input type="text" name="username" autoComplete="username" defaultValue={email} className="sr-only" tabIndex={-1} aria-hidden readOnly />
      <Msg state={state} />
      <label className="flex items-start gap-2.5 text-[14.5px]">
        <input type="checkbox" name="delete_lead" defaultChecked className="mt-1 w-4 h-4 shrink-0 accent-[var(--fjord)]" />
        <span>{t.deleteLead}<span className="block text-[12.5px] text-muted mt-0.5">{t.deleteLeadHelp}</span></span>
      </label>
      <PasswordInput label={t.deletePw} name="password" autoComplete="current-password" locale={locale} />
      <button className="btn btn-plain justify-self-start !bg-[#8a2f1d] !border-[#8a2f1d] !text-white hover:!bg-[#6f2416]" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.deleting} …` : t.deleteButton}</button>
    </form>
  );
}

/** The password pages: confirm a new address or an address without choosing a password. */
export function ConfirmLinkForm({ locale, token }: Base & { token: string }) {
  const t = MT[locale];
  const [state, action, pending] = useActionState<MemberState, FormData>(confirmEmailLink, undefined);
  return (
    <form action={action} className="grid gap-4">
      <Hidden locale={locale} />
      <input type="hidden" name="token" value={token} />
      <Msg state={state} />
      <button className="btn btn-plain w-full !py-3.5" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.confirming} …` : t.confirmButton}</button>
    </form>
  );
}
