// @vitest-environment node
import { describe, expect, it } from "vitest";
import { AMENITIES, SITE } from "./amenities";

describe("amenities data", () => {
  it("has unique ids", () => {
    const ids = AMENITIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("places every amenity within a sane bounding box around the site", () => {
    for (const a of AMENITIES) {
      expect(a.lat).toBeGreaterThan(57);
      expect(a.lat).toBeLessThan(59);
      expect(a.lng).toBeGreaterThan(6);
      expect(a.lng).toBeLessThan(9);
    }
    expect(SITE.lat).toBeCloseTo(58.047, 2);
  });

  it("carries a source and verification month on every amenity", () => {
    for (const a of AMENITIES) {
      expect(a.source.length).toBeGreaterThan(0);
      expect(a.verified).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it("has distance and drive time either both set or both absent", () => {
    for (const a of AMENITIES) {
      expect(a.distanceKm === null).toBe(a.driveMin === null);
    }
  });

  it("marks at least one item as to-be-confirmed (bekreftes)", () => {
    expect(AMENITIES.some((a) => !a.confirmed)).toBe(true);
  });
});
