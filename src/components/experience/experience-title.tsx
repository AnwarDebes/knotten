"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The title card over the experience. It is server-rendered for SEO and stays
 * fully visible so the visitor can read it, then fades out the moment they enter
 * the world: a click (to look around) or a movement key. The same context lives
 * in the narrative below the canvas and in the persistent badge.
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
    // Stay until the visitor enters: hide on the first click or movement key.
    const hideNow = () => setHidden(true);
    const onKey = (e: KeyboardEvent) => {
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ].includes(e.code)
      ) {
        hideNow();
      }
    };
    window.addEventListener("pointerdown", hideNow);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", hideNow);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      aria-hidden={hidden}
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 via-black/25 to-transparent p-4 transition-opacity duration-1000 sm:p-6 md:p-9",
        hidden ? "opacity-0" : "opacity-100",
      )}
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-white/80 uppercase">{eyebrow}</p>
      <h1 className="font-display mt-1 text-2xl leading-tight text-white sm:text-3xl md:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-[70vw] text-[13px] text-white/85 sm:max-w-xl sm:text-sm md:text-base">
        {lead}
      </p>
    </div>
  );
}
