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
 * indexable. Phones enter too, with on-screen touch controls and a lighter
 * quality profile; only devices with no real WebGL (or a software renderer) get
 * the still fallback instead of a broken canvas.
 */

export type Quality = {
  tier: "high" | "low";
  dpr: number;
  hiTerrain: boolean;
  treeStride: number;
  energyPer: number;
  labels: "all" | "plots";
  antialias: boolean;
};

type WorldComponent = ComponentType<{ heightmap: Heightmap; quality: Quality }>;

type GlProbe = { ok: boolean; webgl2: boolean; software: boolean };

function probeGl(): GlProbe {
  if (typeof window === "undefined") return { ok: false, webgl2: false, software: false };
  try {
    const c = document.createElement("canvas");
    const gl2 = c.getContext("webgl2");
    const gl = (gl2 || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return { ok: false, webgl2: false, software: false };
    let renderer = "";
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    if (dbg) renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    return { ok: true, webgl2: Boolean(gl2), software };
  } catch {
    return { ok: false, webgl2: false, software: false };
  }
}

/** A per-device quality profile, computed once, so phones run a lighter scene. */
function detectQuality(probe: GlProbe): Quality {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const lowEnd =
    (coarse && window.innerWidth < 900) ||
    ((nav as (Navigator & { deviceMemory?: number }) | undefined)?.deviceMemory ?? 8) <= 4 ||
    (nav?.hardwareConcurrency ?? 8) <= 4 ||
    !probe.webgl2;
  if (lowEnd) {
    return {
      tier: "low",
      dpr: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.5),
      hiTerrain: false,
      treeStride: 4,
      energyPer: 4,
      labels: "plots",
      antialias: false,
    };
  }
  return {
    tier: "high",
    dpr: 2,
    hiTerrain: true,
    treeStride: 1,
    energyPer: 10,
    labels: "all",
    antialias: true,
  };
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
  const [quality, setQuality] = useState<Quality | null>(null);
  const [World, setWorld] = useState<WorldComponent | null>(null);
  const [heightmap, setHeightmap] = useState<Heightmap | null>(null);
  const [stage, setStage] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Capability check after mount (hydration-safe).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const probe = probeGl();
    setQuality(detectQuality(probe));
    setCapable(probe.ok && !probe.software);
    setChecked(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Auto-enter: load the world chunk and the heightmap as soon as we know the
  // device is capable. No Enter click.
  useEffect(() => {
    if (!capable || !quality) return;
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
    // once; on high-tier devices the high-resolution terrain then streams in and
    // swaps. Phones stay on the light coarse heightmap. Fast things first.
    fetch("/terrain/heightmap.json")
      .then((r) => r.json())
      .then((d: Heightmap) => {
        if (alive) setHeightmap(d);
        if (quality.hiTerrain) {
          fetch("/experience/terrain-hi.json")
            .then((r) => r.json())
            .then((hi: Heightmap) => {
              if (alive) setHeightmap(hi);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [capable, quality]);

  const ready = Boolean(World && heightmap);
  useEffect(() => {
    if (ready && timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    // Tell the title card the world is in view so it can fade out for a clean walk.
    if (ready && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("experience:ready"));
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
            {t("fallbackNote")}
          </p>
        </div>
      </div>
    );
  }

  // Capable: the world (once ready) or the staged loader.
  return (
    <div className="relative h-full w-full bg-[#0b1722]">
      {ready && World && heightmap && quality ? (
        <World heightmap={heightmap} quality={quality} />
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
