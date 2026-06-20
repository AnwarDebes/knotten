// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  annuityMonthlyPayment,
  bestPricePerKwh,
  annualEnergyCost,
  computeMonthlyCost,
  type MonthlyCostInput,
} from "./monthly-cost";

describe("annuity", () => {
  it("matches the closed-form annuity for a normal loan", () => {
    // 4,000,000 at 5% over 25 years is about 23,375 kr/month.
    const m = annuityMonthlyPayment(4_000_000, 5, 25);
    expect(m).toBeGreaterThan(23_000);
    expect(m).toBeLessThan(23_800);
  });

  it("handles a 0% rate as simple division", () => {
    expect(annuityMonthlyPayment(1_200_000, 0, 10)).toBeCloseTo(1_200_000 / 120, 6);
  });

  it("returns 0 for a non-positive principal or term", () => {
    expect(annuityMonthlyPayment(0, 5, 25)).toBe(0);
    expect(annuityMonthlyPayment(1_000_000, 5, 0)).toBe(0);
  });

  it("a longer term lowers the monthly payment", () => {
    expect(annuityMonthlyPayment(3_000_000, 5, 30)).toBeLessThan(
      annuityMonthlyPayment(3_000_000, 5, 20),
    );
  });
});

describe("energy cost", () => {
  it("picks the cheaper support scheme at a given spot price", () => {
    // At a high spot, Norgespris (fixed) should win.
    expect(bestPricePerKwh(5).scheme).toBe("norgespris");
  });

  it("self-cover reduces the annual energy cost proportionally", () => {
    const full = annualEnergyCost(10000, 0);
    const half = annualEnergyCost(10000, 0.5);
    expect(half).toBeCloseTo(full * 0.5, 6);
  });
});

describe("monthly cost of ownership", () => {
  const input = (over: Partial<MonthlyCostInput> = {}): MonthlyCostInput => ({
    kjopesum: 5_000_000,
    egenkapital: 1_000_000,
    rentePercent: 5,
    lopetidYears: 25,
    felleskostnaderPerMonth: 1500,
    knottenAnnualKwh: 9500,
    knottenSelfCover: 0.4,
    ...over,
  });

  it("uses the same loan and felleskostnader for both homes, differing only on energy", () => {
    const r = computeMonthlyCost(input());
    expect(r.knotten.loanMonthly).toBe(r.conventional.loanMonthly);
    expect(r.knotten.felleskostnaderMonthly).toBe(r.conventional.felleskostnaderMonthly);
    expect(r.knotten.energyMonthly).toBeLessThan(r.conventional.energyMonthly);
  });

  it("isolates a positive monthly energy advantage for Knotten", () => {
    const r = computeMonthlyCost(input());
    expect(r.energyDeltaMonthly).toBeGreaterThan(0);
    expect(r.knotten.totalMonthly).toBeLessThan(r.conventional.totalMonthly);
  });

  it("computes the loan principal from price minus equity", () => {
    const r = computeMonthlyCost(input({ kjopesum: 5_000_000, egenkapital: 1_500_000 }));
    expect(r.loanPrincipal).toBe(3_500_000);
  });

  it("accumulates the energy delta over the horizon", () => {
    const r = computeMonthlyCost(input());
    expect(r.cumulativeEnergyDelta(10)).toBeCloseTo(r.energyDeltaMonthly * 120, 6);
    expect(r.cumulativeEnergyDelta(20)).toBeGreaterThan(r.cumulativeEnergyDelta(10));
  });
});
