"use client";

/**
 * The configurator's 3D view: the chosen plot in the measured model, with the configured house.
 *
 * CONTRACT STUB: shows the model still until the 3D stream lands. The configurator-3D stream replaces this file
 * and keeps the props. Pages load it with next/dynamic (ssr: false).
 */
import type { HouseConfig, Lang } from "@/lib/configurator/types";

export type ConfiguratorView = "exterior" | "plot" | "interior";

export type ConfiguratorSceneProps = {
  config: HouseConfig;
  /** Every plot (public/data/plots.json), so the scene can place the house and its neighbours. */
  plots: import("@/lib/types").Plot[];
  view: ConfiguratorView;
  lang: Lang;
  /** "klassisk" or "moderne": the frame and the controls take the design's look. */
  design: "klassisk" | "moderne";
  className?: string;
  /** Called once the first frame with the configured house is on screen. */
  onReady?: () => void;
  /** Called when the scene cannot run (no WebGL, a failed file); the page then shows its still. */
  onFailed?: (reason: string) => void;
};

export default function ConfiguratorScene({ lang, className }: ConfiguratorSceneProps) {
  return (
    <figure className={className} style={{ margin: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/renders/web/site_after.webp" alt={lang === "no" ? "Boligfeltet i modellen" : "The field in the model"} style={{ width: "100%", height: "auto", display: "block" }} />
    </figure>
  );
}
