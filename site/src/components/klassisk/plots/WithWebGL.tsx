"use client";
import { useSyncExternalStore } from "react";

let known: boolean | undefined;
/**
 * Whether this browser can draw the model: WebGL 2, the same test as the stage's own (components/scene/has3d.ts).
 * Asked once per page load; the test context is handed back at once, so it never counts against the browser's limit.
 */
function canDraw(): boolean {
  if (known === undefined) {
    try {
      const gl = document.createElement("canvas").getContext("webgl2");
      known = !!gl;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      known = false;
    }
  }
  return known;
}
const never = () => () => {};

/**
 * Shows the 3D model where the browser can draw it, and `fallback` where it cannot (WebGL 2 switched off, or missing
 * with an old graphics driver), so such a visitor sees a picture of the same thing instead of an error. The server and
 * the first paint assume the model works, as nearly every browser does.
 */
export default function WithWebGL({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const ok = useSyncExternalStore(never, canDraw, () => true);
  return <>{ok ? children : fallback}</>;
}
