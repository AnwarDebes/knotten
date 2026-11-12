"use client";

/**
 * The configurator's 3D view: the chosen plot in the measured model, with the house as the buyer has
 * configured it. Round the house ("exterior", with four camera places), from the plot towards the view
 * ("plot"), or inside on foot ("interior"). A change of the configuration reaches the model at once; the
 * model is not loaded again. With no plot chosen it shows the whole field.
 *
 * As on the other 3D pages, phones, tablets, small screens, data saving and reduced motion get a still and
 * a button: the model is opened, never pushed. The page always scrolls: the model takes the wheel and a
 * finger only after a click or a tap inside it, and Escape gives them back.
 *
 * Pages load it with next/dynamic (ssr: false).
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import type { HouseConfig, Lang } from "@/lib/configurator/types";
import { resolved, type PlotFacts } from "@/lib/configurator/state";
import { plotIndex } from "@/lib/configurator/palette";
import { houseOptions } from "@/lib/house/options";
import { HOUSE, type HouseFit } from "@/lib/house/plan";
import type { ConfigurePreset } from "../scene/KnottenScene";
import { fitFor, loadHouses } from "../scene/house/frame";
import { loadSite, type CustomBuild, type SiteData } from "../scene/house/custom";
import { addLook, requestClick, requestGoto, subscribeWalk, walkState, walkVersion } from "../scene/house/walkState";
import { useTapFocus } from "../scene/tapFocus";
import { has3d } from "../scene/has3d";
import s from "./ConfiguratorScene.module.css";

const KnottenScene = dynamic(() => import("../scene/KnottenScene"), { ssr: false });

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

const T = {
  region: { no: "3D-modell: huset på tomten", en: "3D model: the house on the plot" },
  summary: {
    no: "Huset med valgene dine, vist i den målte 3D-modellen av feltet. Huset er et eksempelhus, en illustrasjon. Valgene står også som tekst i oppsummeringen.",
    en: "The house with your choices, shown in the measured 3D model of the field. The house is an example house, an illustration. The choices are also listed as text in the summary.",
  },
  open: { no: "Vis i 3D", en: "Show in 3D" },
  openNote: { no: "Åpner den målte 3D-modellen av feltet med huset ditt. Det krever litt av maskinen.", en: "Opens the measured 3D model of the field with your house. It asks a little of the device." },
  opening: { no: "Åpner modellen ...", en: "Opening the model ..." },
  hint: { no: "Klikk i modellen for å styre den", en: "Click the model to take control" },
  hintTouch: { no: "Trykk i modellen for å styre den", en: "Tap the model to take control" },
  camera: { no: "Kamera", en: "Camera" },
  places: { no: "Gå til", en: "Go to" },
  walkHint: { no: "Dra for å se deg rundt, trykk der du vil gå. Piltastene virker også.", en: "Drag to look around, tap where you want to go. The arrow keys work too." },
  outside: { no: "Ute", en: "Outside" },
  noPlot: { no: "Velg en tomt for å se huset på den", en: "Choose a plot to see the house on it" },
  noCarport: { no: "Det er ikke plass til carport ved huset på denne tomten i modellen.", en: "There is no room for a carport by the house on this plot in the model." },
  failed: { no: "3D-modellen kunne ikke vises her.", en: "The 3D model could not be shown here." },
};

const PRESETS: { id: ConfigurePreset; label: { no: string; en: string } }[] = [
  { id: "garden", label: { no: "Fra hagen", en: "From the garden" } },
  { id: "entrance", label: { no: "Inngangen", en: "The entrance" } },
  { id: "air", label: { no: "Fra lufta", en: "From the air" } },
  { id: "terrace", label: { no: "Terrassen", en: "The terrace" } },
];

/** Places to walk to inside (the house's own frame: u along it, v towards the view, z above the main floor). */
const SPOTS: { id: string; label: { no: string; en: string }; u: number; v: number; z: number; lower?: boolean }[] = [
  { id: "living", label: { no: "Stua", en: "Living room" }, u: 1.0, v: 2.6, z: 0 },
  { id: "kitchen", label: { no: "Kjøkkenet", en: "Kitchen" }, u: -3.9, v: 1.2, z: 0 },
  { id: "hall", label: { no: "Entreen", en: "Hall" }, u: 0.55, v: -2.7, z: 0 },
  { id: "lower", label: { no: "Underetasjen", en: "Lower floor" }, u: 0.4, v: 2.0, z: HOUSE.lower, lower: true },
  { id: "terrace", label: { no: "Terrassen", en: "Terrace" }, u: 1.4, v: HOUSE.hd + 2.0, z: -0.03 },
];

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (change: () => void) => { const mq = window.matchMedia(REDUCED); mq.addEventListener("change", change); return () => mq.removeEventListener("change", change); };
const reducedNow = () => window.matchMedia(REDUCED).matches;
const reducedOnServer = () => false;
const COARSE = "(pointer: coarse)";
const subscribeCoarse = (change: () => void) => { const mq = window.matchMedia(COARSE); mq.addEventListener("change", change); return () => mq.removeEventListener("change", change); };
const coarseNow = () => window.matchMedia(COARSE).matches;

