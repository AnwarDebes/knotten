"use client";
import { useEffect, useRef, useState } from "react";
import { fmt, type Lang } from "@/lib/facts/core";

/**
 * Counts a number up from zero the first time it is scrolled into view. Renders the final value without JS. Numbers
 * are written as the page's language writes them: 40 181 in Norwegian, 40,181 in English.
 */
export default function CountUp({ value, prefix = "", suffix = "", duration = 1200, locale = "no" }: { value: number; prefix?: string; suffix?: string; duration?: number; locale?: Lang }) {
  const ref = useRef<HTMLElement>(null);
  const [n, setN] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / duration);
        const e = 1 - Math.pow(1 - k, 3);
        setN(Math.round(value * e));
        if (k < 1) requestAnimationFrame(step);
      };
      setN(0);
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);
  // (the Norwegian group separator is a no-break space; a plain space keeps the serif figures evenly set)
  return <b ref={ref}>{prefix}{fmt(n, locale).replace(/ | /g, " ")}{suffix}</b>;
}
