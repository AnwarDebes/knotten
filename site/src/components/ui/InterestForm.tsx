"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@/components/Track";
import Turnstile from "@/components/Turnstile";
import type { Locale } from "@/lib/i18n";
import { plotNo } from "@/lib/format";
import { CONSENT_TEXT, CONTACT_NOTICE, type ConsentPurpose } from "@/lib/consent";
import { leadErrorText } from "@/lib/forms";

const PURPOSES = ["buy", "invest", "partner", "curious"];
/** The optional boxes, unticked until the person ticks them. Contact about the registration itself needs none. */
const OPTIONAL: ConsentPurpose[] = ["updates", "investor", "research"];
const PRIVACY_WORD = { no: "personvernerklæringen", en: "privacy statement" };

export default function InterestForm({ locale, plots, preselect, purpose }: { locale: Locale; plots: string[]; preselect?: string; purpose?: string }) {
  const no = locale === "no";
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  // the thank-you replaces the form: the keyboard and the screen reader are taken to it
  const thanks = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state === "done") thanks.current?.focus(); }, [state]);
  const chosen = purpose && PURPOSES.includes(purpose) ? purpose : "buy";
  const [err, setErr] = useState("");
  const started = useRef(false);
  const start = () => { if (!started.current) { started.current = true; track("form_start"); } };
  // when the form appeared: the server refuses forms sent faster than a person can fill them in
  const shown = useRef(0);
  useEffect(() => { shown.current = Date.now(); }, []);
  const token = useRef("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const consents = Object.fromEntries(OPTIONAL.filter((p) => f.get(`consent_${p}`)).map((p) => [p, true]));
    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"), email: f.get("email"), phone: f.get("phone"), purpose: f.get("purpose"), website: f.get("website"),
          plots: f.getAll("plots"), consents, source: "web (moderne)", locale, elapsed: Date.now() - shown.current, turnstile: token.current,
        }),
      });
      if (res.ok) return setState("done");
      setErr((await res.json().catch(() => ({}))).error ?? "error");
    } catch {
      setErr("error");
    }
    setState("error");
  }
  if (state === "done") {
    return (
      <div ref={thanks} tabIndex={-1} className="panel p-6 max-w-[60ch] outline-none" role="status">
        <div className="display text-[30px]">{no ? "Registrert." : "Registered."}</div>
        <p className="mt-2">{no ? "Interessen din er lagret. Vi tar kontakt om det du har meldt interesse for." : "Your interest is saved. We will be in touch about what you registered for."}</p>
      </div>
    );
  }
  const notice = CONTACT_NOTICE[locale];
  const word = PRIVACY_WORD[locale];
  const at = notice.lastIndexOf(word);
  return (
    // (method post: before the page's script runs, a sent form never puts the email and phone in the address)
    <form method="post" onSubmit={submit} onFocus={start} className="relative grid gap-4 max-w-[60ch]">
      <label className="grid gap-1 text-[14px]">{no ? "Navn" : "Name"}<input className="input" name="name" autoComplete="name" /></label>
      <label className="grid gap-1 text-[14px]">{no ? "E-post" : "Email"}<input className="input" name="email" type="email" required autoComplete="email" /></label>
      <label className="grid gap-1 text-[14px]">{no ? "Telefon (valgfritt)" : "Phone (optional)"}<input className="input" name="phone" type="tel" autoComplete="tel" /></label>
      <fieldset className="grid gap-1 text-[14px]">
        <legend className="mb-1">{no ? "Jeg er interessert i å" : "I am interested in"}</legend>
        {[["buy", no ? "kjøpe bolig" : "buying a home"], ["invest", no ? "investere" : "investing"], ["partner", no ? "samarbeide (kommune, leverandør, forskning)" : "partnering (municipality, supplier, research)"], ["curious", no ? "følge med" : "following along"]].map(([v, l]) => (
          <label key={v} className="flex items-center gap-2"><input type="radio" name="purpose" value={v} defaultChecked={v === chosen} /> {l}</label>
        ))}
      </fieldset>
      <fieldset className="text-[14px]">
        <legend className="mb-1">{no ? "Tomter jeg vil høre om" : "Plots I want to hear about"}</legend>
        <div className="flex flex-wrap gap-1">
          {plots.map((p) => (
            <label key={p} className="chip cursor-pointer"><input type="checkbox" name="plots" value={p} defaultChecked={p === preselect} className="mr-1" />{plotNo(p)}</label>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-1.5 text-[14px]">
        <legend className="mb-1">{no ? "Samtykke (valgfritt)" : "Consent (optional)"}</legend>
        {OPTIONAL.map((p) => (
          <label key={p} className="flex items-start gap-2"><input type="checkbox" name={`consent_${p}`} className="mt-1" /> <span>{CONSENT_TEXT[p].text[locale]}</span></label>
        ))}
      </fieldset>
      <label className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden>Nettside<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <Turnstile locale={locale} onToken={(t) => { token.current = t; }} />
      <p className="text-[14px] text-ink-2">
        {at >= 0 ? <>{notice.slice(0, at)}<Link href={`/${locale}/personvern`} className="text-fjord underline underline-offset-4">{word}</Link>{notice.slice(at + word.length)}</> : <>{notice} <Link href={`/${locale}/personvern`} className="text-fjord underline underline-offset-4">{word}</Link></>}
      </p>
      <button className="btn btn-amber justify-self-start" disabled={state === "sending"}>{state === "sending" ? (no ? "Sender …" : "Sending …") : no ? "Meld interesse" : "Register interest"}</button>
      {state === "error" && <div className="text-[14px] text-[#8a2f1d]" role="alert">{leadErrorText(err, locale)}</div>}
      <div className="provenance">{no ? "Du kan trekke samtykker og be om innsyn eller sletting når som helst." : "You can withdraw consents and ask to see or delete your data at any time."}</div>
    </form>
  );
}
