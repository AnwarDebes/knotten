"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@/components/Track";
import Turnstile from "@/components/Turnstile";
import type { Locale } from "@/lib/i18n";
import { plotNo } from "@/lib/format";
import { CONTACT_NOTICE } from "@/lib/consent";
import { leadErrorText } from "@/lib/forms";
import { ACCESS_AREAS, LEAD_CONSENTS, LEAD_MAX, LEAD_ROLES, LEAD_TEXT, ROLE, accessAreaLabel, consentText, leadPayload, leadSummary, splitAround, type LeadPayload, type LeadRole } from "@/lib/leadForm";

/**
 * "Meld interesse" / "Register interest" in the Moderne look. The fields, the choices and what is sent come from
 * lib/leadForm.ts, the same as the Klassisk form; both send to /api/leads. Only the boxes the person ticks are sent
 * as consents; who the person is never counts as one.
 */
export default function InterestForm({ locale, plots, preselect = [], role: initialRole = "buyer", accountHref, level = 2 }: {
  locale: Locale;
  /** Every plot id ("plot-07"), in order. */
  plots: string[];
  preselect?: string[];
  role?: LeadRole;
  /** Where a buyer creates an account to follow plots. */
  accountHref?: string;
  /** The level of the confirmation's heading. */
  level?: 2 | 3;
}) {
  const t = LEAD_TEXT[locale];
  const [role, setRole] = useState<LeadRole>(initialRole);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState<LeadPayload | null>(null);
  const info = ROLE[role];
  const ids = useId();
  // the thank-you replaces the form: the keyboard and the screen reader are taken to it
  const thanks = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state === "done") thanks.current?.focus(); }, [state]);
  const started = useRef(false);
  const start = () => { if (!started.current) { started.current = true; track("form_start"); } };
  // when the form appeared: the server refuses forms sent faster than a person can fill them in
  const shown = useRef(0);
  useEffect(() => { shown.current = Date.now(); }, []);
  const token = useRef("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = leadPayload(new FormData(e.currentTarget), { source: "web (moderne)", locale, shownAt: shown.current, turnstile: token.current });
    setState("sending");
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        setSent(body);
        setState("done");
        return;
      }
      setErr((await res.json().catch(() => ({}))).error ?? "error");
    } catch {
      setErr("error");
    }
    setState("error");
  }

  if (state === "done" && sent) {
    const H = level === 2 ? "h2" : "h3";
    const access = sent.role === "access";
    return (
      <div ref={thanks} tabIndex={-1} className="grid gap-4 outline-none" role="status">
        <H className="display text-[clamp(28px,3.4vw,40px)]">{access ? t.thanksAccessTitle : t.thanksTitle}</H>
        <p className="lede">{access ? t.thanksAccess : t.thanks}</p>
        <dl className="grid gap-0 border-t line text-[15px]">
          {leadSummary(sent, locale).map((r) => (
            <div key={r.label} className="grid gap-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4 py-3 border-b line">
              <dt className="text-muted">{r.label}</dt>
              <dd>{r.values.length > 1 ? <ul className="grid gap-1">{r.values.map((v) => <li key={v}>{v}</li>)}</ul> : r.values[0]}</dd>
            </div>
          ))}
        </dl>
        <p className="provenance">{t.rights}</p>
        {accountHref && ROLE[sent.role].plots && (
          <div className="panel-2 p-5 grid gap-3 justify-items-start">
            <p className="text-[15px] text-ink-2">{t.follow}</p>
            <Link className="btn btn-sm no-underline" href={accountHref}>{t.createAccount}</Link>
          </div>
        )}
      </div>
    );
  }

  const [before, word, after] = splitAround(CONTACT_NOTICE[locale], t.privacyWord);
  const field = (k: string) => `${ids}-${k}`;
  const label = "grid gap-1 text-[14px]";
  return (
    // (method post: before the page's script runs, a sent form never puts the email and phone in the address)
    <form method="post" onSubmit={submit} onFocus={start} className="relative grid gap-5">
      <fieldset className="grid gap-1 text-[14px]">
        <legend className="mb-1.5 font-medium">{t.role}</legend>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {LEAD_ROLES.map((r) => (
            <label key={r} className="flex items-center gap-2 min-h-7 text-[15px]">
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="w-4 h-4 accent-[var(--fjord)]" />
              {ROLE[r].label[locale]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label} htmlFor={field("name")}>{t.name}<input className="input" id={field("name")} name="name" autoComplete="name" maxLength={LEAD_MAX.name} /></label>
        <label className={label} htmlFor={field("email")}>{t.email}<input className="input" id={field("email")} name="email" type="email" inputMode="email" required autoComplete="email" maxLength={200} /></label>
        <label className={label} htmlFor={field("phone")}>{t.phone}<input className="input" id={field("phone")} name="phone" type="tel" autoComplete="tel" maxLength={LEAD_MAX.phone} /></label>
        {info.org && <label className={label} htmlFor={field("org")}>{t.organisation}<input className="input" id={field("org")} name="organisation" autoComplete="organization" maxLength={LEAD_MAX.organisation} /></label>}
      </div>
      {role === "access" && (
        <label className={label} htmlFor={field("area")}>
          {t.area}
          <select className="input" id={field("area")} name="access_area" defaultValue="investor">
            {ACCESS_AREAS.map((a) => <option key={a} value={a}>{accessAreaLabel(a, locale)}</option>)}
          </select>
        </label>
      )}
      {info.plots && plots.length > 0 && (
        <fieldset className="text-[14px]">
          <legend className="mb-1.5">{t.plots}</legend>
          <div className="flex flex-wrap gap-1.5">
            {plots.map((p) => (
              <label key={p} className="chip cursor-pointer min-h-9 !px-2.5 has-[:checked]:bg-ink has-[:checked]:text-white">
                <input type="checkbox" name="plots" value={p} defaultChecked={preselect.includes(p)} className="mr-1 accent-[var(--fjord)]" />
                <span className="sr-only">{t.plot} </span>{plotNo(p)}
              </label>
            ))}
          </div>
          <p className="provenance mt-1.5">{t.plotsHelp}</p>
        </fieldset>
      )}
      <label className={label} htmlFor={field("msg")}>
        {t.message}
        <textarea className="input min-h-[112px]" id={field("msg")} name="message" rows={4} maxLength={LEAD_MAX.message} placeholder={role === "access" ? t.messageAccessPh : t.messagePh} />
      </label>
      <fieldset className="grid gap-1.5 text-[14px]">
        <legend className="mb-1">{t.consents}</legend>
        {LEAD_CONSENTS.map((p) => (
          <label key={p} className="flex items-start gap-2"><input type="checkbox" name={`consent_${p}`} className="mt-1 w-4 h-4 shrink-0 accent-[var(--fjord)]" /> <span>{consentText(p, locale)}</span></label>
        ))}
      </fieldset>
      <label className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden>Nettside<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <Turnstile locale={locale} onToken={(v) => { token.current = v; }} />
      <p className="text-[14px] text-ink-2">
        {before}<Link href={`/${locale}/personvern`} className="text-fjord underline underline-offset-4">{word}</Link>{after}
      </p>
      <button className="btn btn-amber justify-self-start" disabled={state === "sending"} aria-busy={state === "sending"}>{state === "sending" ? `${t.sending} …` : role === "access" ? t.sendAccess : t.send}</button>
      {state === "error" && <div className="text-[14px] text-[#8a2f1d]" role="alert">{leadErrorText(err, locale)}{err === "error" ? ` ${t.orWrite}` : ""}</div>}
      <div className="provenance">{t.rights}</div>
    </form>
  );
}
