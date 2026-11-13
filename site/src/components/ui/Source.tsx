"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { sourceOf, type AnySourceId } from "@/lib/content/sources";

/**
 * The small "Kilde" / "Source" chip after a figure. Opens a card with the source's own words, the document it comes
 * from, and "Åpne kilden" / "Open the source" when the source is public online, so every number on the page can be
 * checked where it stands. The same behaviour as the Klassisk chip (components/klassisk/Source.tsx), in Moderne's
 * look. Closes on Escape (back to the chip), on a click elsewhere, when the keyboard moves on past it, and when
 * the chip is pressed again.
 */
const WORDS = {
  no: { chip: "Kilde", open: "Åpne kilden" },
  en: { chip: "Source", open: "Open the source" },
};

export default function Src({ id, locale }: { id: AnySourceId; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"left" | "right">("left");
  const root = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const popId = useId();
  const s = sourceOf(id);
  const w = WORDS[locale];
  useEffect(() => {
    if (!open) return;
    const el = root.current;
    if (el) setSide(el.getBoundingClientRect().left > window.innerWidth - 380 ? "right" : "left");
    const down = (e: PointerEvent) => { if (el && !el.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pointerdown", down); window.removeEventListener("keydown", key); };
  }, [open]);
  // the keyboard moving on past the card closes it, as in Klassisk (a click elsewhere is handled above)
  const leave = (e: React.FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    if (open && next && !root.current?.contains(next)) setOpen(false);
  };
  return (
    <span ref={root} className="relative inline-block align-middle" onBlur={leave}>
      <button ref={button} type="button" className={`src ${open ? "on" : ""}`} aria-expanded={open} aria-controls={open ? popId : undefined} onClick={() => setOpen((o) => !o)}>
        {w.chip}
      </button>
      {open && (
        <span id={popId} role="dialog" aria-label={w.chip} className={`src-pop ${side === "right" ? "right-0" : "left-0"}`}>
          <span className="block">{s.quote}</span>
          <span className="block mt-2 text-[12px] opacity-80">
            {s.doc[locale]}
            {s.url && (
              <>
                {" "}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{w.open}</a>
              </>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
