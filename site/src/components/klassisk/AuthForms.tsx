"use client";
import { keepValues } from "@/components/keepValues";
import { useActionState, useId, useState } from "react";
import { choosePassword, login, requestReset, setup, type FormState } from "@/app/(moderne)/[locale]/login/actions";

/**
 * The login forms in the Klassisk look, in Norwegian (/logg-inn) and English (/english/logg-inn). The same server
 * actions as the Moderne design. Every form says it is Klassisk (`design`) and in which language, so the answers,
 * the emails, the password links and the logout lead back to the Klassisk pages in that language.
 */
type L = "no" | "en";

const T = {
  no: {
    show: "Vis", hide: "Skjul", thePassword: " passordet", email: "E-post", password: "Passord", remember: "Husk meg på denne enheten",
    forgot: "Glemt passord?", loggingIn: "Logger inn …", logIn: "Logg inn", resetIntro: "Skriv inn e-postadressen du bruker på kontoen.",
    sending: "Sender …", askReset: "Be om nytt passord", back: "Tilbake til innlogging", setupCode: "Oppsettskode",
    setupHelp: "Står i serverloggen ved første oppstart, eller i miljøvariabelen KNOTTEN_SETUP_CODE.", local: "Lokalt (utvikling):",
    fullName: "Fullt navn", newPassword: "Nytt passord", repeat: "Gjenta passordet", saving: "Lagrer …", createAndLogIn: "Opprett og logg inn",
    saveAndLogIn: "Lagre passord og logg inn", help: "Minst 10 tegn. En setning du husker er bedre enn et kort, komplisert ord.",
  },
  en: {
    show: "Show", hide: "Hide", thePassword: " the password", email: "Email", password: "Password", remember: "Remember me on this device",
    forgot: "Forgot your password?", loggingIn: "Logging in …", logIn: "Log in", resetIntro: "Enter the email address you use for the account.",
    sending: "Sending …", askReset: "Request a new password", back: "Back to log in", setupCode: "Setup code",
    setupHelp: "In the server log at the first start, or in the KNOTTEN_SETUP_CODE environment variable.", local: "Locally (development):",
    fullName: "Full name", newPassword: "New password", repeat: "Repeat the password", saving: "Saving …", createAndLogIn: "Create and log in",
    saveAndLogIn: "Save the password and log in", help: "At least 10 characters. A sentence you remember is better than a short, complicated word.",
  },
} satisfies Record<L, Record<string, string>>;

function Message({ state }: { state: FormState }) {
  if (!state?.error && !state?.ok) return null;
  return <div className={`full auth-msg${state.error ? " err" : " ok"}`} role={state.error ? "alert" : "status"}>{state.error ?? state.ok}</div>;
}

/** A password with a show button: the label names only the input; the button and the hint are separate. */
function Password({ name, autoComplete, label, help, locale, minLength }: { name: string; autoComplete: string; label: string; help?: string; locale: L; minLength?: number }) {
  const [shown, setShown] = useState(false);
  const id = useId();
  const t = T[locale];
  return (
    <div className="full field">
      <label htmlFor={id}>{label}</label>
      <span className="pw">
        <input id={id} name={name} type={shown ? "text" : "password"} autoComplete={autoComplete} required minLength={minLength} aria-describedby={help ? `${id}-help` : undefined} />
        <button type="button" onClick={() => setShown((v) => !v)} aria-controls={id}>{shown ? t.hide : t.show}<span className="sr">{t.thePassword}</span></button>
      </span>
      {help && <span className="small" id={`${id}-help`}>{help}</span>}
    </div>
  );
}

const Hidden = ({ locale }: { locale: L }) => (
  <>
    <input type="hidden" name="locale" value={locale} />
    <input type="hidden" name="lang" value={locale} />
    <input type="hidden" name="design" value="klassisk" />
  </>
);

