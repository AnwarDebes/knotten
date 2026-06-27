// Fetch a HIGH-RESOLUTION real elevation grid for the Knotten immersive
// experience, far sharper than the 160x160 showpiece heightmap. Same source and
// site: Kartverket NHM_DTM (1 m national model, CC BY 4.0, commercial use
// allowed), output in EPSG:25832 over the same bbox.
//
// The ArcGIS ImageServer returns large exports as TILED GeoTIFFs (128 px tiles)
// that geotiff.js cannot read via readRasters ("Offset outside bounds"), so we
// let geotiff parse the IFD tags and then assemble the tiles ourselves from the
// raw little-endian float buffer. Striped small exports still go through
// readRasters directly.
//
// Run with: node scripts/experience/fetch-terrain-hi.mjs [size]
//   1024 -> ~2.9 m/cell (default), 1536 -> ~1.9 m, 2048 -> ~1.45 m.

import fs from "node:fs";
import path from "node:path";
import { fromArrayBuffer } from "geotiff";

const SERVICE = "https://hoydedata.no/arcgis/rest/services/NHM_DTM_25832/ImageServer/exportImage";
const BBOX_LL = "7.250,58.034,7.296,58.060"; // lon/lat, EPSG:4326
const SIZE = Math.min(2048, Math.max(256, Number(process.argv[2]) || 1024));
const OUT_DIR = path.join("public", "experience");
const OUT_FILE = path.join(OUT_DIR, "terrain-hi.json");

function exportUrl(f) {
  const p = new URLSearchParams({
    bbox: BBOX_LL,
    bboxSR: "4326",
    imageSR: "25832",
    size: `${SIZE},${SIZE}`,
    format: "tiff",
    pixelType: "F32",
    interpolation: "RSP_BilinearInterpolation",
    f,
  });
  return `${SERVICE}?${p.toString()}`;
}

// Assemble a tiled, uncompressed, little-endian float32 TIFF by hand from the
// IFD tags geotiff already parsed. Robust to omitted nodata tiles and a short
// trailing read.
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
      const cnt = counts[idx];
      if (!off || !cnt) continue; // nodata tile, stays 0 (sea/flat)
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

const clean = (v) => (!Number.isFinite(v) || v < -50 || v > 3000 ? 0 : Math.round(v * 10) / 10);

async function main() {
  console.log(`Requesting ${SIZE}x${SIZE} elevation metadata...`);
  const meta = await (await fetch(exportUrl("json"))).json();
  if (!meta.href) throw new Error("No image href returned");
  const extent = meta.extent;
  console.log(`Extent (m, 25832): ${extent.xmin} ${extent.ymin} ${extent.xmax} ${extent.ymax}`);

  console.log("Downloading GeoTIFF...");
  const buf = await (await fetch(meta.href)).arrayBuffer();
  const tiff = await fromArrayBuffer(buf);
  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();
  const tiled = Boolean(image.fileDirectory.TileWidth);
  console.log(`GeoTIFF ${width}x${height}, ${tiled ? "tiled (manual assembly)" : "striped"}`);

  let raw;
  try {
    if (tiled) throw new Error("use manual path for tiled");
    raw = (await image.readRasters())[0];
  } catch {
    raw = assembleTiled(buf, image);
  }

  const z = new Array(width * height);
  let zMin = Infinity;
  let zMax = -Infinity;
  let nonzero = 0;
  for (let i = 0; i < raw.length; i++) {
    const v = clean(raw[i]);
    z[i] = v;
    if (v !== 0) nonzero++;
    if (v < zMin) zMin = v;
    if (v > zMax) zMax = v;
  }

  const widthM = extent.xmax - extent.xmin;
  const heightM = extent.ymax - extent.ymin;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = {
    source: "Kartverket Hoydedata (NHM_DTM, 1 m national model)",
    license: "CC BY 4.0",
    attribution: "Hoydedata (c) Kartverket",
    location: "Snigsfjorden, Rodberg, Lindesnes",
    crs: "EPSG:25832",
    width,
    height,
    widthMeters: Math.round(widthM),
    heightMeters: Math.round(heightM),
    metresPerCell: Math.round((widthM / width) * 100) / 100,
    zMin,
    zMax,
    z,
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(out));
  console.log(
    `Wrote ${OUT_FILE}: ${width}x${height} (${out.metresPerCell} m/cell), ${out.widthMeters}x${out.heightMeters} m, z ${zMin}..${zMax} m, ${((nonzero / (width * height)) * 100).toFixed(0)}% land, ${(fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(1)} MB`,
  );
}

main().catch((e) => {
  console.error("fetch-terrain-hi failed:", e.message);
  process.exit(1);
});
