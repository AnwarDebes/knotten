"use client";

/**
 * The 3D view, loaded only when a page renders this slot (after the view is in sight and armed): until then neither
 * the scene's code nor the model's data is fetched. Both designs put their own frame, still and buttons around it.
 */
import { useCallback, useEffect, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import type { ConfiguratorSceneProps, ConfiguratorView } from "./ConfiguratorScene";
import type { StepKey } from "./model";

const ConfiguratorScene = dynamic(() => import("./ConfiguratorScene"), { ssr: false });

export default function SceneSlot(props: ConfiguratorSceneProps) {
  return <ConfiguratorScene {...props} />;
}

/** The view each step shows first: the plot from above while choosing it, the rooms for the interior, else the house. */
export const STEP_VIEW: Record<StepKey, ConfiguratorView> = {
  tomt: "plot",
  hus: "exterior",
  fasade: "exterior",
  energi: "exterior",
  interior: "interior",
  ute: "exterior",
  oppsummering: "exterior",
};

/**
 * When the 3D view may load. On a computer with a fine pointer and enough memory it loads once the view scrolls into
 * sight; on a phone or tablet, with data saving or with reduced motion, the still stays until the visitor asks.
 */
export function useArm3d(ref: RefObject<HTMLElement | null>) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const capable =
      !window.matchMedia("(pointer: coarse)").matches &&
      (nav.deviceMemory ?? 8) >= 4 &&
      !nav.connection?.saveData &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!capable) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setArmed(true);
        io.disconnect();
      }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return { armed, arm: () => setArmed(true) };
}

/** The view the 3D shows: the step's own, until the visitor picks another for this step. */
export function useSceneView(step: StepKey) {
  const [pick, setPick] = useState<{ step: StepKey; view: ConfiguratorView } | null>(null);
  const view = pick && pick.step === step ? pick.view : STEP_VIEW[step];
  return { view, setView: (v: ConfiguratorView) => setPick({ step, view: v }) };
}

/** Ready and failed, as the scene reports them. A failure keeps the still and says why. */
export function useSceneState() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFailed = useCallback(() => setFailed(true), []);
  return { ready, failed, onReady, onFailed };
}
