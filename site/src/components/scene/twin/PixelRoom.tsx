"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/** GPU time a frame may take at the finer pixel ratio: two thirds of a 60 Hz frame, room for heavier views than the first. */
const BUDGET_MS = 11;
/** Frames left out at the start (programs still settling, the shadow map drawn), then frames measured. */
const SKIP = 40, SAMPLES = 40;

type Ext = { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number };

/**
 * Whether this screen's GPU has room for a finer picture. The first frames after the model is in are timed on the
 * GPU (timer queries, where the browser offers them) at the pixel ratio in use; `onRoom` is called once when the same
 * frame at `ratio` (more pixels) would still take under two thirds of a 60 Hz frame. It only ever raises the
 * picture, and without timer queries it says nothing (the picture stays as it is).
 */
export function PixelRoom({ ratio, onRoom, warm }: { ratio: number; onRoom: () => void; warm: React.RefObject<boolean> }) {
  const { gl } = useThree();
  const st = useRef({ ext: null as Ext | null, open: null as WebGLQuery | null, waiting: [] as WebGLQuery[], times: [] as number[], seen: 0, done: false });
  useEffect(() => {
    const s = st.current;
    const ctx = gl.getContext() as WebGL2RenderingContext;
    s.ext = ctx.getExtension("EXT_disjoint_timer_query_webgl2") as Ext | null;
    if (!s.ext) s.done = true;
    return () => { s.waiting.forEach((q) => ctx.deleteQuery(q)); s.waiting = []; s.done = true; };
  }, [gl]);
  // around the frame (the scene is drawn at priority 1)
  useFrame(() => {
    const s = st.current;
    if (s.done || !s.ext || !warm.current || s.open) return;
    if (++s.seen <= SKIP) return;
    const ctx = gl.getContext() as WebGL2RenderingContext;
    s.open = ctx.createQuery();
    if (s.open) ctx.beginQuery(s.ext.TIME_ELAPSED_EXT, s.open);
  }, 0.99);
  useFrame(() => {
    const s = st.current;
    if (!s.ext) return;
    const ctx = gl.getContext() as WebGL2RenderingContext;
    if (s.open) { ctx.endQuery(s.ext.TIME_ELAPSED_EXT); s.waiting.push(s.open); s.open = null; }
    // results come a frame or two later
    while (s.waiting.length && ctx.getQueryParameter(s.waiting[0], ctx.QUERY_RESULT_AVAILABLE)) {
      const q = s.waiting.shift()!;
      if (!ctx.getParameter(s.ext.GPU_DISJOINT_EXT)) s.times.push(ctx.getQueryParameter(q, ctx.QUERY_RESULT) / 1e6);
      ctx.deleteQuery(q);
    }
    if (s.done || s.times.length < SAMPLES) return;
    s.done = true;
    const sorted = [...s.times].sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    // the frame's GPU time grows with the number of pixels
    const scale = (ratio / gl.getPixelRatio()) ** 2;
    if (median * scale < BUDGET_MS) onRoom();
  }, 1.01);
  return null;
}
