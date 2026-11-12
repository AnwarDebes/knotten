"use client";
import { useId, useState } from "react";
import Link from "next/link";
import Turnstile from "@/components/Turnstile";
import { keepValues } from "@/components/keepValues";
import { CONSENT_TEXT, CONTACT_NOTICE } from "@/lib/consent";
import { plotNo } from "@/lib/format";
import { MT, splitNotice, type MLang } from "@/lib/member-text";
import { privacyPath } from "@/lib/member-paths";
import type { MemberState } from "@/lib/server/members";
import { useSignUp } from "./useMemberForm";

const PURPOSES = ["buy", "invest", "partner", "curious"] as const;
const OPTIONAL = ["updates", "plot_alerts"] as const;

/** The answer from the server: an error is announced at once, a confirmation politely. */
export function Msg({ state }: { state: MemberState }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <div role={state.error ? "alert" : "status"} className={`rounded-[12px] px-4 py-3 text-[14.5px] leading-snug ${state.error ? "bg-[rgba(197,75,48,.09)] text-[#8a2f1d] border border-[rgba(197,75,48,.25)]" : "bg-[rgba(79,113,86,.12)] text-[#2f4f38] border border-[rgba(79,113,86,.25)]"}`}>
      {state.error ?? state.ok}
    </div>
  );
}

/** A password with a show button: the label names only the input; the button and the hint are separate. */
export function PasswordInput({ label, name, autoComplete, locale, help }: { label: string; name: string; autoComplete: string; locale: MLang; help?: string }) {
  const [shown, setShown] = useState(false);
  const id = useId();
  const t = MT[locale];
  return (
    <div className="grid gap-1.5 min-w-0">
      <label htmlFor={id} className="text-[14px] font-medium text-ink">{label}</label>
      <span className="relative block">
        <input id={id} className="input pr-16" name={name} type={shown ? "text" : "password"} autoComplete={autoComplete} required minLength={autoComplete === "new-password" ? 10 : undefined} aria-describedby={help ? `${id}-help` : undefined} />
        <button type="button" onClick={() => setShown((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-full text-[12.5px] font-medium text-muted hover:text-ink hover:bg-[rgba(23,40,58,.06)]" aria-controls={id}>
          {shown ? t.hide : t.show}<span className="sr-only"> {t.pwWord}</span>
        </button>
      </span>
      {help && <span id={`${id}-help`} className="text-[12.5px] text-muted leading-snug">{help}</span>}
    </div>
  );
}

/**
 * The sign-up form in the Moderne look. With email set up it asks for no password (a link confirms the address and
 * the password is chosen there); without email it asks for one and logs the person in at once.
 */
export default function SignUpForm({ locale, plots, preselect, stamp, byEmail, hours }: { locale: MLang; plots: string[]; preselect: string[]; stamp: string; byEmail: boolean; hours: number }) {
  const t = MT[locale];
  const { state, action, pending, token, setToken, done } = useSignUp();
  const [before, word, after] = splitNotice(CONTACT_NOTICE[locale], t.privacyWord);
  if (state?.done) {
    return (
      <div ref={done} tabIndex={-1} role="status" className="grid gap-3 outline-none">
        <h2 className="display text-[clamp(28px,3vw,36px)]">{t.checkTitle}</h2>
        <p className="text-[16px] text-ink-2">{state.ok}</p>
        <p className="text-[14px] text-muted">{t.checkMore(hours)}</p>
      </div>
    );
  }
  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-5 min-w-0">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="design" value="moderne" />
      <input type="hidden" name="stamp" value={stamp} />
      <input type="hidden" name="turnstile" value={token} />
      <Msg state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1.5 text-[14px] font-medium text-ink min-w-0">{t.name}<input className="input" name="name" autoComplete="name" required maxLength={80} /></label>
        <label className="grid gap-1.5 text-[14px] font-medium text-ink min-w-0">{t.email}<input className="input" name="email" type="email" autoComplete="email" inputMode="email" required maxLength={200} /></label>
      </div>
      <label className="grid gap-1.5 text-[14px] font-medium text-ink sm:max-w-[50%] sm:pr-2.5 min-w-0">{t.phone}<input className="input" name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
      <fieldset className="grid gap-2 text-[14.5px] min-w-0">
        <legend className="mb-1 text-[14px] font-medium text-ink">{t.purposeLegend}</legend>
        {PURPOSES.map((p) => (
          <label key={p} className="flex items-center gap-2.5 min-h-[28px]"><input type="radio" name="purpose" value={p} defaultChecked={p === "buy"} className="w-4 h-4 accent-[var(--fjord)]" /> {t.purposes[p]}</label>
        ))}
      </fieldset>
      <fieldset className="grid gap-2 min-w-0">
        <legend className="mb-1 text-[14px] font-medium text-ink">{t.plotsLegend}</legend>
        <div className="flex flex-wrap gap-1.5">
          {plots.map((p) => (
            <label key={p} className="relative inline-flex">
              <input type="checkbox" name="plots" value={p} defaultChecked={preselect.includes(p)} className="peer sr-only" />
              <span className="inline-grid place-items-center min-w-[40px] h-[36px] px-2.5 rounded-full border border-[var(--line-strong)] bg-white text-[14px] font-medium text-ink-2 cursor-pointer transition-colors peer-checked:bg-[var(--ink)] peer-checked:border-[var(--ink)] peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--fjord)] hover:border-[var(--ink)]">
                <span className="sr-only">{t.plot} </span>{plotNo(p)}
              </span>
            </label>
          ))}
        </div>
        <span className="text-[12.5px] text-muted">{t.plotsHelp}</span>
      </fieldset>
      {!byEmail && (
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordInput label={t.password} name="password" autoComplete="new-password" locale={locale} help={t.pwHelp} />
          <PasswordInput label={t.confirm} name="confirm" autoComplete="new-password" locale={locale} />
        </div>
      )}
      <fieldset className="grid gap-2 text-[14.5px] min-w-0">
        <legend className="mb-1 text-[14px] font-medium text-ink">{t.consentsLegend}</legend>
        {OPTIONAL.map((p) => (
          <label key={p} className="flex items-start gap-2.5"><input type="checkbox" name={`consent_${p}`} className="mt-1 w-4 h-4 shrink-0 accent-[var(--fjord)]" /> <span>{CONSENT_TEXT[p].text[locale]}</span></label>
        ))}
      </fieldset>
      <label className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden>Nettside<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <Turnstile locale={locale} onToken={setToken} />
      <p className="text-[14px] text-ink-2">
        {before}<Link href={privacyPath("moderne", locale)} className="text-fjord underline underline-offset-4">{word}</Link>{after} {t.rights}
      </p>
      <p className="provenance">{byEmail ? t.mailNote : t.noMailNote}</p>
      <button className="btn btn-amber justify-self-start" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.creating} …` : t.create}</button>
    </form>
  );
}
