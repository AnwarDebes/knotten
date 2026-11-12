"use client";

/**
 * The 3D view in the Moderne frame. A still of the model holds the place: on a computer the 3D loads once the view
 * is in sight, on a phone when the visitor taps the button. The page scrolls past it either way; the scene itself
 * decides when it takes the pointer.
 */
import { useRef } from "react";
import SceneSlot, { useArm3d, useSceneState, useSceneView } from "../SceneSlot";
import type { ConfiguratorData } from "../model";
import type { Configurator } from "../useConfigurator";

const VIEWS = ["exterior", "plot", "interior"] as const;

export default function ModerneView({ c, data }: { c: Configurator; data: ConfiguratorData }) {
  const box = useRef<HTMLDivElement>(null);
  const { armed, arm } = useArm3d(box);
  const scene = useSceneState();
  const { view, setView } = useSceneView(c.step);
  const { t } = c;
  const live = armed && !scene.failed;
  return (
    <div
      ref={box}
      role="region"
      aria-label={t.viewRegion}
      className="frame relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:h-[clamp(300px,calc(100svh-var(--nav-h)-300px),620px)]"
    >
      {live && (
        <SceneSlot
          config={c.cfg}
          plots={data.plots}
          view={view}
          lang={c.lang}
          design="moderne"
          className="absolute inset-0 w-full h-full"
          onReady={scene.onReady}
          onFailed={scene.onFailed}
        />
      )}
      {/* the still: over the scene until its first frame, and in its place if it cannot run */}
      {/* eslint-disable-next-line @next/next/no-img-element -- a plain still that fades out over the canvas; next/image adds nothing here */}
      <img
        src="/renders/web/site_after.webp"
        srcSet="/renders/web/site_after_960.webp 960w, /renders/web/site_after.webp 1920w"
        sizes="(min-width: 1024px) 55vw, 100vw"
        alt={scene.ready && live ? "" : t.posterAlt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${scene.ready && live ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      />
      <span className="absolute left-3 top-3 chip !bg-white/90 pointer-events-none">{t.illustration}</span>

      {!armed && (
        <div className="absolute inset-0 grid place-items-center p-4 bg-gradient-to-t from-night/55 via-night/10 to-transparent">
          <div className="glass text-center px-5 py-4 md:px-7 md:py-5 max-w-[400px]">
            <button type="button" className="btn btn-amber text-[15.5px] px-6 py-3.5" onClick={arm}>{t.open3d}</button>
            <p className="mt-2.5 text-[13.5px] leading-snug text-white/90">{t.open3dNote}</p>
          </div>
        </div>
      )}

      {live && !scene.ready && (
        <div className="absolute left-3 bottom-3 pointer-events-none">
          <div role="status" className="glass inline-flex items-center gap-3 px-3.5 py-2.5 text-[13.5px]">
            <span aria-hidden className="relative w-16 h-[2px] bg-white/20 overflow-hidden rounded"><span className="cfg-m-loadbar absolute inset-y-0 left-0 w-1/3 bg-amber" /></span>
            <span>{t.loading3d}</span>
          </div>
        </div>
      )}

      {scene.failed && (
        <div className="absolute inset-x-3 bottom-3">
          <div role="alert" className="glass p-4 max-w-[46ch]">
            <div className="font-medium">{t.failed3d}</div>
            <p className="mt-1 text-[13.5px] leading-snug text-white/90">{t.failed3dText}</p>
          </div>
        </div>
      )}

      {live && (
        <div className="absolute right-3 top-3 cfg-m-views" role="group" aria-label={t.viewLabel}>
          {VIEWS.map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>{t.views[v]}</button>
          ))}
        </div>
      )}
    </div>
  );
}
