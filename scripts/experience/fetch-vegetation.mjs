// Derive REAL tree positions for the Knotten experience from Kartverket open
// data: the canopy height model CHM = DOM - DTM (surface model minus bare-earth
// terrain). Where the canopy rises above ~2.5 m we have real vegetation, so we
// seed instanced trees there, with each tree's height taken from the real CHM.
//
// Source: Kartverket NHM_DOM (surface) and NHM_DTM (terrain), 1 m national
// models, CC BY 4.0, commercial use allowed. Run after fetch-terrain-hi.mjs.
//
// Run with: node scripts/experience/fetch-vegetation.mjs

import fs from "node:fs";
import path from "node:path";
import { fromArrayBuffer } from "geotiff";

const DOM = "https://hoydedata.no/arcgis/rest/services/NHM_DOM_25832/ImageServer/exportImage";
const BBOX_LL = "7.250,58.034,7.296,58.060";
const OUT_DIR = path.join("public", "experience");
const DTM_FILE = path.join(OUT_DIR, "terrain-hi.json");
const OUT_FILE = path.join(OUT_DIR, "trees.json");

const CANOPY_MIN = 2.5; // m above ground to count as a tree
const STRIDE = 4; // sample every 4 cells (~11 m) to seed a tree candidate
const MAX_TREES = 16000;

function exportUrl(size, f) {
  const p = new URLSearchParams({
    bbox: BBOX_LL,
    bboxSR: "4326",
    imageSR: "25832",
    size: `${size},${size}`,
    format: "tiff",
    pixelType: "F32",
    interpolation: "RSP_BilinearInterpolation",
    f,
  });
  return `${DOM}?${p.toString()}`;
}

function assembleTiled(buf, image) {
  const fd = image.fileDirectory;
  const W = image.getWidth();
  const H = image.getHeight();
  const tw = fd.TileWidth;
  const tl = fd.TileLength;
  const offsets = fd.TileOffsets;
  const counts = fd.TileByteCounts;
  const dv = new DataView(buf);
  const out = new Float32Array(W * H);
  const across = Math.ceil(W / tw);
  const down = Math.ceil(H / tl);
  for (let ty = 0; ty < down; ty++) {
    for (let tx = 0; tx < across; tx++) {
      const idx = ty * across + tx;
      const off = offsets[idx];
      if (!off || !counts[idx]) continue;
      for (let ly = 0; ly < tl; ly++) {
        const gy = ty * tl + ly;
        if (gy >= H) break;
        for (let lx = 0; lx < tw; lx++) {
          const gx = tx * tw + lx;
          if (gx >= W) continue;
          const p = off + (ly * tw + lx) * 4;
          if (p + 4 > buf.byteLength) continue;
          out[gy * W + gx] = dv.getFloat32(p, true);
        }
      }
    }
  }
  return out;
}

// Deterministic pseudo-random so the forest is stable across builds.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

async function main() {
  const dtm = JSON.parse(fs.readFileSync(DTM_FILE, "utf8"));
  const W = dtm.width;
  const H = dtm.height;
  const widthM = dtm.widthMeters;
  const heightM = dtm.heightMeters;

  console.log(`Fetching DOM at ${W}x${H} to match the DTM...`);
  const meta = await (await fetch(exportUrl(W, "json"))).json();
  if (!meta.href) throw new Error("no DOM href");
  const buf = await (await fetch(meta.href)).arrayBuffer();
  const image = await (await fromArrayBuffer(buf)).getImage();
  if (image.getWidth() !== W || image.getHeight() !== H) {
    throw new Error(`DOM ${image.getWidth()}x${image.getHeight()} != DTM ${W}x${H}`);
  }
  let dom;
  try {
    if (image.fileDirectory.TileWidth) throw new Error("tiled");
    dom = (await image.readRasters())[0];
  } catch {
    dom = assembleTiled(buf, image);
  }

  const rand = rng(20260627);
  const trees = [];
  for (let r = 0; r < H; r += STRIDE) {
    for (let c = 0; c < W; c += STRIDE) {
      const i = r * W + c;
      const ground = dtm.z[i] ?? 0;
      const surf = dom[i];
      if (!Number.isFinite(surf)) continue;
      const chm = surf - ground;
      if (chm < CANOPY_MIN || chm > 40) continue; // not canopy (or a spike)
      if (ground < 1) continue; // skip water
      if (rand() > 0.7) continue; // thin out for performance and variation
      const u = c / (W - 1);
      const v = r / (H - 1);
      const jx = (rand() - 0.5) * STRIDE * (widthM / W);
      const jz = (rand() - 0.5) * STRIDE * (heightM / H);
      const x = (u - 0.5) * widthM + jx;
      const z = (v - 0.5) * heightM + jz;
      const h = Math.max(3, Math.min(28, chm));
      const kind = rand() < 0.72 ? 0 : 1; // 0 conifer (furu/gran), 1 deciduous (bjork/eik)
      trees.push([
        Math.round(x * 10) / 10,
        Math.round(ground * 10) / 10,
        Math.round(z * 10) / 10,
        Math.round(h * 10) / 10,
        kind,
      ]);
    }
  }

  // Cap the count (keep a random, even subset).
  let kept = trees;
  if (trees.length > MAX_TREES) {
    const keep = MAX_TREES / trees.length;
    kept = trees.filter(() => rand() < keep);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = {
    source: "Kartverket NHM_DOM minus NHM_DTM canopy height (CC BY 4.0)",
    attribution: "Hoydedata (c) Kartverket",
    note: "Tree positions and heights derived from the real canopy height model.",
    count: kept.length,
    format: "[x, groundY, z, height, kind] in metres, kind 0=conifer 1=deciduous",
    trees: kept,
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(out));
  console.log(
    `Wrote ${OUT_FILE}: ${kept.length} trees (from ${trees.length} candidates), ${(fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(1)} MB`,
  );
}

main().catch((e) => {
  console.error("fetch-vegetation failed:", e.message);
  process.exit(1);
});
