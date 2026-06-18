import { describe, expect, it } from "vitest";
import { elevationAt, bearingToSea, type Heightmap } from "./types";
import { sunDirection, sunAltitudeDeg } from "./sun";
import { PLOTS } from "@/content/plots";

// A tiny 3x3 heightmap: a hill in the north-west, sea (0) in the south-east.
const mock: Heightmap = {
  source: "test",
  license: "test",
  attribution: "test",
  location: "test",
  crs: "EPSG:25832",
  width: 3,
  height: 3,
  widthMeters: 300,
  heightMeters: 300,
  zMin: 0,
  zMax: 100,
  z: [100, 80, 40, 80, 40, 10, 40, 10, 0],
};

describe("elevationAt", () => {
  it("samples the nearest cell", () => {
    expect(elevationAt(mock, 0, 0)).toBe(100);
    expect(elevationAt(mock, 1, 1)).toBe(0);
    expect(elevationAt(mock, 0, 1)).toBe(40);
  });
});

describe("bearingToSea", () => {
  it("points toward the sea cell (south-east of the hilltop)", () => {
    const b = bearingToSea(mock, 0, 0);
    expect(Math.cos(b)).toBeGreaterThan(0); // eastward
    expect(Math.sin(b)).toBeGreaterThan(0); // southward
  });
});

describe("sun", () => {
  it("returns a normalised direction", () => {
    const d = sunDirection("summer", "midday");
    expect(Math.hypot(d.x, d.y, d.z)).toBeCloseTo(1, 5);
    expect(d.y).toBeGreaterThan(0); // above the horizon at midday
  });

  it("has a higher midday sun in summer than in winter", () => {
    expect(sunAltitudeDeg("summer", "midday")).toBeGreaterThan(sunAltitudeDeg("winter", "midday"));
  });
});

describe("PLOTS", () => {
  it("are illustrative placeholders with valid coordinates and status", () => {
    const valid = new Set(["ledig", "reservert", "solgt"]);
    expect(PLOTS.length).toBeGreaterThan(0);
    for (const p of PLOTS) {
      expect(p.u).toBeGreaterThanOrEqual(0);
      expect(p.u).toBeLessThanOrEqual(1);
      expect(p.v).toBeGreaterThanOrEqual(0);
      expect(p.v).toBeLessThanOrEqual(1);
      expect(valid.has(p.status)).toBe(true);
    }
  });
});
