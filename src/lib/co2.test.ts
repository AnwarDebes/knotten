// @vitest-environment node
import { describe, expect, it } from "vitest";
import { computeCo2, CO2_FACTORS, REFERENCE_ANNUAL_KWH } from "./co2";
import { computeEnergy } from "./energy";

describe("computeCo2", () => {
  it("an energy-smart home avoids emissions versus the reference", () => {
    const e = computeEnergy({
      areaM2: 150,
      orientation: "soer",
      household: "medium",
      ev: false,
      battery: true,
    });
    const r = computeCo2({
      smartDemandKwh: e.annualDemandKwh,
      smartSelfSufficiency: e.selfSufficiency,
    });
    expect(r.savedTonnes).toBeGreaterThan(0);
    expect(r.smartTonnes).toBeLessThan(r.referenceTonnes);
  });

  it("scales linearly with the grid factor", () => {
    const low = computeCo2({ smartDemandKwh: 10000, smartSelfSufficiency: 0.4, factor: 0.1 });
    const high = computeCo2({ smartDemandKwh: 10000, smartSelfSufficiency: 0.4, factor: 0.2 });
    expect(high.savedTonnes).toBeCloseTo(low.savedTonnes * 2, 4);
  });

  it("reports a sensitivity range across the factor span", () => {
    const r = computeCo2({ smartDemandKwh: 10000, smartSelfSufficiency: 0.4 });
    expect(r.savedLow).toBeLessThan(r.savedHigh);
    // Low end uses the Norwegian production factor, high end the European residual.
    const savedKwh = r.referenceGridKwh - r.smartGridKwh;
    expect(r.savedLow).toBeCloseTo((savedKwh * CO2_FACTORS.norwayProduction) / 1000, 2);
  });

  it("uses the SSB reference baseline by default", () => {
    const r = computeCo2({ smartDemandKwh: 9000, smartSelfSufficiency: 0.5 });
    expect(r.referenceGridKwh).toBe(REFERENCE_ANNUAL_KWH);
  });

  it("full self-sufficiency drives the smart home's grid emissions to near zero", () => {
    const r = computeCo2({ smartDemandKwh: 9000, smartSelfSufficiency: 1 });
    expect(r.smartGridKwh).toBe(0);
    expect(r.smartTonnes).toBe(0);
  });
});
