"use client";
import { keepValues } from "@/components/keepValues";
import { useActionState, useId, useState } from "react";
import { choosePassword, login, requestReset, setup, type FormState } from "@/app/(moderne)/[locale]/login/actions";

/**
 * The login forms in the Klassisk look. The same server actions as the Moderne design; Norwegian only. Every form
 * says it is Klassisk (`design`), so password links and the logout lead back to the Klassisk pages.
 */
function Message({ state }: { state: FormState }) {
  if (!state?.error && !state?.ok) return null;
  return <div className={`full auth-msg${state.error ? " err" : " ok"}`} role={state.error ? "alert" : "status"}>{state.error ?? state.ok}</div>;
}

/** A password with a show button: the label names only the input; the button and the hint are separate. */
function Password({ name, autoComplete, label, help }: { name: string; autoComplete: string; label: string; help?: string }) {
  const [shown, setShown] = useState(false);
  const id = useId();
  return (
    <div className="full field">
      <label htmlFor={id}>{label}</label>
      <span className="pw">
        <input id={id} name={name} type={shown ? "text" : "password"} autoComplete={autoComplete} required aria-describedby={help ? `${id}-help` : undefined} />
        <button type="button" onClick={() => setShown((v) => !v)} aria-controls={id}>{shown ? "Skjul" : "Vis"}<span className="sr"> passordet</span></button>
      </span>
      {help && <span className="small" id={`${id}-help`}>{help}</span>}
    </div>
  );
}

const HELP = "Minst 10 tegn. En setning du husker er bedre enn et kort, komplisert ord.";
const Hidden = () => (
  <>
    <input type="hidden" name="locale" value="no" />
    <input type="hidden" name="lang" value="no" />
    <input type="hidden" name="design" value="klassisk" />
  </>
);

export function KLoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [reset, setReset] = useState(false);
  if (reset) return <KResetForm onBack={() => setReset(false)} />;
  return (
    <form className="form auth-form" action={action} onSubmit={keepValues(action)}>
      <Hidden />
      <input type="hidden" name="next" value={next ?? ""} />
      <Message state={state} />
      <label className="full">E-post<input type="email" name="email" autoComplete="username" inputMode="email" required autoFocus /></label>
      <Password name="password" autoComplete="current-password" label="Passord" />
      <div className="full auth-row">
        <label className="consent"><input type="checkbox" name="remember" /> Husk meg på denne enheten</label>
        <button type="button" className="linkish" onClick={() => setReset(true)}>Glemt passord?</button>
      </div>
      <div className="full"><button className="btn" type="submit" disabled={pending}>{pending ? "Logger inn …" : "Logg inn"}</button></div>
    </form>
  );
}

function KResetForm({ onBack }: { onBack: () => void }) {
  const [state, action, pending] = useActionState(requestReset, undefined);
  return (
    <form className="form auth-form" action={action} onSubmit={keepValues(action)}>
      <Hidden />
      <p className="full small">Skriv inn e-postadressen du bruker i portalen.</p>
      <Message state={state} />
      {!state?.ok && <label className="full">E-post<input type="email" name="email" autoComplete="username" required autoFocus /></label>}
      {!state?.ok && <div className="full"><button className="btn" type="submit" disabled={pending}>{pending ? "Sender …" : "Be om nytt passord"}</button></div>}
      <div className="full"><button type="button" className="linkish" onClick={onBack}>Tilbake til innlogging</button></div>
    </form>
  );
}

export function KSetupForm({ email, name, devCode }: { email: string; name: string; devCode?: string }) {
  const [state, action, pending] = useActionState(setup, undefined);
  const codeHelp = useId();
  return (
    <form className="form auth-form" action={action} onSubmit={keepValues(action)}>
      <Hidden />
      <Message state={state} />
      <div className="full field">
        <label>
          Oppsettskode<input name="code" autoComplete="one-time-code" required placeholder="XXXX-XXXX" aria-describedby={codeHelp} style={{ fontFamily: "ui-monospace, monospace", letterSpacing: ".12em", textTransform: "uppercase" }} />
        </label>
        <span className="small" id={codeHelp}>Står i serverloggen ved første oppstart, eller i miljøvariabelen KNOTTEN_SETUP_CODE.{devCode ? ` Lokalt (utvikling): ${devCode}` : ""}</span>
      </div>
      <label>Fullt navn<input name="name" autoComplete="name" defaultValue={name} required /></label>
      <label>E-post<input type="email" name="email" autoComplete="username" defaultValue={email} required /></label>
      <Password name="password" autoComplete="new-password" label="Nytt passord" help={HELP} />
      <Password name="confirm" autoComplete="new-password" label="Gjenta passordet" />
      <div className="full"><button className="btn" type="submit" disabled={pending}>{pending ? "Lagrer …" : "Opprett og logg inn"}</button></div>
    </form>
  );
}

export function KChoosePasswordForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(choosePassword, undefined);
  return (
    <form className="form auth-form" action={action} onSubmit={keepValues(action)}>
      <Hidden />
      <input type="hidden" name="token" value={token} />
      <input type="text" name="username" autoComplete="username" defaultValue={email} className="sr" tabIndex={-1} aria-hidden readOnly />
      <Message state={state} />
      <Password name="password" autoComplete="new-password" label="Nytt passord" help={HELP} />
      <Password name="confirm" autoComplete="new-password" label="Gjenta passordet" />
      <div className="full"><button className="btn" type="submit" disabled={pending}>{pending ? "Lagrer …" : "Lagre passord og logg inn"}</button></div>
    </form>
  );
}
