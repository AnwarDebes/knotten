"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * A floating, always-available assistant. It is a deliberate PREVIEW: there is no
 * language model and no retrieval behind it yet, and the badge and status note
 * say so. The shape is here so the real assistant can later answer investor and
 * buyer questions about the energy concept, the area, the homes and the process.
 * Hidden on the immersive 3D route, which has its own full-screen controls.
 */
function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M5.5 5.2h13A2.3 2.3 0 0 1 20.8 7.5v6A2.3 2.3 0 0 1 18.5 15.8h-6.4L8 19v-3.2H5.5A2.3 2.3 0 0 1 3.2 13.5v-6A2.3 2.3 0 0 1 5.5 5.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6.8 10.4c1 0 1-.85 2-.85s1 .85 2 .85 1-.85 2-.85 1 .85 2 .85"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

type Msg = { role: "user" | "assistant"; text: string };

export function AssistantWidget() {
  const t = useTranslations("assistant");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => [{ role: "assistant", text: t("intro") }]);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMessages((m) => [...m, { role: "user", text }]);
    // The preview always replies with the same honest note; a short pause reads
    // as a reply, with no blinking indicator.
    window.setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: t("status") }]);
    }, 500);
  };

  // The immersive 3D route has its own controls; keep the assistant off it.
  if (/\/(opplev|experience)\/?$/.test(pathname ?? "")) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end sm:right-6 sm:bottom-6">
      {open ? (
        <div
          role="dialog"
          aria-labelledby={titleId}
          className="assistant-panel mb-3 flex h-[min(31rem,72svh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg text-white"
        >
          <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <span className="assistant-mark flex h-9 w-9 items-center justify-center rounded-full">
              <Mark className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p id={titleId} className="text-sm leading-tight font-semibold">
                {t("title")}
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-[#7fd6df]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c2674a]" />
                {t("badge")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                fabRef.current?.focus();
              }}
              aria-label={t("closeLabel")}
              className="-mr-1 rounded p-1.5 text-white/65 transition-colors hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="m6 6 12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) =>
              m.role === "assistant" ? (
                <div key={i} className="flex gap-2.5">
                  <span className="assistant-mark mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                    <Mark className="h-3.5 w-3.5" />
                  </span>
                  <p className="max-w-[85%] rounded-lg rounded-tl-sm bg-white/[0.07] px-3 py-2 text-[13px] leading-relaxed text-white/90">
                    {m.text}
                  </p>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] rounded-lg rounded-tr-sm bg-[#16c2d4]/20 px-3 py-2 text-[13px] leading-relaxed text-white">
                    {m.text}
                  </p>
                </div>
              ),
            )}
          </div>

          <footer className="border-t border-white/10 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 focus-within:border-[#7fd6df]/50"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!draft.trim()}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#16c2d4] text-[#06222b] transition-opacity disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                  <path
                    d="M4 12 20 4l-4 16-4.5-6L4 12Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
            <p className="mt-2 flex items-center justify-between px-0.5 text-[11px] text-white/45">
              <span>{t("comingSoon")}</span>
              <Link
                href="/meld-interesse"
                className="font-medium text-[#7fd6df] transition-colors hover:text-[#a9e7ee]"
              >
                {t("cta")} &rarr;
              </Link>
            </p>
          </footer>
        </div>
      ) : null}

      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t("openLabel")}
        className="assistant-fab relative flex items-center justify-center gap-2 rounded-full p-4 text-sm font-medium text-[#9fe9f1] sm:px-4 sm:py-3"
      >
        <Mark className="h-6 w-6 sm:h-5 sm:w-5" />
        <span className="hidden text-white sm:inline">{t("fab")}</span>
      </button>
    </div>
  );
}
