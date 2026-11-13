"use client";

/**
 * The summary's actions for both designs: share the link, print, save (an account is needed) and send the setup to
 * Sigve Simonsen AS. The pages draw the buttons and the messages; the requests and their outcomes live here.
 */
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { CONSENT_TEXT } from "@/lib/consent";
import type { HouseConfig, Lang, SavedConfig, SaveResponse, SendPayload, SendResponse } from "@/lib/configurator/types";
import type { Design } from "@/lib/design";
import { loginPagePath, minSidePath, registerPath } from "@/lib/member-paths";
import type { Configurator } from "./useConfigurator";

// ------------------------------------------------------------------------------------------------ share

export function useShare(c: Configurator) {
  const [state, setState] = useState<{ kind: "idle" } | { kind: "copied" } | { kind: "manual"; url: string }>({ kind: "idle" });
  // "copied" is a short confirmation: it goes after a few seconds
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const reset = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setState({ kind: "idle" });
  };
  const share = async () => {
    reset();
    const url = c.shareUrl();
    // a phone offers its own share sheet; a computer copies the link
    const nav = navigator as Navigator & { share?: (d: { title?: string; url: string }) => Promise<void> };
    if (nav.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await nav.share({ title: c.t.printTitle, url });
        return;
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setState({ kind: "copied" });
      timer.current = window.setTimeout(() => setState({ kind: "idle" }), 6000);
    } catch {
      setState({ kind: "manual", url });
    }
  };
  return { state, share, reset };
}

// ------------------------------------------------------------------------------------------------ print

/** The date and the link for the printed sheet, filled in just before printing (also for the browser's own print). */
export function usePrint(c: Configurator) {
  const [info, setInfo] = useState<{ date: string; url: string } | null>(null);
  const make = () => ({
    date: new Date().toLocaleDateString(c.lang === "no" ? "nb-NO" : "en-GB", { day: "numeric", month: "long", year: "numeric" }),
    url: c.shareUrl(),
  });
  const onBeforePrint = useEffectEvent(() => setInfo(make()));
  useEffect(() => {
    const before = () => onBeforePrint();
    window.addEventListener("beforeprint", before);
    return () => window.removeEventListener("beforeprint", before);
  }, []);
  const print = () => {
    flushSync(() => setInfo(make()));
    window.print();
  };
  return { info, print };
}

// ------------------------------------------------------------------------------------------------ save

export type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; item: SavedConfig }
  | { kind: "login" }
  | { kind: "unavailable" }
  | { kind: "error" };

export function useSave(c: Configurator) {
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const save = async () => {
    setState({ kind: "saving" });
    const payload = { name: c.saved?.name ?? c.t.saveName(c.plotNo), config: c.cfg, ...(c.saved ? { id: c.saved.id } : {}) };
    try {
      const r = await fetch("/api/configurator/saved", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
      // (read the body in every case, so the connection is let go)
      const j = (await r.json().catch(() => null)) as SaveResponse | null;
      if (r.status === 401) return setState({ kind: "login" });
      if (r.status === 404 || r.status === 405 || r.status === 501 || r.status === 503) return setState({ kind: "unavailable" });
      if (r.ok && j && j.ok) {
        c.setSaved({ id: j.item.id, name: j.item.name });
        return setState({ kind: "saved", item: j.item });
      }
      setState({ kind: "error" });
    } catch {
      setState({ kind: "error" });
    }
  };
  return { state, save, reset: () => setState({ kind: "idle" }) };
}

/**
 * Where to log in or sign up so the visitor comes back to this house, in the configurator's own design and language
 * (/logg-inn and /english/logg-inn in Klassisk, /no/login and /en/login in Moderne; lib/member-paths.ts).
 */
export function authLinks(design: Design, lang: Lang, back: string) {
  const next = `?next=${encodeURIComponent(back)}`;
  return { login: `${loginPagePath(design, lang)}${next}`, signup: `${registerPath(design, lang)}${next}`, mine: minSidePath(design, lang) };
}

// ------------------------------------------------------------------------------------------------ send

export type SendState = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; id: string } | { kind: "error"; message: string };

export const CONSENT_KEYS = ["updates", "plot_alerts"] as const;
export const consentText = (k: (typeof CONSENT_KEYS)[number], lang: Lang) => CONSENT_TEXT[k].text[lang];

export function useSend(c: Configurator, design: Design) {
  const [state, setState] = useState<SendState>({ kind: "idle" });
  const opened = useRef<number | null>(null);
  // the answer from Cloudflare Turnstile (components/Turnstile.tsx), when its keys are set; the server checks it
  const token = useRef("");
  const onToken = (v: string) => { token.current = v; };
  // the thank-you replaces the form: the keyboard and the screen reader are taken to it
  const doneId = useId();
  useEffect(() => {
    if (state.kind === "sent") document.getElementById(doneId)?.focus();
  }, [state.kind, doneId]);
  const onFocus = () => {
    if (opened.current === null) opened.current = Date.now();
  };
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const consents: SendPayload["consents"] = {};
    for (const k of CONSENT_KEYS) if (f.get(`consent_${k}`)) consents[k] = true;
    const payload: SendPayload = {
      config: c.cfg as HouseConfig,
      name: text("name"),
      email: text("email"),
      phone: text("phone") || undefined,
      message: text("message") || undefined,
      consents,
      design,
      locale: c.lang,
      website: String(f.get("website") ?? ""),
      elapsed: opened.current === null ? 0 : Date.now() - opened.current,
      turnstile: token.current,
    };
    setState({ kind: "sending" });
    try {
      const r = await fetch("/api/configurator/send", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
      const j = (await r.json().catch(() => null)) as SendResponse | null;
      if (r.ok && j && j.ok) return setState({ kind: "sent", id: j.id });
      const code = j && !j.ok ? j.error : "";
      setState({
        kind: "error",
        message: code === "captcha" ? c.t.sendCaptcha : /email/.test(code) ? c.t.sendInvalidEmail : /many|limit|rate/.test(code) || r.status === 429 ? c.t.sendTooMany : /fast|quick/.test(code) ? c.t.sendTooFast : c.t.sendError,
      });
    } catch {
      setState({ kind: "error", message: c.t.sendError });
    }
  };
  return { state, submit, onFocus, onToken, doneId };
}

/** The privacy notice with its last words as the link to the privacy statement. */
export function splitNotice(notice: string, phrase: string): [string, string, string] {
  const i = notice.toLowerCase().lastIndexOf(phrase.toLowerCase());
  if (i < 0) return [notice, "", ""];
  return [notice.slice(0, i), notice.slice(i, i + phrase.length), notice.slice(i + phrase.length)];
}