export function KLoginForm({ next, locale = "no" }: { next?: string; locale?: L }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [reset, setReset] = useState(false);
  const t = T[locale];
  if (reset) return <KResetForm locale={locale} onBack={() => setReset(false)} />;
  return (
    <form className="form auth-form" action={action} onSubmit={keepValues(action)}>
      <Hidden locale={locale} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Message state={state} />
      <label className="full">{t.email}<input type="email" name="email" autoComplete="username" inputMode="email" required autoFocus /></label>
      <Password name="password" autoComplete="current-password" label={t.password} locale={locale} />
      <div className="full auth-row">
        <label className="consent"><input type="checkbox" name="remember" /> {t.remember}</label>
        <button type="button" className="linkish" onClick={() => setReset(true)}>{t.forgot}</button>
      </div>
      <div className="full"><button className="btn" type="submit" disabled={pending}>{pending ? t.loggingIn : t.logIn}</button></div>
    </form>
  );
}

function KResetForm({ onBack, locale }: { onBack: () => void; locale: L }) {
  const [state, action, pending] = useActionState(requestReset, undefined);
  const t = T[locale];
  return (
    <form className="form auth-form" action={action} onSubmit={keepValues(action)}>
      <Hidden locale={locale} />
      <p className="full small">{t.resetIntro}</p>
      <Message state={state} />
      {!state?.ok && <label className="full">{t.email}<input type="email" name="email" autoComplete="username" required autoFocus /></label>}
      {!state?.ok && <div className="full"><button className="btn" type="submit" disabled={pending}>{pending ? t.sending : t.askReset}</button></div>}
      <div className="full"><button type="button" className="linkish" onClick={onBack}>{t.back}</button></div>
    </form>
  );
}

export function KSetupForm({ email, name, devCode, locale = "no" }: { email: string; name: string; devCode?: string; locale?: L }) {
  const [state, action, pending] = useActionState(setup, undefined);
  const codeHelp = useId();
  const t = T[locale];
  return (
    <form className="form auth-form" action={action} onSubmit={keepValues(action)}>
      <Hidden locale={locale} />
      <Message state={state} />
      <div className="full field">
        <label>
          {t.setupCode}<input name="code" autoComplete="one-time-code" required placeholder="XXXX-XXXX" aria-describedby={codeHelp} style={{ fontFamily: "ui-monospace, monospace", letterSpacing: ".12em", textTransform: "uppercase" }} />
        </label>
        <span className="small" id={codeHelp}>{t.setupHelp}{devCode ? ` ${t.local} ${devCode}` : ""}</span>
      </div>
      <label>{t.fullName}<input name="name" autoComplete="name" defaultValue={name} required /></label>
      <label>{t.email}<input type="email" name="email" autoComplete="username" defaultValue={email} required /></label>
      <Password name="password" autoComplete="new-password" label={t.newPassword} help={t.help} locale={locale} minLength={10} />
      <Password name="confirm" autoComplete="new-password" label={t.repeat} locale={locale} minLength={10} />
      <div className="full"><button className="btn" type="submit" disabled={pending}>{pending ? t.saving : t.createAndLogIn}</button></div>
    </form>
  );
}

export function KChoosePasswordForm({ token, email, locale = "no" }: { token: string; email: string; locale?: L }) {
  const [state, action, pending] = useActionState(choosePassword, undefined);
  const t = T[locale];
  return (
    <form className="form auth-form" action={action} onSubmit={keepValues(action)}>
      <Hidden locale={locale} />
      <input type="hidden" name="token" value={token} />
      <input type="text" name="username" autoComplete="username" defaultValue={email} className="sr" tabIndex={-1} aria-hidden readOnly />
      <Message state={state} />
      <Password name="password" autoComplete="new-password" label={t.newPassword} help={t.help} locale={locale} minLength={10} />
      <Password name="confirm" autoComplete="new-password" label={t.repeat} locale={locale} minLength={10} />
      <div className="full"><button className="btn" type="submit" disabled={pending}>{pending ? t.saving : t.saveAndLogIn}</button></div>
    </form>
  );
}
