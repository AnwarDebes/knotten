export type Heightmap = {
  source: string;
  license: string;
  attribution: string;
  location: string;
  crs: string;
  width: number;
  height: number;
  widthMeters: number;
  heightMeters: number;
  zMin: number;
  zMax: number;
  z: number[];
};

export type SunSeason = "summer" | "winter";
export type SunTime = "morning" | "midday" | "evening";

/** Scene scale: metres to scene units. Elevation uses the same scale (no exaggeration). */
export const TERRAIN_SCALE = 1 / 30;

/** Sample the heightmap at normalised coordinates (u east, v south). */
export function elevationAt(h: Heightmap, u: number, v: number): number {
  const c = Math.min(h.width - 1, Math.max(0, Math.round(u * (h.width - 1))));
  const r = Math.min(h.height - 1, Math.max(0, Math.round(v * (h.height - 1))));
  return h.z[r * h.width + c] ?? 0;
}

/** Direction (grid bearing, radians) from a point toward the nearest sea cell. */
export function bearingToSea(h: Heightmap, u: number, v: number): number {
  const c0 = Math.round(u * (h.width - 1));
  const r0 = Math.round(v * (h.height - 1));
  let best = Infinity;
  let bc = c0;
  let br = r0;
  for (let r = 0; r < h.height; r++) {
    for (let c = 0; c < h.width; c++) {
      if ((h.z[r * h.width + c] ?? 99) < 1) {
        const d = (c - c0) ** 2 + (r - r0) ** 2;
        if (d < best) {
          best = d;
          bc = c;
          br = r;
        }
      }
    }
  }
  return Math.atan2(br - r0, bc - c0);
}
