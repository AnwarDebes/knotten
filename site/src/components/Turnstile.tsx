"use client";
import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile, the check that a person is filling in the form, shown only when
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is set (the server checks the answer with TURNSTILE_SECRET_KEY). Usually it
 * passes without a puzzle. The answer is handed to the form through `onToken`; it is empty again when it expires.
 * The same small box in both designs; it sizes itself to the form on narrow screens.
 */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type Api = { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void };
declare global {
  interface Window { turnstile?: Api }
}

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<Api> | null = null;
function load(): Promise<Api> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<Api>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
    s.onerror = () => { loading = null; reject(new Error("turnstile")); };
    document.head.appendChild(s);
  });
  return loading;
}

export default function Turnstile({ locale, onToken }: { locale: "no" | "en"; onToken: (token: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  useEffect(() => { cb.current = onToken; }, [onToken]);
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !box.current) return;
    let id = "";
    let gone = false;
    load()
      .then((t) => {
        if (gone || !box.current) return;
        id = t.render(box.current, {
          sitekey: TURNSTILE_SITE_KEY,
          language: locale === "no" ? "nb" : "en",
          theme: "light",
          size: "flexible",
          callback: (token: string) => cb.current(token),
          "expired-callback": () => cb.current(""),
          "error-callback": () => cb.current(""),
        });
      })
      .catch(() => cb.current(""));
    return () => {
      gone = true;
      if (id) window.turnstile?.remove(id);
    };
  }, [locale]);
  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={box} className="turnstile" style={{ minHeight: 65, maxWidth: "100%" }} />;
}
