"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { kSplit, type KLocale } from "@/lib/klassisk/locale";
import { sourceOf, type AnySourceId } from "@/lib/content/sources";

/**
 * The "Kilde" chips of the Klassisk design and the one popover they share: the source's own words, the document it
 * comes from, and "Åpne kilden" / "Open the source" when the source is public online. The same behaviour as the
 * Moderne chip (components/ui/Source.tsx), in Klassisk's look. The language follows the page's address (/english is
 * English). The keyboard goes into the popover when it opens, Escape closes it and returns to the chip, and Tab past
 * its end carries on after the chip.
 */
type Open = { key: string; id: AnySourceId };
type Ctx = { open: (key: string, id: AnySourceId, el: HTMLElement) => void; current: Open | null; locale: KLocale; popId: string };
const SourceCtx = createContext<Ctx>({ open: () => {}, current: null, locale: "no", popId: "" });

const WORDS = {
  no: { chip: "Kilde", dialog: "Kilde", open: "Åpne kilden" },
  en: { chip: "Source", dialog: "Source", open: "Open the source" },
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** The next element the keyboard would reach after `el` (or `el` itself when it is the last one). */
function focusAfter(el: HTMLElement | null, skip: HTMLElement | null) {
  if (!el) return;
  const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((x) => !skip?.contains(x) && (x.offsetParent !== null || x === el));
  const next = all[all.indexOf(el) + 1];
  (next ?? el).focus();
}

/** Holds the one shared popover that every "Kilde" chip opens. */
export default function SourceProvider({ children, locale: fixed }: { children: React.ReactNode; locale?: KLocale }) {
  const pathname = usePathname() ?? "/";
  const locale = fixed ?? kSplit(pathname).locale;
  const [state, setState] = useState<(Open & { path: string }) | null>(null);
  // a popover belongs to the page it was opened on: another page shows none
  const current = state && state.path === pathname ? state : null;
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const popRef = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  // the chip whose popover is open, and on which page: pressing it again closes the popover
  const shown = useRef<{ key: string; path: string } | null>(null);
  const popId = useId();

  const open = useCallback((key: string, id: AnySourceId, el: HTMLElement) => {
    if (shown.current?.key === key && shown.current.path === pathname && trigger.current === el) {
      shown.current = null;
      setState(null);
      return;
    }
    trigger.current = el;
    shown.current = { key, path: pathname };
    setState({ key, id, path: pathname });
    const r = el.getBoundingClientRect();
    const left = Math.max(12, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - 352));
    setPos({ left, top: r.bottom + window.scrollY + 8 });
  }, [pathname]);

  const close = useCallback((back: boolean) => {
    shown.current = null;
    setState(null);
    if (back) trigger.current?.focus();
  }, []);

  useEffect(() => {
    if (!current) return;
    popRef.current?.focus({ preventScroll: true });
    const outside = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest(".src") || popRef.current?.contains(t)) return;
      close(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") close(true); };
    const resize = () => close(false);
    document.addEventListener("click", outside);
    document.addEventListener("keydown", esc);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("click", outside);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("resize", resize);
    };
  }, [current, close]);

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !popRef.current) return;
    const links = Array.from(popRef.current.querySelectorAll<HTMLElement>("a[href]"));
    const active = document.activeElement;
    if (e.shiftKey && (active === popRef.current || active === links[0])) {
      e.preventDefault();
      close(true);
    } else if (!e.shiftKey && (links.length === 0 || active === links[links.length - 1])) {
      e.preventDefault();
      const from = trigger.current;
      close(false);
      focusAfter(from, popRef.current);
    }
  };

  const s = current ? sourceOf(current.id) : null;
  const w = WORDS[locale];
  return (
    <SourceCtx.Provider value={{ open, current, locale, popId }}>
      {children}
      {s && (
        <div ref={popRef} id={popId} className="pop" role="dialog" aria-label={w.dialog} tabIndex={-1} onKeyDown={onKey} style={{ left: pos.left, top: pos.top, outline: "none" }}>
          {s.quote}
          <small>
            {s.doc[locale]}
            {s.url && (
              <>
                {" "}
                <a href={s.url} target="_blank" rel="noopener noreferrer">{w.open}</a>
              </>
            )}
          </small>
        </div>
      )}
    </SourceCtx.Provider>
  );
}

/** The chip. Put it right after the number it documents. `label` replaces "Kilde" / "Source". */
export function Src({ id, label }: { id: AnySourceId; label?: string }) {
  const { open, current, locale, popId } = useContext(SourceCtx);
  const key = useId();
  const on = current?.key === key;
  return (
    <button type="button" className="src" aria-expanded={on} aria-controls={on ? popId : undefined} onClick={(e) => open(key, id, e.currentTarget)}>
      {label ?? WORDS[locale].chip}
    </button>
  );
}
