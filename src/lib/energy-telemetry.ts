import { ASSUMPTIONS } from "./energy";

/**
 * Energy telemetry for the community dashboard. The data layer sits behind a
 * clean interface so a future live inverter or battery feed can replace the
 * simulation with no UI change. The only implementation today is a deterministic
 * simulation driven by admin parameters: every value is an illustrative
 * simulation, never live telemetry, and the same day yields the same numbers.
 */

export type SimulationParams = {
  installedKwp: number;
  yieldPerKwp: number;
  batteryKwh: number;
  socMin: number;
  socMax: number;
  householdKwh: number;
  plotCount: number;
  outage: { startHour: number; durationHours: number; loadsKeptKw: number };
};

// Defaults are indicative (PVGIS yield, SSB household). plotCount is a flagged
// placeholder until the real count is known (INPUTS-NEEDED).
export const DEFAULT_SIM_PARAMS: SimulationParams = {
  installedKwp: 120,
  yieldPerKwp: ASSUMPTIONS.pvYieldPerKwp,
  batteryKwh: 200,
  socMin: 0.2,
  socMax: 0.95,
  householdKwh: 14700,
  plotCount: 12,
  outage: { startHour: 18, durationHours: 6, loadsKeptKw: ASSUMPTIONS.criticalLoadKw },
};

export type OutageEvent = {
  startHour: number;
  durationHours: number;
  loadsKeptKw: number;
  homesPowered: number;
  homesTotal: number;
  coveredHours: number;
};

export interface EnergyTelemetrySource {
  productionTodayKwh(date: Date): number;
  batterySoc(date: Date): number;
  communitySelfSufficiency(): number;
  outageEvent(): OutageEvent;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86_400_000);
}

/** Deterministic, parameter-driven simulation. No randomness, no live data. */
export class SimulatedSource implements EnergyTelemetrySource {
  constructor(private readonly p: SimulationParams) {}

  productionTodayKwh(date: Date): number {
    const annual = this.p.installedKwp * this.p.yieldPerKwp;
    const dailyAvg = annual / 365;
    // Seasonal curve peaking at the summer solstice (day 172), with a mean of 1.
    const seasonal = clamp(
      1 + 0.75 * Math.cos(((dayOfYear(date) - 172) / 365) * 2 * Math.PI),
      0.1,
      1.9,
    );
    return Math.round(dailyAvg * seasonal);
  }

  batterySoc(date: Date): number {
    // Charges through the day, peaks late afternoon, lowest before dawn.
    const hour = date.getUTCHours();
    const shape = 0.5 - 0.5 * Math.cos((((hour - 4 + 24) % 24) / 24) * 2 * Math.PI);
    return Math.round((this.p.socMin + (this.p.socMax - this.p.socMin) * shape) * 100) / 100;
  }

  communitySelfSufficiency(): number {
    const annualProduction = this.p.installedKwp * this.p.yieldPerKwp;
    const annualDemand = this.p.householdKwh * this.p.plotCount;
    if (annualDemand <= 0) return 0;
    // Self-consumed share with a shared battery (reused from the energy model).
    const selfConsumed = annualProduction * ASSUMPTIONS.selfConsumptionRate.battery;
    return clamp(selfConsumed / annualDemand, 0, 0.95);
  }

  outageEvent(): OutageEvent {
    const usable = this.p.batteryKwh * ASSUMPTIONS.batteryUsable;
    const loadAll = this.p.outage.loadsKeptKw * this.p.plotCount;
    const coveredHours = loadAll > 0 ? usable / loadAll : 0;
    const homesPowered =
      coveredHours >= this.p.outage.durationHours
        ? this.p.plotCount
        : Math.floor(usable / (this.p.outage.loadsKeptKw * this.p.outage.durationHours));
    return {
      startHour: this.p.outage.startHour,
      durationHours: this.p.outage.durationHours,
      loadsKeptKw: this.p.outage.loadsKeptKw,
      homesPowered: clamp(homesPowered, 0, this.p.plotCount),
      homesTotal: this.p.plotCount,
      coveredHours: Math.round(coveredHours * 10) / 10,
    };
  }
}

/** Merge admin-supplied JSON over the defaults; bad input falls back to defaults. */
export function parseSimulationParams(valuesJson: string | null | undefined): SimulationParams {
  if (!valuesJson) return DEFAULT_SIM_PARAMS;
  try {
    const v = JSON.parse(valuesJson) as Partial<SimulationParams>;
    return {
      ...DEFAULT_SIM_PARAMS,
      ...v,
      outage: { ...DEFAULT_SIM_PARAMS.outage, ...(v.outage ?? {}) },
    };
  } catch {
    return DEFAULT_SIM_PARAMS;
  }
}
