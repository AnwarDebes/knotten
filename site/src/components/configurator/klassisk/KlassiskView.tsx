"use client";

/**
 * The model's picture in a Klassisk figure frame, with the caption under it. The 3D loads when the figure is in
 * sight on a computer, and on a tap on a phone; until then (and if it cannot run) the still stays.
 */
import { useRef } from "react";
import SceneSlot, { useArm3d, useSceneState, useSceneView } from "../SceneSlot";
import type { ConfiguratorData } from "../model";
import type { Configurator } from "../useConfigurator";

const VIEWS = ["exterior", "plot", "interior"] as const;

export default function KlassiskView({ c, data }: { c: Configurator; data: ConfiguratorData }) {
  const box = useRef<HTMLDivElement>(null);
  const { armed, arm } = useArm3d(box);
  const scene = useSceneState();
  const { view, setView } = useSceneView(c.step);
  const { t } = c;
  const live = armed && !scene.failed;
  return (
    <figure className="cfg-fig">
      <div ref={box} className="cfg-view">
        {live && (
          <SceneSlot config={c.cfg} plots={data.plots} view={view} lang={c.lang} design="klassisk" className="cfg-scene" onReady={scene.onReady} onFailed={scene.onFailed} />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- a plain still that fades out over the canvas; next/image adds nothing here */}
        <img
          src="/renders/web/site_after.webp"
          srcSet="/renders/web/site_after_960.webp 960w, /renders/web/site_after.webp 1920w"
          sizes="(min-width: 900px) 40vw, 100vw"
          alt={scene.ready && live ? "" : t.posterAlt}
          className={`cfg-still${scene.ready && live ? " gone" : ""}`}
        />
        {!armed && (
          <div className="cfg-open">
            <button type="button" className="btn" onClick={arm}>{t.open3d}</button>
          </div>
        )}
        {live && !scene.ready && <p role="status" className="cfg-loading">{t.loading3d} …</p>}
        {scene.failed && (
          <div role="alert" className="cfg-failed">
            <b>{t.failed3d}</b>
            <span>{t.failed3dText}</span>
          </div>
        )}
      </div>
      <figcaption>
        <span>{t.illustration}. {!armed ? t.open3dNote : null}</span>
        {live && (
          <span className="seg" role="group" aria-label={t.viewLabel}>
            {VIEWS.map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>{t.views[v]}</button>
            ))}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
