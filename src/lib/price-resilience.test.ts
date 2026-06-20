// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  energyPriceInclVat,
  consumerPricePerKwh,
  computeExposure,
  bestScheme,
  PRICE_ASSUMPTIONS,
  type HomeProfile,
} from "./price-resilience";

describe("scheme pricing", () => {
  it("adds only VAT below the strømstøtte threshold", () => {
    const spot = 0.5; // below 0.77 ex VAT
    expect(energyPriceInclVat(spot, "stromstotte")).toBeCloseTo(spot * 1.25, 6);
  });

  it("applies 90% support above the threshold", () => {
    const spot = 3.0;
    const stotte = 0.9 * (spot - 0.77);
    expect(energyPriceInclVat(spot, "stromstotte")).toBeCloseTo((spot - stotte) * 1.25, 6);
  });

  it("uses the fixed Norgespris regardless of spot", () => {
    expect(energyPriceInclVat(10, "norgespris")).toBe(PRICE_ASSUMPTIONS.norgesprisInclVat);
    expect(energyPriceInclVat(0.1, "norgespris")).toBe(PRICE_ASSUMPTIONS.norgesprisInclVat);
  });

  it("adds the grid tariff to the consumer price", () => {
    expect(consumerPricePerKwh(0.5, "stromstotte")).toBeCloseTo(
      0.5 * 1.25 + PRICE_ASSUMPTIONS.gridTariffInclVat,
      6,
    );
  });

  it("Norgespris beats the spot regime in an expensive period", () => {
    expect(energyPriceInclVat(5, "norgespris")).toBeLessThan(energyPriceInclVat(5, "stromstotte"));
  });
});

describe("exposure model", () => {
  // A volatile two-day period: cheap nights, expensive evenings.
  const prices = Array.from({ length: 48 }, (_, h) => {
    const hour = h % 24;
    return hour >= 17 && hour <= 20 ? 4.0 : hour >= 1 && hour <= 5 ? 0.1 : 0.8;
  });

  const home = (over: Partial<HomeProfile> = {}): HomeProfile => ({
    periodDemandKwh: 480,
    selfCoverShare: 0,
    batteryKwh: 0,
    ...over,
  });

  it("removes self-covered demand from grid draw entirely", () => {
    const r = computeExposure(prices, home({ selfCoverShare: 0.5 }));
    expect(r.selfCoveredKwh).toBe(240);
    expect(r.gridDrawKwh).toBe(240);
    expect(r.selfCoveredShare).toBe(0.5);
  });

  it("a fully self-covered home has zero grid cost", () => {
    const r = computeExposure(prices, home({ selfCoverShare: 1 }));
    expect(r.gridDrawKwh).toBe(0);
    expect(r.cost.stromstotte).toBe(0);
    expect(r.cost.norgespris).toBe(0);
  });

  it("a battery lowers the spot-regime cost by shifting load", () => {
    const noBattery = computeExposure(prices, home());
    const withBattery = computeExposure(prices, home({ batteryKwh: 10 }));
    expect(withBattery.cost.stromstotte).toBeLessThan(noBattery.cost.stromstotte);
  });

  it("an energy-smart home is less exposed than a grid-dependent one", () => {
    const gridDependent = computeExposure(prices, home({ periodDemandKwh: 800 }));
    const smart = computeExposure(
      prices,
      home({ periodDemandKwh: 400, selfCoverShare: 0.4, batteryKwh: 10 }),
    );
    expect(smart.cost.stromstotte).toBeLessThan(gridDependent.cost.stromstotte);
    expect(smart.spikeCost.stromstotte).toBeLessThan(gridDependent.spikeCost.stromstotte);
  });

  it("spike cost is part of the total and non-zero with expensive hours", () => {
    const r = computeExposure(prices, home());
    expect(r.spikeCost.stromstotte).toBeGreaterThan(0);
    expect(r.spikeCost.stromstotte).toBeLessThanOrEqual(r.cost.stromstotte + 1e-6);
  });

  it("bestScheme picks Norgespris in the expensive period", () => {
    const r = computeExposure(prices, home());
    expect(bestScheme(r)).toBe("norgespris");
  });
});
