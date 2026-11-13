"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Lang } from "@/lib/facts";
import type { Plot, PlotsFile } from "@/lib/types";

const Stage = dynamic(() => import("@/components/Stage"), { ssr: false, loading: () => <Still /> });

/** The model's still, the size the stage will have, until the stage itself is there. */
function Still() {
  return (
    <div className="kj-still" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- the stage's own still, shown until the stage takes over */}
      <img src="/renders/web/site_after.webp" srcSet="/renders/web/site_after_960.webp 960w, /renders/web/site_after.webp 1920w" sizes="(max-width: 1240px) 100vw, 1240px" alt="" loading="lazy" decoding="async" />
    </div>
  );
}

/**
 * The 3D journey on the Klassisk front page, framed under the photo hero: from the fjord, onto the field, down on a plot
 * and into the living room (components/Stage.tsx, in the Klassisk skin). The stage's code and the plot data load only
 * after the page itself has loaded, and only when the section is within half a screen, so the photo hero stays as
 * quick as it is; on a phone the model itself waits until the visitor asks for it (a still and a button until then).
 */
export default function Journey({ locale }: { locale: Lang }) {
  const box = useRef<HTMLDivElement>(null);
  const [plots, setPlots] = useState<Plot[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let alive = true;
    let io: IntersectionObserver | null = null;
    let idle = 0;
    const ctrl = new AbortController();
    const load = () => {
      // the stage's code and the plots come in side by side
      void import("@/components/Stage");
      fetch("/data/plots.json", { signal: ctrl.signal })
        .then((r) => (r.ok ? (r.json() as Promise<PlotsFile>) : Promise.reject(new Error(String(r.status)))))
        .then((f) => { if (alive) setPlots(f.plots); })
        .catch(() => { if (alive) setFailed(true); });
    };
    const watch = () => {
      if (!alive) return;
      if (!("IntersectionObserver" in window)) { load(); return; }
      io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io?.disconnect(); load(); } }, { rootMargin: "50% 0px" });
      io.observe(el);
    };
    const later = () => { idle = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(watch, { timeout: 2000 }) : window.setTimeout(watch, 300); };
    if (document.readyState === "complete") later(); else window.addEventListener("load", later, { once: true });
    return () => {
      alive = false;
      ctrl.abort();
      io?.disconnect();
      window.removeEventListener("load", later);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle); else window.clearTimeout(idle);
    };
  }, [tries]);

  const no = locale === "no";
  return (
    <div ref={box} className="kj-box">
      {plots ? <Stage plots={plots} locale={locale} variant="klassisk" /> : <Still />}
      {failed && !plots && (
        <div className="kj-fail" role="alert">
          <p>{no ? "Modellen kom ikke fram. Sjekk nettet og prøv igjen." : "The model did not load. Check your connection and try again."}</p>
          <button type="button" className="btn sm" onClick={() => { setFailed(false); setTries((n) => n + 1); }}>{no ? "Prøv igjen" : "Try again"}</button>
        </div>
      )}
    </div>
  );
}
