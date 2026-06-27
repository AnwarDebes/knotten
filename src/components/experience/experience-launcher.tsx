"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import type { Heightmap } from "@/components/terrain/types";

/**
 * Client launcher for the immersive experience. On a capable device it enters
 * the 3D world automatically on mount, with no click: the world chunk and the
 * heightmap load in parallel behind a staged loading screen, and the walk
 * begins as soon as they resolve. The server-rendered shell stays free of
 * Three.js (the world is a dynamic ssr:false import), so the page is fast and
 * indexable, and phones / no-WebGL clients get the still fallback instead of a
 * broken canvas. Touch controls for small screens arrive in a later spec.
 */

type WorldComponent = ComponentType<{ heightmap: Heightmap }>;

function hasWebgl(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const STAGE_KEYS = ["terrain", "imagery", "plots", "sun", "homes"] as const;

function Poster({ alt }: { alt: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/terrain/fallback.jpg"
      alt={alt}
      className="h-full w-full object-cover"
      loading="eager"
    />
  );
}

export function ExperienceLauncher() {
  const t = useTranslations("opplev");
  const [checked, setChecked] = useState(false);
  const [capable, setCapable] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const [World, setWorld] = useState<WorldComponent | null>(null);
  const [heightmap, setHeightmap] = useState<Heightmap | null>(null);
  const [stage, setStage] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Capability check after mount (hydration-safe).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const ok = hasWebgl();
    setWebglOk(ok);
    setCapable(ok && window.innerWidth >= 768);
    setChecked(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Auto-enter: load the world chunk and the heightmap as soon as we know the
  // device is capable. No Enter click.
  useEffect(() => {
    if (!capable) return;
    let alive = true;
    timer.current = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGE_KEYS.length - 1));
    }, 600);
    import("./experience-world")
      .then((m) => {
        if (alive) setWorld(() => m.default);
      })
      .catch(() => {});
    // Progressive: the coarse heightmap renders instantly and is walkable at
    // once; the high-resolution terrain then streams in and swaps without a
    // wait. Fast things first, heavy things after.
    fetch("/terrain/heightmap.json")
      .then((r) => r.json())
      .then((d: Heightmap) => {
        if (alive) setHeightmap(d);
        fetch("/experience/terrain-hi.json")
          .then((r) => r.json())
          .then((hi: Heightmap) => {
            if (alive) setHeightmap(hi);
          })
          .catch(() => {});
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [capable]);

  const ready = Boolean(World && heightmap);
  useEffect(() => {
    if (ready && timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, [ready]);

  // Before the capability check resolves (and during SSR): show the poster, so
  // there is no layout shift and crawlers still see a real image.
  if (!checked) {
    return (
      <div className="h-full w-full">
        <Poster alt={t("fallbackTitle")} />
      </div>
    );
  }

  // Phones / no-WebGL: still fallback with a short note.
  if (!capable) {
    return (
      <div className="relative h-full w-full">
        <Poster alt={t("fallbackTitle")} />
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 to-transparent p-6">
          <p className="max-w-md rounded-md bg-black/55 px-4 py-3 text-center text-sm text-white">
            {webglOk ? t("enterHint") : t("fallbackNote")}
          </p>
        </div>
      </div>
    );
  }

  // Capable: the world (once ready) or the staged loader.
  return (
    <div className="relative h-full w-full bg-[#0b1722]">
      {ready && World && heightmap ? (
        <World heightmap={heightmap} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-white">
          <Poster alt={t("fallbackTitle")} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#0b1722]/85">
            <p className="font-display text-2xl tracking-tight">{t("loadingTitle")}</p>
            <div className="h-1 w-64 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full bg-[#c2674a] transition-all duration-500"
                style={{ width: `${((stage + 1) / STAGE_KEYS.length) * 100}%` }}
              />
            </div>
            <ul className="space-y-1 text-center text-sm">
              {STAGE_KEYS.map((k, i) => (
                <li key={k} className={i <= stage ? "text-white" : "text-white/35"}>
                  {i < stage ? "✓ " : i === stage ? "• " : ""}
                  {t(`loading.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
