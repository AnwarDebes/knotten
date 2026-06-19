import { describe, expect, it } from "vitest";
import { computeEnergy, type EnergyInput } from "./energy";

const base: EnergyInput = {
  areaM2: 140,
  orientation: "soer",
  household: "medium",
  ev: false,
  battery: false,
};

describe("computeEnergy", () => {
  it("produces sensible indicative figures for a typical home", () => {
    const r = computeEnergy(base);
    // 140 m2 * 5 + 6000 household = 6700, rounded to 100.
    expect(r.annualDemandKwh).toBe(6700);
    expect(r.pvKwp).toBeGreaterThanOrEqual(3);
    expect(r.pvKwp).toBeLessThanOrEqual(12);
    expect(r.annualProductionKwh).toBeGreaterThan(0);
    expect(r.selfSufficiency).toBeGreaterThan(0);
    expect(r.selfSufficiency).toBeLessThanOrEqual(1);
  });

  it("adds the EV load to demand", () => {
    expect(computeEnergy({ ...base, ev: true }).annualDemandKwh).toBe(
      computeEnergy(base).annualDemandKwh + 3000,
    );
  });

  it("a battery raises self-sufficiency and gives outage hours", () => {
    const without = computeEnergy(base);
    const withBattery = computeEnergy({ ...base, battery: true });
    expect(withBattery.selfSufficiency).toBeGreaterThan(without.selfSufficiency);
    expect(without.resilienceHours).toBe(0);
    expect(withBattery.resilienceHours).toBeGreaterThan(0);
  });

  it("south orientation produces more than east/west or north", () => {
    const south = computeEnergy({ ...base, orientation: "soer" }).annualProductionKwh;
    const eastWest = computeEnergy({ ...base, orientation: "oestVest" }).annualProductionKwh;
    const north = computeEnergy({ ...base, orientation: "nord" }).annualProductionKwh;
    expect(south).toBeGreaterThan(eastWest);
    expect(eastWest).toBeGreaterThan(north);
  });

  it("never reports self-consumption above demand", () => {
    const r = computeEnergy({ ...base, areaM2: 250, battery: true });
    expect(r.selfConsumedKwh).toBeLessThanOrEqual(r.annualDemandKwh);
  });
});
