/**
 * The visited house's own figures at one hour of the simulated year: what its screens, its electricity
 * meter and the walk's panel show. Everything comes from that home's own rows of the simulation.
 *
 * The field shares power and batteries as one community, so the field as a whole meets the grid. The
 * house's part of what the field buys in an hour is its share of the need that was left once the
 * neighbours had evened out what they could; its part of what the field sells is its share of the surplus
 * left over in the same way. (Without sharing, every home meets the grid on its own and the figure is
 * exactly its own.)
 */
import type { YearResult } from "@/lib/sim/run";
import type { LiveFigures } from "../scene/house/walkState";

/** The live figures, and what the house's own meter has counted this year (the screens draw it). */
export type HouseFigures = LiveFigures & { meterKwh: number };

// the simulation's battery: 90 % round trip, split evenly between charging and discharging (lib/sim/run.ts)
const EC = Math.sqrt(0.9), ED = Math.sqrt(0.9);

/** Where each battery starts the year in the simulation: its outage reserve or half full, whichever is more. */
function startSoc(r: YearResult) {
  return Math.max(Math.max(0.05, Math.min(0.9, r.scenario.reserve)), 0.5);
}

/** What went into and came out of home k's own battery in hour h (kWh at the battery's terminals). */
function battery(r: YearResult, k: number, h: number) {
  const cap = r.scenario.batteryKwh;
  if (cap <= 0) return { into: 0, out: 0 };
  const stored = (r.soc[k][h] - (h > 0 ? r.soc[k][h - 1] : startSoc(r))) * cap;
  return stored >= 0 ? { into: stored / EC, out: 0 } : { into: 0, out: -stored * ED };
}

/** Through the house's own meter in hour h: + in from the field's lines (the grid or the neighbours), - out. */
function meterFlow(r: YearResult, k: number, h: number) {
  const b = battery(r, k, h);
  return r.load[k][h] - r.pv[k][h] + b.into - b.out;
}

/** The house's own exchange with the grid in hour h, kW: + bought, - sold. */
export function houseGrid(r: YearResult, k: number, h: number) {
  if (!r.scenario.sharing) return meterFlow(r, k, h);
  const F = r.field;
  let need = 0, supply = 0;
  for (let j = 0; j < r.homes; j++) {
    const x = r.load[j][h] - r.pv[j][h];
    if (x > 0) need += x; else supply -= x;
  }
  const office = F.office[h] - F.pvOffice[h];
  if (office > 0) need += office; else supply -= office;
  supply += F.park[h] + F.wind[h];
  // what was still missing, and still left over, in the whole field once the neighbours had shared
  const missing = need - F.shared[h], left = supply - F.shared[h];
  // the same for this house: its own need (+) or surplus (-) less what came from or went to the neighbours
  const own = r.load[k][h] - r.pv[k][h] - r.share[k][h];
  if (own > 0 && missing > 1e-6) return F.imp[h] * Math.min(1, own / missing);
  if (own < 0 && left > 1e-6) return -F.exp[h] * Math.min(1, -own / left);
  return 0;
}

/** The house's figures at hour h of the simulated year; `local` is the moment the visitor has chosen. */
export function houseFigures(r: YearResult, k: number, h: number, local: { month: number; day: number; hour: number }): HouseFigures {
  let yearPv = 0, yearUse = 0;
  for (let i = 0; i < r.pv[k].length; i++) { yearPv += r.pv[k][i]; yearUse += r.load[k][i]; }
  // the meter of a new house, counting from 1 January: everything that has come in through it, hour by hour
  let meterKwh = 0;
  for (let t = 0; t < h; t++) meterKwh += Math.max(0, meterFlow(r, k, t));
  const pv = r.pv[k][h], use = r.load[k][h];
  return {
    pv, use, hp: Math.max(0, use - r.appliance[k][h]), soc: r.soc[k][h], share: r.share[k][h],
    grid: houseGrid(r, k, h), temp: r.field.temp[h], price: r.field.buy[h], cop: r.field.cop[h] || r.scenario.scop,
    hour: local.hour, day: local.day, month: local.month, yearPv, yearUse,
    // the roof's power used in the house this hour, as it is made
    selfUse: Math.min(pv, use),
    batteryKwh: r.scenario.batteryKwh, kwp: r.scenario.pvPerHomeKwp, offline: false,
    meterKwh,
  };
}