export default function ConfiguratorScene({ config, plots, view, lang, design, className, onReady, onFailed }: ConfiguratorSceneProps) {
  const t = (k: keyof typeof T) => T[k][lang];
  const [armed, setArmed] = useState(false);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [focus, setFocus] = useState(false);
  const [failed, setFailed] = useState(false);
  const [preset, setPreset] = useState<ConfigurePreset>("garden");
  const [fits, setFits] = useState<HouseFit[] | null>(null);
  const [site, setSite] = useState<SiteData | null>(null);
  const [build, setBuild] = useState<CustomBuild | null>(null);
  const root = useRef<HTMLElement>(null);
  const sid = useId();
  const box = useRef<HTMLDivElement>(null);
  const calm = useSyncExternalStore(subscribeReduced, reducedNow, reducedOnServer);
  const coarse = useSyncExternalStore(subscribeCoarse, coarseNow, reducedOnServer);

  // the houses' fit (which plots have a lower floor) and the site (roads, footpath, boundary) for the carport
  useEffect(() => {
    let alive = true;
    loadHouses().then((f) => { if (alive) setFits(plots.map((p) => fitFor(f, p))); });
    loadSite().then((x) => { if (alive) setSite(x); });
    return () => { alive = false; };
  }, [plots]);

  // the configured house: the plot's facts (a lower floor or not) and the choices it allows
  const index = useMemo(() => (config.plot ? plots.findIndex((p) => p.id === config.plot) : -1), [config.plot, plots]);
  const facts = useMemo<PlotFacts | null>(() => (index >= 0 && fits ? { id: plots[index].id, index: plotIndex(plots[index].id), lowerFloor: fits[index].lower } : null), [index, fits, plots]);
  const optionsKey = useMemo(() => JSON.stringify(houseOptions(resolved(config, facts))), [config, facts]);
  const options = useMemo(() => JSON.parse(optionsKey) as ReturnType<typeof houseOptions>, [optionsKey]);
  const plot = index >= 0 ? plots[index] : null;

  // auto-open on capable desktops as the frame scrolls in (as the stage on the front page does); phones, tablets,
  // small screens, data saving and reduced motion get the still and a button; the loop pauses off screen
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const capable = !window.matchMedia(COARSE).matches && !window.matchMedia("(max-width: 640px)").matches && (nav.deviceMemory ?? 8) >= 4 && !nav.connection?.saveData && !window.matchMedia(REDUCED).matches;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        setVisible(e.isIntersecting);
        if (e.isIntersecting && capable) setArmed(true);
        if (!e.isIntersecting) setFocus(false);
      }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // Escape, or a press outside, gives the page its keys and wheel back
  useEffect(() => {
    if (!focus) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setFocus(false); };
    const down = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setFocus(false); };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", down);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("pointerdown", down); };
  }, [focus]);

  const sceneReady = useCallback(() => { setReady(true); onReady?.(); }, [onReady]);
  const sceneFailed = useCallback(() => { setReady(false); setFailed(true); onFailed?.(has3d() ? "load" : "no-webgl"); }, [onFailed]);
  const contextLost = useCallback(() => { setReady(false); setFailed(true); onFailed?.("context-lost"); }, [onFailed]);

  const walking = view === "interior" && !!plot;
  const takeFocus = useTapFocus(() => setFocus(true));
  // on foot: drag to look, a short click or tap to walk there (a finger first taps the model awake)
  const drag = useRef<{ x: number; y: number; t: number; moved: number; id: number } | null>(null);
  const onPointer = (e: React.PointerEvent) => {
    if (!walking) { takeFocus(e); return; }
    if (e.pointerType === "touch" && !focus) { takeFocus(e); return; }
    if (e.type === "pointerdown") {
      setFocus(true);
      drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, id: e.pointerId };
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (e.type === "pointermove") {
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      d.moved += Math.hypot(dx, dy);
      addLook(dx, dy);
      d.x = e.clientX; d.y = e.clientY;
      return;
    }
    if (e.type === "pointerup" && d.moved < 8 && performance.now() - d.t < 450 && box.current) {
      const r = box.current.getBoundingClientRect();
      requestClick(e.clientX - r.left, e.clientY - r.top);
    }
    drag.current = null;
  };

  // where the visitor is inside, named from the house's own plan
  useSyncExternalStore(subscribeWalk, walkVersion, walkVersion);
  const rooms = build?.plan.rooms;
  const where = walking && ready ? (walkState.place.level === "outside" ? t("outside") : rooms?.find((r) => r.id === walkState.place.room)?.name[lang] ?? "") : "";

  const configure = useMemo(() => ({ plot: plot?.id ?? null, options, view, preset, site, onBuild: setBuild }), [plot, options, view, preset, site]);
  const noRoom = !!plot && options.parking !== "space" && build?.index === index && build.carport.status === "no-room";

  return (
    <figure ref={root} className={`${s.root} ${design === "klassisk" ? s.klassisk : s.moderne} ${className ?? ""}`} role="region" aria-label={t("region")} aria-describedby={sid}>
      <p id={sid} className={s.srOnly}>{t("summary")}</p>
      <div ref={box} className={`${s.stage} ${focus ? s.focused : ""} ${walking ? s.walk : ""}`} onPointerDown={onPointer} onPointerMove={onPointer} onPointerUp={onPointer} onPointerLeave={walking ? onPointer : undefined} onPointerCancel={onPointer}>
        {armed && !failed && (
          <KnottenScene
            state="built" wipe={null} month={6} hour={15} plots={plots} selectedPlot={null} preset="site"
            quality="full" paused={!visible} interactive={focus} calm={calm}
            labels={plot ? "off" : "near"} locale={lang}
            onReady={sceneReady} onFailed={sceneFailed} onContextLost={contextLost}
            configure={configure}
          />
        )}
        {/* the still sits over the canvas until the model has drawn, then fades away */}
        {/* eslint-disable-next-line @next/next/no-img-element -- a plain still that fades out over the canvas; next/image adds nothing here */}
        <img src="/renders/web/site_after.webp" srcSet="/renders/web/site_after_960.webp 960w, /renders/web/site_after.webp 1920w" sizes="(max-width: 960px) 100vw, 960px" alt="" className={s.poster} style={{ opacity: ready && !failed ? 0 : 1 }} />

        {!armed && !failed && (
          <div className={s.open}>
            <div className={s.card}>
              <button type="button" className={s.main} onClick={() => { setArmed(true); setFocus(false); }}>{t("open")}</button>
              <p>{t("openNote")}</p>
            </div>
          </div>
        )}
        {armed && !ready && !failed && <div className={s.status} role="status">{t("opening")}</div>}
        {failed && <div className={s.open} role="alert"><div className={s.card}><p>{t("failed")}</p></div></div>}

        {ready && !failed && !focus && <div className={s.hint} aria-hidden>{coarse ? t("hintTouch") : t("hint")}</div>}
        {ready && !failed && !plot && <div className={s.chipNote}>{t("noPlot")}</div>}
        {ready && !failed && where && <div className={s.where} aria-live="polite">{where}</div>}

        {ready && !failed && plot && view === "exterior" && (
          <div className={s.controls} onPointerDown={(e) => e.stopPropagation()}>
            <div className={s.group} role="group" aria-label={t("camera")}>
              {PRESETS.map((p) => (
                <button key={p.id} type="button" className={s.chip} aria-pressed={preset === p.id} onClick={() => setPreset(p.id)}>{p.label[lang]}</button>
              ))}
            </div>
          </div>
        )}
        {ready && !failed && walking && (
          <div className={s.controls} onPointerDown={(e) => e.stopPropagation()}>
            <p className={s.walkHint}>{t("walkHint")}</p>
            <div className={s.group} role="group" aria-label={t("places")}>
              {SPOTS.filter((x) => !x.lower || facts?.lowerFloor).map((x) => (
                <button key={x.id} type="button" className={s.chip} onClick={() => { setFocus(true); requestGoto(x.u, x.v, x.z); }}>{x.label[lang]}</button>
              ))}
            </div>
          </div>
        )}
        {ready && !failed && noRoom && <div className={s.note} role="note">{t("noCarport")}</div>}
      </div>
    </figure>
  );
}

