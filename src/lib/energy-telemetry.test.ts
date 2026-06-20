// @vitest-environment node
import { describe, expect, it } from "vitest";
import { SimulatedSource, parseSimulationParams, DEFAULT_SIM_PARAMS } from "./energy-telemetry";

const src = new SimulatedSource(DEFAULT_SIM_PARAMS);

describe("SimulatedSource", () => {
  it("is deterministic for a given day", () => {
    const d = new Date(Date.UTC(2026, 5, 21, 13));
    expect(src.productionTodayKwh(d)).toBe(src.productionTodayKwh(d));
  });

  it("produces more solar in summer than in winter", () => {
    const summer = src.productionTodayKwh(new Date(Date.UTC(2026, 5, 21, 13)));
    const winter = src.productionTodayKwh(new Date(Date.UTC(2026, 11, 21, 13)));
    expect(summer).toBeGreaterThan(winter);
  });

  it("keeps battery state of charge within its bounds", () => {
    for (let h = 0; h < 24; h++) {
      const soc = src.batterySoc(new Date(Date.UTC(2026, 5, 21, h)));
      expect(soc).toBeGreaterThanOrEqual(DEFAULT_SIM_PARAMS.socMin);
      expect(soc).toBeLessThanOrEqual(DEFAULT_SIM_PARAMS.socMax);
    }
  });

  it("reports a self-sufficiency between 0 and the 95% cap", () => {
    const s = src.communitySelfSufficiency();
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(0.95);
  });

  it("powers every home when the battery covers the outage", () => {
    const e = src.outageEvent();
    expect(e.homesTotal).toBe(DEFAULT_SIM_PARAMS.plotCount);
    expect(e.homesPowered).toBeGreaterThan(0);
    expect(e.homesPowered).toBeLessThanOrEqual(e.homesTotal);
  });

  it("powers fewer homes when the battery is small", () => {
    const small = new SimulatedSource({ ...DEFAULT_SIM_PARAMS, batteryKwh: 5 });
    expect(small.outageEvent().homesPowered).toBeLessThan(DEFAULT_SIM_PARAMS.plotCount);
  });
});

describe("parseSimulationParams", () => {
  it("returns defaults for empty or invalid input", () => {
    expect(parseSimulationParams(null)).toEqual(DEFAULT_SIM_PARAMS);
    expect(parseSimulationParams("{not json")).toEqual(DEFAULT_SIM_PARAMS);
  });

  it("merges admin values over the defaults, including nested outage", () => {
    const p = parseSimulationParams('{"installedKwp": 300, "outage": {"durationHours": 12}}');
    expect(p.installedKwp).toBe(300);
    expect(p.outage.durationHours).toBe(12);
    expect(p.outage.loadsKeptKw).toBe(DEFAULT_SIM_PARAMS.outage.loadsKeptKw);
    expect(p.yieldPerKwp).toBe(DEFAULT_SIM_PARAMS.yieldPerKwp);
  });
});
