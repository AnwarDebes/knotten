// @vitest-environment node
import { describe, expect, it } from "vitest";
import realHeightmap from "../../public/terrain/heightmap.json";
import {
  isSunOccluded,
  directSunHours,
  representativeDay,
  daypartStates,
  sunPositionAt,
} from "./sun-terrain";
import type { Heightmap } from "@/components/terrain/types";

function flat(size = 21, meters = 2000): Heightmap {
  return {
    source: "test",
    license: "test",
    attribution: "test",
    location: "test",
    crs: "test",
    width: size,
    height: size,
    widthMeters: meters,
    heightMeters: meters,
    zMin: 0,
    zMax: 0,
    z: new Array(size * size).fill(0),
  };
}

const real = realHeightmap as Heightmap;

describe("terrain occlusion", () => {
  it("flat terrain never occludes a sun above the horizon", () => {
    const h = flat();
    expect(isSunOccluded(h, 0.5, 0.5, 0, 0.5)).toBe(false);
  });

  it("treats a sun below the horizon as occluded", () => {
    expect(isSunOccluded(flat(), 0.5, 0.5, 0, -0.1)).toBe(true);
  });

  it("a tall wall toward the sun blocks a low sun but not a high one", () => {
    const h = flat();
    // Build a high wall a few cells south (azimuth 0 steps toward +row).
    for (let c = 0; c < h.width; c++) {
      h.z[(10 + 3) * h.width + c] = 1000;
      h.z[(10 + 4) * h.width + c] = 1000;
    }
    const center = 10 / (h.width - 1);
    expect(isSunOccluded(h, center, center, 0, 0.1)).toBe(true); // low sun blocked
    expect(isSunOccluded(h, center, center, 0, 1.4)).toBe(false); // steep sun clears it
  });
});

describe("direct-sun hours on the real terrain", () => {
  it("estimates more sun in summer than in winter", () => {
    const summer = directSunHours(real, 0.5, 0.5, representativeDay("summer"));
    const winter = directSunHours(real, 0.5, 0.5, representativeDay("winter"));
    expect(summer).toBeGreaterThan(winter);
    expect(winter).toBeGreaterThanOrEqual(0);
    expect(summer).toBeLessThanOrEqual(24);
  });

  it("returns a daypart state for morning, midday and evening", () => {
    const states = daypartStates(real, 0.5, 0.5, "summer");
    expect(states.map((s) => s.label)).toEqual(["morning", "midday", "evening"]);
    expect(typeof states[0]!.sunlit).toBe("boolean");
  });
});

describe("sun position", () => {
  it("the midsummer midday sun is higher than the midwinter midday sun", () => {
    const summer = sunPositionAt(new Date(Date.UTC(2026, 5, 21, 11)));
    const winter = sunPositionAt(new Date(Date.UTC(2026, 11, 21, 11)));
    expect(summer.altitude).toBeGreaterThan(winter.altitude);
  });
});
