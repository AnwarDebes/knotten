"use client";
import { keepValues } from "@/components/keepValues";
import { useActionState, useId, useState } from "react";
import { changePassword, choosePassword, login, requestReset, setup, updateProfile, type FormState } from "@/app/(moderne)/[locale]/login/actions";

type L = "no" | "en";
const S = {
  no: {
    email: "E-post", password: "Passord", show: "Vis", hide: "Skjul", pwWord: "passordet", remember: "Husk meg på denne enheten", submit: "Logg inn", busy: "Logger inn",
    forgot: "Glemt passord?", back: "Tilbake til innlogging", resetIntro: "Skriv inn e-postadressen du bruker i portalen.", resetSubmit: "Be om nytt passord", sending: "Sender",
    code: "Oppsettskode", codeHelp: "Står i serverloggen ved første oppstart, eller i miljøvariabelen KNOTTEN_SETUP_CODE.", name: "Fullt navn", newPw: "Nytt passord", confirm: "Gjenta passordet",
    pwHelp: "Minst 10 tegn. En setning du husker er bedre enn et kort, komplisert ord.", create: "Opprett og logg inn", choose: "Lagre passord og logg inn", current: "Nåværende passord",
    change: "Endre passord", save: "Lagre", org: "Organisasjon", saving: "Lagrer",
  },
  en: {
    email: "Email", password: "Password", show: "Show", hide: "Hide", pwWord: "the password", remember: "Remember me on this device", submit: "Log in", busy: "Logging in",
    forgot: "Forgot your password?", back: "Back to log in", resetIntro: "Enter the email address you use in the portal.", resetSubmit: "Request a new password", sending: "Sending",
    code: "Setup code", codeHelp: "Printed in the server log at first start, or set in the KNOTTEN_SETUP_CODE environment variable.", name: "Full name", newPw: "New password", confirm: "Repeat the password",
    pwHelp: "At least 10 characters. A sentence you remember beats a short, complicated word.", create: "Create and log in", choose: "Save password and log in", current: "Current password",
    change: "Change password", save: "Save", org: "Organisation", saving: "Saving",
  },
};

function Message({ state }: { state: FormState }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <div role={state.error ? "alert" : "status"} className={`rounded-[12px] px-4 py-3 text-[14.5px] leading-snug ${state.error ? "bg-[rgba(197,75,48,.09)] text-[#8a2f1d] border border-[rgba(197,75,48,.25)]" : "bg-[rgba(79,113,86,.12)] text-[#2f4f38] border border-[rgba(79,113,86,.25)]"}`}>
      {state.error ?? state.ok}
    </div>
  );
}

/** A plain field: the label names the input; a hint sits under it, outside the label, and describes it. */
function Field({ label, children, help, helpId }: { label: string; children: React.ReactNode; help?: string; helpId?: string }) {
  return (
    <div className="grid gap-1.5">
      <label className="grid gap-1.5 text-[14px] font-medium text-ink">
        {label}
        {children}
      </label>
      {help && <span id={helpId} className="text-[12.5px] font-normal text-muted leading-snug">{help}</span>}
    </div>
  );
}

/** A password with a show button. The label names only the input; the button and the hint are separate. */
function PasswordField({ label, name, autoComplete, lang, help }: { label: string; name: string; autoComplete: string; lang: L; help?: string }) {
  const [shown, setShown] = useState(false);
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[14px] font-medium text-ink">{label}</label>
      <span className="relative block">
        <input id={id} className="input pr-16" name={name} type={shown ? "text" : "password"} autoComplete={autoComplete} required aria-describedby={help ? `${id}-help` : undefined} minLength={autoComplete === "new-password" ? 10 : undefined} />
        <button type="button" onClick={() => setShown((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-[12.5px] font-medium text-muted hover:text-ink hover:bg-[rgba(23,40,58,.06)]" aria-controls={id}>
          {shown ? S[lang].hide : S[lang].show}<span className="sr-only"> {S[lang].pwWord}</span>
        </button>
      </span>
      {help && <span id={`${id}-help`} className="text-[12.5px] font-normal text-muted leading-snug">{help}</span>}
    </div>
  );
}

export function LoginForm({ locale, next }: { locale: L; next?: string }) {
  const t = S[locale];
  const [state, action, pending] = useActionState(login, undefined);
  const [reset, setReset] = useState(false);
  if (reset) return <ResetForm locale={locale} onBack={() => setReset(false)} />;
  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-5" noValidate={false}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="design" value="moderne" />
      <input type="hidden" name="next" value={next ?? ""} />
      <Message state={state} />
      <Field label={t.email}><input className="input" name="email" type="email" autoComplete="username" inputMode="email" required autoFocus /></Field>
      <PasswordField label={t.password} name="password" autoComplete="current-password" lang={locale} />
      <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" name="remember" className="w-4 h-4 accent-[var(--fjord)]" />{t.remember}</label>
        <button type="button" onClick={() => setReset(true)} className="text-fjord underline underline-offset-4 hover:text-ink">{t.forgot}</button>
      </div>
      <button className="btn btn-plain w-full !py-3.5 !text-[15.5px]" type="submit" disabled={pending} aria-busy={pending}>{pending ? `${t.busy} …` : t.submit}</button>
    </form>
  );
}

function ResetForm({ locale, onBack }: { locale: L; onBack: () => void }) {
  const t = S[locale];
  const [state, action, pending] = useActionState(requestReset, undefined);
  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="design" value="moderne" />
      <p className="text-[15px] text-ink-2">{t.resetIntro}</p>
      <Message state={state} />
      {!state?.ok && <Field label={t.email}><input className="input" name="email" type="email" autoComplete="username" required autoFocus /></Field>}
      {!state?.ok && <button className="btn btn-plain w-full !py-3.5" type="submit" disabled={pending}>{pending ? `${t.sending} …` : t.resetSubmit}</button>}
      <button type="button" onClick={onBack} className="justify-self-start text-[14px] text-fjord underline underline-offset-4 hover:text-ink">{t.back}</button>
    </form>
  );
}

