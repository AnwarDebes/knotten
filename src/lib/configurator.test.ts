// @vitest-environment node
import { describe, expect, it } from "vitest";
import { computeEnergy, computeEnergyConfig } from "./energy";
import { annualEnergyCost } from "./monthly-cost";
import { HOUSE_TYPES } from "@/content/house-types";

describe("computeEnergyConfig", () => {
  it("matches computeEnergy when given the same auto-sized solar", () => {
    const base = computeEnergy({
      areaM2: 150,
      orientation: "soer",
      household: "medium",
      ev: false,
      battery: true,
    });
    const cfg = computeEnergyConfig({
      areaM2: 150,
      orientation: "soer",
      household: "medium",
      ev: false,
      pvKwp: base.pvKwp,
      batteryKwh: 10,
    });
    expect(cfg.annualDemandKwh).toBe(base.annualDemandKwh);
    expect(cfg.annualProductionKwh).toBe(base.annualProductionKwh);
    expect(cfg.selfSufficiency).toBeCloseTo(base.selfSufficiency, 6);
  });

  it("more solar lifts self-sufficiency", () => {
    const small = computeEnergyConfig({
      areaM2: 150,
      orientation: "soer",
      household: "medium",
      ev: false,
      pvKwp: 4,
      batteryKwh: 10,
    });
    const big = computeEnergyConfig({
      areaM2: 150,
      orientation: "soer",
      household: "medium",
      ev: false,
      pvKwp: 10,
      batteryKwh: 10,
    });
    expect(big.selfSufficiency).toBeGreaterThan(small.selfSufficiency);
  });

  it("a battery enables backup hours; none means zero", () => {
    const withB = computeEnergyConfig({
      areaM2: 150,
      orientation: "soer",
      household: "medium",
      ev: false,
      pvKwp: 7,
      batteryKwh: 10,
    });
    const noB = computeEnergyConfig({
      areaM2: 150,
      orientation: "soer",
      household: "medium",
      ev: false,
      pvKwp: 7,
      batteryKwh: 0,
    });
    expect(withB.resilienceHours).toBeGreaterThan(0);
    expect(noB.resilienceHours).toBe(0);
  });

  it("feeds a positive annual energy cost for the remaining grid draw", () => {
    const r = computeEnergyConfig({
      areaM2: 150,
      orientation: "soer",
      household: "medium",
      ev: true,
      pvKwp: 7,
      batteryKwh: 10,
    });
    const cost = annualEnergyCost(r.annualDemandKwh, r.selfSufficiency);
    expect(cost).toBeGreaterThan(0);
  });
});

describe("house types", () => {
  it("have unique ids and valid solar/battery ranges", () => {
    const ids = HOUSE_TYPES.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const h of HOUSE_TYPES) {
      expect(h.solar.min).toBeLessThanOrEqual(h.solar.default);
      expect(h.solar.default).toBeLessThanOrEqual(h.solar.max);
      expect(h.battery.min).toBeLessThanOrEqual(h.battery.default);
      expect(h.battery.default).toBeLessThanOrEqual(h.battery.max);
      expect(h.heatedAreaM2).toBeGreaterThan(0);
    }
  });
});
