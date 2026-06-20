import { ASSUMPTIONS } from "./energy";

/**
 * Outage-resilience model: how long a home stays powered when the grid goes
 * down, and what keeps running. The headline backup-hours number reuses the
 * same critical-load assumption as the SPEC-05 calculator, so the two never
 * diverge; the hour-by-hour simulation adds priority load-shedding and an
 * optional daytime solar recharge for the interactive timeline. Every figure is
 * indicative and requires professional verification.
 */

export type Load = {
  id: string;
  watts: number;
  priority: number; // 1 = shed last (most critical)
  source: string;
};

// Typical continuous draws, indicative. A modulating heat pump and a
// fridge/freezer cycle, so these are averaged figures, not peak.
export const LOADS: Load[] = [
  { id: "varmepumpe", watts: 400, priority: 1, source: "varmepumpe, modulert snitt" },
  { id: "kjolfrys", watts: 90, priority: 2, source: "kjol/frys, syklet snitt" },
  { id: "belysning", watts: 60, priority: 3, source: "LED-belysning" },
  { id: "pumpe", watts: 50, priority: 4, source: "vann/sirkulasjonspumpe snitt" },
  { id: "ruter", watts: 15, priority: 5, source: "ruter/nettverk" },
];

export const TOTAL_LOAD_KW = LOADS.reduce((s, l) => s + l.watts, 0) / 1000;

export type Season = "summer" | "winter";

/**
 * Backup hours on the critical load only, identical to the SPEC-05 resilience
 * figure (usable battery divided by the critical load). Keeps the two tools in
 * agreement.
 */
export function criticalBackupHours(usableKwh: number): number {
  if (ASSUMPTIONS.criticalLoadKw <= 0) return 0;
  return Math.round((usableKwh / ASSUMPTIONS.criticalLoadKw) * 10) / 10;
}

/** Usable battery energy for a nominal capacity, reusing the depth-of-discharge. */
export function usableKwh(batteryKwh: number): number {
  return batteryKwh * ASSUMPTIONS.batteryUsable;
}

// Daylight window (local hours) and a seasonal yield factor with an annual mean
// of 1, so daytime solar recharge is realistic for the season.
const DAYLIGHT: Record<Season, { from: number; to: number; factor: number }> = {
  summer: { from: 5, to: 22, factor: 1.7 },
  winter: { from: 9, to: 15, factor: 0.3 },
};

function solarKwhAtHour(pvKwp: number, season: Season, hourOfDay: number): number {
  const d = DAYLIGHT[season];
  if (hourOfDay < d.from || hourOfDay >= d.to) return 0;
  const dailyProduction = (pvKwp * ASSUMPTIONS.pvYieldPerKwp * d.factor) / 365;
  return dailyProduction / (d.to - d.from);
}

export type HourState = {
  hour: number;
  hourOfDay: number;
  soc: number; // kWh remaining
  socPercent: number;
  loadsOn: string[];
  solarKwh: number;
};

export type OutageParams = {
  batteryKwh: number;
  pvKwp: number;
  season: Season;
  solarRecharge: boolean;
  startHour?: number;
};

/**
 * Hour-by-hour simulation. Each hour, available energy is the battery plus any
 * solar; loads are powered by priority and the lowest-priority loads are shed
 * when energy runs short. backupHours is the last hour the most critical load
 * stays on.
 */
export function simulateOutage(
  p: OutageParams,
  hours = 48,
): { timeline: HourState[]; backupHours: number } {
  const cap = usableKwh(p.batteryKwh);
  let soc = cap;
  const start = p.startHour ?? 18;
  const timeline: HourState[] = [];
  let backupHours = 0;

  for (let i = 0; i < hours; i++) {
    const hourOfDay = (start + i) % 24;
    const solar = p.solarRecharge ? solarKwhAtHour(p.pvKwp, p.season, hourOfDay) : 0;
    const available = soc + solar;

    const loadsOn: string[] = [];
    let drawn = 0;
    for (const load of [...LOADS].sort((a, b) => a.priority - b.priority)) {
      const kwh = load.watts / 1000;
      if (available - drawn >= kwh) {
        loadsOn.push(load.id);
        drawn += kwh;
      }
    }

    soc = Math.max(0, Math.min(cap, soc + solar - drawn));
    if (loadsOn.includes("varmepumpe")) backupHours = i + 1;

    timeline.push({
      hour: i,
      hourOfDay,
      soc: Math.round(soc * 100) / 100,
      socPercent: cap > 0 ? Math.round((soc / cap) * 100) : 0,
      loadsOn,
      solarKwh: Math.round(solar * 100) / 100,
    });
  }

  return { timeline, backupHours };
}
