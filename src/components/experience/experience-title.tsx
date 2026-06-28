"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The title card over the experience. It is server-rendered for SEO, then fades
 * out once the visitor is in the 3D world (the launcher fires `experience:ready`)
 * or as soon as they interact, so the walk is clean and uncluttered. The same
 * context lives in the narrative below the canvas and in the persistent badge.
 */
export function ExperienceTitle({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead: string;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let linger: ReturnType<typeof setTimeout> | undefined;
    const hideNow = () => setHidden(true);
    const onReady = () => {
      // Linger briefly after the world appears, then clear for a clean view.
      linger = setTimeout(hideNow, 2000);
    };
    window.addEventListener("experience:ready", onReady);
    window.addEventListener("keydown", hideNow);
    window.addEventListener("pointerdown", hideNow);
    // Fallback so the card never overstays if the ready event is missed.
    const fallback = setTimeout(hideNow, 11000);
    return () => {
      window.removeEventListener("experience:ready", onReady);
      window.removeEventListener("keydown", hideNow);
      window.removeEventListener("pointerdown", hideNow);
      if (linger) clearTimeout(linger);
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      aria-hidden={hidden}
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 via-black/25 to-transparent p-6 transition-opacity duration-1000 md:p-9",
        hidden ? "opacity-0" : "opacity-100",
      )}
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-white/80 uppercase">{eyebrow}</p>
      <h1 className="font-display mt-1 text-3xl leading-tight text-white md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-white/85 md:text-base">{lead}</p>
    </div>
  );
}
