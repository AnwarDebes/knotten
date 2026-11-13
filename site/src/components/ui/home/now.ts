import { useEffect, useRef, useState } from "react";
import type { RightNow } from "@/lib/server/live";
import { solarPosition } from "@/lib/solar";
import { fmt, type Lang } from "@/lib/facts/core";

/**
 * "Akkurat nå på Knotten", shared by the two front pages (components/klassisk/home/RightNow.tsx and
 * components/ui/home/RightNow.tsx draw it, each in its own look). The weather and the power price come from
 * /api/now once the panel is close to the screen; sunset is worked out here from the sun's position at Knotten.
 * Nothing is fetched or worked out on the server, so the pages stay static and the figures are those of the visit.
 */

export type NowState = {
  /** waiting: nothing yet; ready: the answer is in (a service in it may still be missing); failed: no answer at all. */
  status: "waiting" | "ready" | "failed";
  data: RightNow | null;
  /** Today's sunset at Knotten (a flat horizon, no hills), once the page is in the browser. */
  sunset: Date | null;
};

/** The sun's upper edge on a flat horizon, with the air's bending of the light (the usual -0.833 degrees). */
const SUNSET_ELEVATION = -0.833;

/** Today's sunset at Knotten in Norwegian time, from lib/solar.ts; null if the sun does not set (never at 58 degrees). */
export function sunsetToday(now: Date): Date | null {
  const [y, m, d] = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Oslo" }).split("-").map(Number);
  // solar noon at Knotten falls before 12:00 UTC all year, so the sun only sinks from there to late evening
  let lo = Date.UTC(y, m - 1, d, 12), hi = Date.UTC(y, m - 1, d, 23, 30);
  if (solarPosition(new Date(lo)).elevation <= SUNSET_ELEVATION || solarPosition(new Date(hi)).elevation > SUNSET_ELEVATION) return null;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (solarPosition(new Date(mid)).elevation > SUNSET_ELEVATION) lo = mid; else hi = mid;
  }
  return new Date((lo + hi) / 2);
}

/** "16:12" in Norwegian time. */
export function clock(t: Date | string, lang: Lang): string {
  return new Date(t).toLocaleTimeString(lang === "no" ? "nb-NO" : "en-GB", { timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit", hour12: false });
}

// (`|| 0`: -0.4 °C rounds to minus zero, which would print as "-0")
export const tempText = (c: number, lang: Lang) => `${fmt(Math.round(c) || 0, lang)} °C`;
export const windText = (ms: number, lang: Lang) => `${fmt(Math.round(ms) || 0, lang)} m/s`;
export const priceText = (nok: number, lang: Lang) => `${fmt(nok, lang, 2)} kr`;

const REFRESH_MS = 10 * 60e3;

/** Fetches /api/now when `ref` comes within a screen of the view, and again when the visitor returns after a while. */
export function useRightNow<E extends HTMLElement>() {
  const ref = useRef<E | null>(null);
  const [state, setState] = useState<NowState>({ status: "waiting", data: null, sunset: null });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    let last = 0;
    const ctrl = new AbortController();
    const load = () => {
      last = Date.now();
      setState((s) => ({ ...s, sunset: sunsetToday(new Date()) }));
      fetch("/api/now", { signal: ctrl.signal })
        .then((r) => (r.ok ? (r.json() as Promise<RightNow>) : Promise.reject(new Error(String(r.status)))))
        .then((data) => { if (alive) setState((s) => ({ ...s, status: "ready", data })); })
        .catch(() => { if (alive) setState((s) => ({ ...s, status: s.data ? "ready" : "failed" })); });
    };
    const io = "IntersectionObserver" in window
      ? new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io?.disconnect(); load(); } }, { rootMargin: "100% 0px" })
      : null;
    if (io) io.observe(el); else load();
    const back = () => { if (document.visibilityState === "visible" && last && Date.now() - last > REFRESH_MS) load(); };
    document.addEventListener("visibilitychange", back);
    return () => { alive = false; ctrl.abort(); io?.disconnect(); document.removeEventListener("visibilitychange", back); };
  }, []);
  return [ref, state] as const;
}
