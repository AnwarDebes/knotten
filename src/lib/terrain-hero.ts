import fs from "node:fs";
import path from "node:path";
import type { Heightmap } from "@/components/terrain/types";

/**
 * Derives the home hero's terrain artwork from the real Kartverket elevation
 * grid (public/terrain/heightmap.json), the same data the 3D map on the area
 * page is built from. Each ridgeline is a true cross-section of the site,
 * arranged from the high ground at the back down to the sea-level datum at the
 * front, so the hero shows the actual landform rather than a stock photo.
 *
 * Runs on the server only and the result is pure, so it is computed once at
 * build time (the home route is static) and memoised. The output is a handful
 * of small SVG path strings: a few kilobytes of inline markup, no client
 * JavaScript, no image request on the LCP path.
 */
export type TerrainHero = {
  viewBox: string;
  width: number;
  height: number;
  datumY: number;
  peak: number;
  ridges: { area: string; crest: string; depth: number }[];
};

let cached: TerrainHero | null = null;

export function getTerrainHero(): TerrainHero {
  if (cached) return cached;

  const file = path.join(process.cwd(), "public", "terrain", "heightmap.json");
  const h = JSON.parse(fs.readFileSync(file, "utf8")) as Heightmap;

  const VB_W = 1000;
  const VB_H = 560;
  const LINES = 18;
  const SAMPLES = 48;
  const topMargin = 104;
  const datumY = 516;
  const span = datumY - topMargin;
  const range = h.zMax - Math.max(0, h.zMin);

  // Sample evenly spaced rows of the grid; each becomes one transect.
  const rows: { mean: number; z: number[] }[] = [];
  for (let i = 0; i < LINES; i++) {
    const r = Math.round((i / (LINES - 1)) * (h.height - 1));
    const z: number[] = [];
    let sum = 0;
    for (let s = 0; s < SAMPLES; s++) {
      const c = Math.round((s / (SAMPLES - 1)) * (h.width - 1));
      const v = h.z[r * h.width + c] ?? 0;
      z.push(v);
      sum += v;
    }
    rows.push({ mean: sum / SAMPLES, z });
  }
  // High ground to the back, the sea to the front.
  rows.sort((a, b) => b.mean - a.mean);

  const ridges = rows.map((row, i) => {
    const depth = i / (LINES - 1); // 0 back, 1 front
    const baseY = topMargin + depth * span;
    const amp = 96 * (0.55 + 0.7 * depth); // nearer ridges read a little taller
    let crest = "";
    for (let s = 0; s < SAMPLES; s++) {
      const x = (s / (SAMPLES - 1)) * VB_W;
      const zn = Math.max(0, (row.z[s] ?? 0) / range);
      const y = baseY - zn * amp;
      crest += `${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
    }
    const area = `${crest}L${VB_W} ${VB_H} L0 ${VB_H} Z`;
    return { area, crest: crest.trim(), depth };
  });

  cached = {
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    width: VB_W,
    height: VB_H,
    datumY,
    peak: Math.round(h.zMax),
    ridges,
  };
  return cached;
}

/**
 * A single clean cross-section through the highest point of the site, sea level
 * to summit. Used as a small honest "section drawing" in the place section.
 */
export type TerrainProfile = {
  viewBox: string;
  width: number;
  height: number;
  baseY: number;
  peak: number;
  peakX: number;
  path: string;
  area: string;
};

let cachedProfile: TerrainProfile | null = null;

export function getTerrainProfile(): TerrainProfile {
  if (cachedProfile) return cachedProfile;

  const file = path.join(process.cwd(), "public", "terrain", "heightmap.json");
  const h = JSON.parse(fs.readFileSync(file, "utf8")) as Heightmap;

  let peakIdx = 0;
  for (let i = 1; i < h.z.length; i++) {
    if ((h.z[i] ?? 0) > (h.z[peakIdx] ?? 0)) peakIdx = i;
  }
  const peakRow = Math.floor(peakIdx / h.width);

  const VB_W = 1000;
  const VB_H = 260;
  const baseY = 232;
  const amp = 196;
  const SAMPLES = 84;

  const raw: number[] = [];
  for (let s = 0; s < SAMPLES; s++) {
    const c = Math.round((s / (SAMPLES - 1)) * (h.width - 1));
    raw.push(h.z[peakRow * h.width + c] ?? 0);
  }
  // Light smoothing so the section reads as a clean ridgeline, not noise.
  const sm = raw.map((_, i) => {
    let sum = 0;
    let n = 0;
    for (let k = -2; k <= 2; k++) {
      const j = i + k;
      if (j >= 0 && j < raw.length) {
        sum += raw[j] ?? 0;
        n++;
      }
    }
    return sum / n;
  });

  let peakX = 0;
  let peakVal = -Infinity;
  let pathStr = "";
  for (let s = 0; s < SAMPLES; s++) {
    const x = (s / (SAMPLES - 1)) * VB_W;
    const v = sm[s] ?? 0;
    const y = baseY - (v / h.zMax) * amp;
    if (v > peakVal) {
      peakVal = v;
      peakX = x;
    }
    pathStr += `${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  const area = `${pathStr}L${VB_W} ${VB_H} L0 ${VB_H} Z`;

  cachedProfile = {
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    width: VB_W,
    height: VB_H,
    baseY,
    peak: Math.round(h.zMax),
    peakX: Math.round(peakX),
    path: pathStr.trim(),
    area,
  };
  return cachedProfile;
}
