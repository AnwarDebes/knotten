// Fetch real Kartverket elevation for the Knotten site (Snigsfjorden, Rødberg,
// Lindesnes) and write a heightmap the 3D terrain showpiece consumes.
//
// Source: Kartverket Hoydedata, NHM_DTM (national detailed terrain model),
// CC BY 4.0, commercial use allowed. See docs/research/terreng-og-geodata.md.
//
// Run with: node scripts/fetch-terrain.mjs

import fs from "node:fs";
import path from "node:path";
import { fromArrayBuffer } from "geotiff";

const SERVICE = "https://hoydedata.no/arcgis/rest/services/NHM_DTM_25832/ImageServer/exportImage";
// Bounding box around Snigsfjorden / the Audna outlet (lon/lat, EPSG:4326).
const BBOX = "7.250,58.034,7.296,58.060";
const SIZE = 160;
const OUT_DIR = path.join("public", "terrain");

function exportUrl(format, f) {
  const p = new URLSearchParams({
    bbox: BBOX,
    bboxSR: "4326",
    imageSR: "25832",
    size: `${SIZE},${SIZE}`,
    format,
    pixelType: "F32",
    interpolation: "RSP_BilinearInterpolation",
    f,
  });
  return `${SERVICE}?${p.toString()}`;
}

async function main() {
  console.log("Requesting elevation metadata...");
  const meta = await (await fetch(exportUrl("tiff", "json"))).json();
  const extent = meta.extent;
  const href = meta.href;
  if (!href) throw new Error("No image href returned");
  console.log(
    `Extent (m, EPSG:25832): ${extent.xmin} ${extent.ymin} ${extent.xmax} ${extent.ymax}`,
  );

  console.log("Downloading GeoTIFF...");
  const buf = await (await fetch(href)).arrayBuffer();
  const tiff = await fromArrayBuffer(buf);
  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();
  const rasters = await image.readRasters();
  const raw = rasters[0];

  // Clean nodata (water and out-of-coverage are reported as large negatives or
  // ArcGIS nodata); clamp to sea level so the fjord reads as flat water.
  const z = new Array(width * height);
  let zMin = Infinity;
  let zMax = -Infinity;
  for (let i = 0; i < raw.length; i++) {
    let v = raw[i];
    if (!Number.isFinite(v) || v < -50 || v > 3000) v = 0;
    v = Math.round(v * 10) / 10;
    z[i] = v;
    if (v < zMin) zMin = v;
    if (v > zMax) zMax = v;
  }

  const widthM = extent.xmax - extent.xmin;
  const heightM = extent.ymax - extent.ymin;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = {
    source: "Kartverket Hoydedata (NHM_DTM)",
    license: "CC BY 4.0",
    attribution: "Hoydedata (c) Kartverket",
    location: "Snigsfjorden, Rødberg, Lindesnes",
    crs: "EPSG:25832",
    width,
    height,
    widthMeters: Math.round(widthM),
    heightMeters: Math.round(heightM),
    zMin,
    zMax,
    z,
  };
  const file = path.join(OUT_DIR, "heightmap.json");
  fs.writeFileSync(file, JSON.stringify(out));
  console.log(
    `Wrote ${file}: ${width}x${height}, ${Math.round(widthM)}x${Math.round(heightM)} m, z ${zMin}..${zMax} m (${(
      fs.statSync(file).size / 1024
    ).toFixed(0)} KB)`,
  );
}

main().catch((e) => {
  console.error("fetch-terrain failed:", e.message);
  process.exit(1);
});
