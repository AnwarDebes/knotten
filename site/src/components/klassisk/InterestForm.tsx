"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@/components/Track";
import Turnstile from "@/components/Turnstile";
import { CONTACT } from "@/lib/facts";
import { CONSENT_TEXT, CONTACT_NOTICE, type ConsentPurpose } from "@/lib/consent";
import { leadErrorText } from "@/lib/forms";

type L = "no" | "en";
/** Each "interessert som" choice and the purpose the project's lead records use for it. */
const ROLES: { no: string; en: string; purpose: "buy" | "invest" | "partner" | "curious" }[] = [
  { no: "Boligkjøper", en: "Home buyer", purpose: "buy" },
  { no: "Investor eller partner", en: "Investor or partner", purpose: "invest" },
  { no: "Kommune eller offentlig aktør", en: "Municipality or public body", purpose: "partner" },
  { no: "Forsker eller student", en: "Researcher or student", purpose: "partner" },
  { no: "Presse", en: "Press", purpose: "curious" },
];
/** The optional boxes, unticked until the person ticks them. Contact about the registration itself needs none. */
const OPTIONAL: ConsentPurpose[] = ["updates", "investor", "research"];
const PRIVACY_WORD = { no: "personvernerklæringen", en: "privacy statement" };

const S = {
  no: {
    name: "Navn", namePh: "Fornavn Etternavn", email: "E-post", emailPh: "navn@eksempel.no", role: "Jeg er interessert som", phone: "Telefon (valgfritt)",
    plot: "Tomt", message: "Melding", messagePh: "Hva vil du vite mer om?", consents: "Samtykke (valgfritt)", send: "Send interessemelding", sending: "Sender",
    sent: "Sendt. Takk, interessen din er registrert.", rights: "Du kan trekke samtykker og be om innsyn eller sletting når som helst.",
  },
  en: {
    name: "Name", namePh: "First and last name", email: "Email", emailPh: "name@example.com", role: "I am interested as", phone: "Phone (optional)",
    plot: "Plot", message: "Message", messagePh: "What would you like to know more about?", consents: "Consent (optional)", send: "Send registration", sending: "Sending",
    sent: "Sent. Thank you, your interest is registered.", rights: "You can withdraw consents and ask to see or delete your data at any time.",
  },
};

/**
 * Sends to the same records as the Moderne form (/api/leads), so the owner sees every lead in the
 * admin whichever design it came from. Both designs number the plots the same way (layout v6), so a
 * plot chosen in the plot picker is counted with that plot in the records, and named in the note.
 * Only the boxes the person ticks are sent as consents; the role chosen is never taken as one.
 */
export default function InterestForm({ plot, role, locale = "no", privacyHref = "/personvern" }: { plot?: string; role?: string; locale?: L; privacyHref?: string }) {
  const t = S[locale];
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  const started = useRef(false);
  const start = () => { if (!started.current) { started.current = true; track("form_start"); } };
  // when the form appeared: the server refuses forms sent faster than a person can fill them in
  const shown = useRef(0);
  useEffect(() => { shown.current = Date.now(); }, []);
  const token = useRef("");
  const initial = ROLES.find((r) => r.no === role || r.en === role || (role === "investor" && r.purpose === "invest"))?.no ?? ROLES[0].no;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const chosen = ROLES.find((r) => r.no === String(f.get("role") ?? "")) ?? ROLES[0];
    // the note is for the project, in Norwegian whatever the form's language
    const note = [`Interessert som: ${chosen.no}.`, plot ? `Gjelder tomt ${plot} i tomtevelgeren (klassisk design).` : "", String(f.get("message") ?? "").trim()]
      .filter(Boolean)
      .join("\n");
    const consents = Object.fromEntries(OPTIONAL.filter((p) => f.get(`consent_${p}`)).map((p) => [p, true]));
    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"), email: f.get("email"), phone: f.get("phone"), purpose: chosen.purpose, plots: plot && /^\d{1,2}$/.test(plot) ? [`plot-${plot.padStart(2, "0")}`] : [], message: note, website: f.get("website"),
          consents, source: "web (klassisk)", locale, elapsed: Date.now() - shown.current, turnstile: token.current,
        }),
      });
      if (res.ok) return setState("sent");
      setErr((await res.json().catch(() => ({}))).error ?? "");
    } catch {
      setErr("");
    }
    setState("error");
  }
  const notice = CONTACT_NOTICE[locale];
  const word = PRIVACY_WORD[locale];
  const at = notice.lastIndexOf(word);
  return (
    // (method post: before the page's script runs, a sent form never puts the email and phone in the address)
    <form className="form" method="post" onSubmit={submit} onFocus={start}>
      <label>{t.name}<input type="text" id="f-name" name="name" autoComplete="name" placeholder={t.namePh} /></label>
      <label>{t.email}<input type="email" id="f-mail" name="email" autoComplete="email" placeholder={t.emailPh} required /></label>
      <label>
        {t.role}
        <select id="f-role" name="role" defaultValue={initial}>
          {ROLES.map((r) => <option key={r.no} value={r.no}>{r[locale]}</option>)}
        </select>
      </label>
      <label>{t.phone}<input type="tel" id="f-tel" name="phone" autoComplete="tel" /></label>
      {plot && <label className="full">{t.plot}<input type="text" id="f-plot" name="plot" defaultValue={`${t.plot} ${plot}`} readOnly /></label>}
      <label className="full">{t.message}<textarea id="f-msg" name="message" rows={4} placeholder={t.messagePh} /></label>
      <label className="sr" aria-hidden>Nettside<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      <fieldset className="full consents">
        <legend>{t.consents}</legend>
        {OPTIONAL.map((p) => (
          <label key={p} className="consent">
            <input type="checkbox" id={`f-consent-${p}`} name={`consent_${p}`} />
            <span className="small">{CONSENT_TEXT[p].text[locale]}</span>
          </label>
        ))}
      </fieldset>
      <div className="full"><Turnstile locale={locale} onToken={(v) => { token.current = v; }} /></div>
      <p className="full small notice">
        {at >= 0 ? <>{notice.slice(0, at)}<Link href={privacyHref}>{word}</Link>{notice.slice(at + word.length)}</> : <>{notice} <Link href={privacyHref}>{word}</Link></>} {t.rights}
      </p>
      <div className="full cta-row" style={{ marginTop: 4 }}>
        <button className="btn" type="submit" disabled={state === "sending" || state === "sent"}>{state === "sending" ? t.sending : t.send}</button>
        {/* (a live region that is always there, so the result is read out when it appears) */}
        <span role="status" className="small" style={{ alignSelf: "center" }}>{state === "sent" ? t.sent : ""}</span>
        {state === "error" && (
          <span role="alert" className="small no" style={{ alignSelf: "center" }}>
            {err ? leadErrorText(err, locale) : locale === "no" ? `Det gikk ikke å sende. Prøv igjen, eller skriv til ${CONTACT.email}.` : `It could not be sent. Try again, or write to ${CONTACT.email}.`}
          </span>
        )}
      </div>
    </form>
  );
}