export function SetupForm({ locale, email, name, devCode }: { locale: L; email: string; name: string; devCode?: string }) {
  const t = S[locale];
  const [state, action, pending] = useActionState(setup, undefined);
  const codeHelp = useId();
  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="design" value="moderne" />
      <Message state={state} />
      <Field label={t.code} helpId={codeHelp} help={devCode ? `${t.codeHelp} ${locale === "no" ? "Lokalt (utvikling)" : "Locally (development)"}: ${devCode}` : t.codeHelp}>
        <input className="input font-mono tracking-[.12em] uppercase" name="code" autoComplete="one-time-code" required placeholder="XXXX-XXXX" aria-describedby={codeHelp} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.name}><input className="input" name="name" autoComplete="name" defaultValue={name} required /></Field>
        <Field label={t.email}><input className="input" name="email" type="email" autoComplete="username" defaultValue={email} required /></Field>
      </div>
      <PasswordField label={t.newPw} help={t.pwHelp} name="password" autoComplete="new-password" lang={locale} />
      <PasswordField label={t.confirm} name="confirm" autoComplete="new-password" lang={locale} />
      <button className="btn btn-plain w-full !py-3.5" type="submit" disabled={pending}>{pending ? `${t.saving} …` : t.create}</button>
    </form>
  );
}

export function ChoosePasswordForm({ locale, token, email }: { locale: L; token: string; email: string }) {
  const t = S[locale];
  const [state, action, pending] = useActionState(choosePassword, undefined);
  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="lang" value={locale} />
      <input type="hidden" name="design" value="moderne" />
      <input type="hidden" name="token" value={token} />
      <input type="text" name="username" autoComplete="username" defaultValue={email} className="sr-only" tabIndex={-1} aria-hidden readOnly />
      <Message state={state} />
      <PasswordField label={t.newPw} help={t.pwHelp} name="password" autoComplete="new-password" lang={locale} />
      <PasswordField label={t.confirm} name="confirm" autoComplete="new-password" lang={locale} />
      <button className="btn btn-plain w-full !py-3.5" type="submit" disabled={pending}>{pending ? `${t.saving} …` : t.choose}</button>
    </form>
  );
}

export function ChangePasswordForm({ locale, email }: { locale: L; email: string }) {
  const t = S[locale];
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-4">
      <input type="hidden" name="lang" value={locale} />
      <input type="text" name="username" autoComplete="username" defaultValue={email} className="sr-only" tabIndex={-1} aria-hidden readOnly />
      <Message state={state} />
      <PasswordField label={t.current} name="current" autoComplete="current-password" lang={locale} />
      <PasswordField label={t.newPw} help={t.pwHelp} name="password" autoComplete="new-password" lang={locale} />
      <PasswordField label={t.confirm} name="confirm" autoComplete="new-password" lang={locale} />
      <button className="btn btn-sm justify-self-start" type="submit" disabled={pending}>{pending ? `${t.saving} …` : t.change}</button>
    </form>
  );
}

export function ProfileForm({ locale, name, org }: { locale: L; name: string; org?: string }) {
  const t = S[locale];
  const [state, action, pending] = useActionState(updateProfile, undefined);
  return (
    <form action={action} onSubmit={keepValues(action)} className="grid gap-4">
      <input type="hidden" name="lang" value={locale} />
      <Message state={state} />
      <Field label={t.name}><input className="input" name="name" autoComplete="name" defaultValue={name} required /></Field>
      <Field label={t.org}><input className="input" name="org" autoComplete="organization" defaultValue={org ?? ""} /></Field>
      <button className="btn btn-sm justify-self-start" type="submit" disabled={pending}>{pending ? `${t.saving} …` : t.save}</button>
    </form>
  );
}
