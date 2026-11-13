"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@/components/Track";
import Turnstile from "@/components/Turnstile";
import { CONTACT_NOTICE } from "@/lib/consent";
import { leadErrorText } from "@/lib/forms";
import { plotNo } from "@/lib/format";
import { ACCESS_AREAS, LEAD_CONSENTS, LEAD_MAX, LEAD_ROLES, LEAD_TEXT, ROLE, accessAreaLabel, consentText, leadPayload, leadSummary, splitAround, type LeadPayload, type LeadRole } from "@/lib/leadForm";

type L = "no" | "en";

/**
 * "Meld interesse" in the Klassisk look (plain CSS in (klassisk)/globals.css), in both languages. The fields, the
 * choices and what is sent come from lib/leadForm.ts, the same as the Moderne form; both send to /api/leads, so the
 * owner sees every lead in the admin whichever design and language it came from. Only the boxes the person ticks
 * are sent as consents; who the person is never counts as one.
 */
export default function InterestForm({ locale = "no", role: initialRole = "buyer", plots, preselect = [], privacyHref, accountHref, level = 3 }: {
  locale?: L;
  role?: LeadRole;
  /** Every plot id ("plot-07"), in order. */
  plots: string[];
  preselect?: string[];
  privacyHref: string;
  /** Where a buyer creates an account to follow plots. */
  accountHref?: string;
  /** The level of the confirmation's heading (the form sits under an h2 on the contact page). */
  level?: 2 | 3;
}) {
  const t = LEAD_TEXT[locale];
  const [role, setRole] = useState<LeadRole>(initialRole);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState<LeadPayload | null>(null);
  const info = ROLE[role];
  const ids = useId();
  const started = useRef(false);
  const start = () => { if (!started.current) { started.current = true; track("form_start"); } };
  // when the form appeared: the server refuses forms sent faster than a person can fill them in
  const shown = useRef(0);
  useEffect(() => { shown.current = Date.now(); }, []);
  const token = useRef("");
  // the confirmation replaces the form: the keyboard and the screen reader are taken to it
  const done = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state === "sent") done.current?.focus(); }, [state]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = leadPayload(new FormData(e.currentTarget), { source: "web (klassisk)", locale, shownAt: shown.current, turnstile: token.current });
    setState("sending");
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        setSent(body);
        setState("sent");
        return;
      }
      setErr((await res.json().catch(() => ({}))).error ?? "error");
    } catch {
      setErr("error");
    }
    setState("error");
  }

  if (state === "sent" && sent) {
    const H = level === 2 ? "h2" : "h3";
    const access = sent.role === "access";
    return (
      <div ref={done} tabIndex={-1} role="status" className="mdone lead-done">
        <H>{access ? t.thanksAccessTitle : t.thanksTitle}</H>
        <p className="lede">{access ? t.thanksAccess : t.thanks}</p>
        <dl className="devfacts">
          {leadSummary(sent, locale).map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.values.length > 1 ? <ul className="lead-list">{r.values.map((v) => <li key={v}>{v}</li>)}</ul> : r.values[0]}</dd>
            </div>
          ))}
        </dl>
        <p className="small">{t.rights}</p>
        {accountHref && ROLE[sent.role].plots && (
          <div className="mnote">
            <p>{t.follow}</p>
            <Link className="btn sm" href={accountHref}>{t.createAccount}</Link>
          </div>
        )}
      </div>
    );
  }

  const [before, word, after] = splitAround(CONTACT_NOTICE[locale], t.privacyWord);
  const field = (k: string) => `${ids}-${k}`;
  return (
    // (method post: before the page's script runs, a sent form never puts the email and phone in the address)
    <form className="form lead-form" method="post" onSubmit={submit} onFocus={start}>
      <fieldset className="full consents">
        <legend>{t.role}</legend>
        <div className="lead-roles">
          {LEAD_ROLES.map((r) => (
            <label key={r} className="choice">
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} />
              {ROLE[r].label[locale]}
            </label>
          ))}
        </div>
      </fieldset>
      <label htmlFor={field("name")}>{t.name}<input type="text" id={field("name")} name="name" autoComplete="name" placeholder={t.namePh} maxLength={LEAD_MAX.name} /></label>
      <label htmlFor={field("email")}>{t.email}<input type="email" id={field("email")} name="email" autoComplete="email" inputMode="email" placeholder={t.emailPh} required maxLength={200} /></label>
      <label htmlFor={field("phone")}>{t.phone}<input type="tel" id={field("phone")} name="phone" autoComplete="tel" maxLength={LEAD_MAX.phone} /></label>
      {info.org && <label htmlFor={field("org")}>{t.organisation}<input type="text" id={field("org")} name="organisation" autoComplete="organization" maxLength={LEAD_MAX.organisation} /></label>}
      {role === "access" && (
        <label htmlFor={field("area")} className="full">
          {t.area}
          <select id={field("area")} name="access_area" defaultValue="investor">
            {ACCESS_AREAS.map((a) => <option key={a} value={a}>{accessAreaLabel(a, locale)}</option>)}
          </select>
        </label>
      )}
      {info.plots && plots.length > 0 && (
        <fieldset className="full consents">
          <legend>{t.plots}</legend>
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
      )}
      <label htmlFor={field("msg")} className="full">{t.message}<textarea id={field("msg")} name="message" rows={4} maxLength={LEAD_MAX.message} placeholder={role === "access" ? t.messageAccessPh : t.messagePh} /></label>
      <label className="sr" aria-hidden>Nettside<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      <fieldset className="full consents">
        <legend>{t.consents}</legend>
        {LEAD_CONSENTS.map((p) => (
          <label key={p} className="consent">
            <input type="checkbox" name={`consent_${p}`} />
            <span className="small">{consentText(p, locale)}</span>
          </label>
        ))}
      </fieldset>
      <div className="full"><Turnstile locale={locale} onToken={(v) => { token.current = v; }} /></div>
      <p className="full small notice">
        {before}<Link href={privacyHref}>{word}</Link>{after} {t.rights}
      </p>
      <div className="full cta-row" style={{ marginTop: 4 }}>
        <button className="btn" type="submit" disabled={state === "sending"} aria-busy={state === "sending"}>{state === "sending" ? `${t.sending} …` : role === "access" ? t.sendAccess : t.send}</button>
        {state === "error" && (
          <span role="alert" className="small no" style={{ alignSelf: "center" }}>
            {leadErrorText(err, locale)}{err === "error" ? ` ${t.orWrite}` : ""}
          </span>
        )}
      </div>
    </form>
  );
}
