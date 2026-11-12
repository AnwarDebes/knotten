/**
 * The field, hour by hour through a whole year: what each home's roof makes, what each home uses,
 * how the batteries and the neighbours even it out, and what goes to and from the grid.
 *
 * Order each hour: a home uses its own solar power first. With sharing on (the field as one
 * community on the same property), what one home has left covers what another lacks, together with
 * the office's panels, the shared plant and the turbines; what is still left charges the batteries,
 * then goes to the grid. What is still missing comes from the batteries, then from the grid. With
 * sharing off, every home is on its own and the shared plant and turbines sell to the grid.
 */
import { HOURS, type EnergyInputs, type Weather, localOf } from "./inputs";
import { panelSeries, windSeries, sunTable, annualYield, type Panel, type Sun } from "./pv";
import { buildLoads, type HouseholdSpec, type Loads } from "./loads";
import { BUDGET, SIM_SETTINGS } from "../facts";

/** A panel plane on a home besides its roof (a carport roof): kWp, pitch, direction and terrain horizon. */
export type PvPlane = Panel & { kwp: number };

/**
 * A home's own options. A home without them follows the scenario, the way the energy budget sets every home; the
 * house configurator sets them for the one house it shows (src/lib/configurator/energy.ts).
 */
export type HomeOptions = HouseholdSpec & {
  /** kWp on the roof plane; the scenario's pvPerHomeKwp otherwise. */
  kwp?: number;
  /** More panel planes, each with its own kWp, pitch, direction and horizon. */
  planes?: PvPlane[];
  /** Home charging of electric cars: kWh a year, the charger's kW, and the local hours the car is at home (from, to). */
  ev?: { kwhYear: number; kw: number; from: number; to: number };
  /** A constant draw of the heating plant in some local months, kW (the circulation pump for free cooling). */
  cooling?: { kw: number; months: number[] };
};

export type HomeSpec = { id: string; tilt: number; azimuth: number; horizon: number[]; opts?: HomeOptions };

export type Scenario = {
  pvPerHomeKwp: number;
  officePvKwp: number;
  parkKwp: number;
  windKw: number;
  windSiteFactor: number;
  batteryKwh: number;
  batteryKw: number;
  reserve: number;          // share of each battery kept back for a power cut (topped up from the grid)
  sharing: boolean;
  prices: "budget" | "spot2025";
  scop: number;
};

export type Prices = { buyFixed: number; sellFixed: number; gridFee: number; co2: number };

export type YearResult = {
  scenario: Scenario;
  homes: number;
  // per home, per hour (load includes the car; ev is the car's charging, null for a home without one)
  pv: Float32Array[]; load: Float32Array[]; appliance: Float32Array[]; soc: Float32Array[]; share: Float32Array[]; ev: (Float32Array | null)[];
  // field, per hour (kW)
  field: {
    pvRoofs: Float32Array; pvOffice: Float32Array; park: Float32Array; wind: Float32Array;
    homes: Float32Array; heatPumps: Float32Array; ev: Float32Array; office: Float32Array;
    charge: Float32Array; discharge: Float32Array; imp: Float32Array; exp: Float32Array; shared: Float32Array;
    soc: Float32Array; buy: Float32Array; sell: Float32Array; temp: Float32Array; ghi: Float32Array; wind10: Float32Array; cop: Float32Array;
  };
  totals: Totals;
  monthly: { prod: number[]; use: number[]; imp: number[]; exp: number[]; selfUse: number[] };
  yieldPerKwp: { roofsMean: number; best: number; worst: number; office: number; park: number; pvgisSouth35: number; calibration: number };
};

export type Totals = {
  production: number; pvRoofs: number; pvOffice: number; park: number; wind: number;
  demand: number; homesEl: number; heatPumpEl: number; ev: number; heat: number; office: number;
  imp: number; exp: number; shared: number; batteryOut: number;
  selfSufficiency: number; selfConsumption: number;
  cost: number; refCost: number; saving: number; savingPerHome: number;
  co2Saved: number; refDemand: number;
};

export const BUDGET_PRICES: Prices = { buyFixed: BUDGET.prices.buy_nok, sellFixed: BUDGET.prices.sell_nok, gridFee: BUDGET.prices.grid_nok, co2: BUDGET.prices.co2_kg_per_kwh };

type Cache = {
  sun: Sun; calibration: number; office: Float32Array; park: Float32Array; parkYield: number; officeYield: number;
  /** AC output per kWp of every panel plane seen so far, keyed on its pitch, direction and horizon. */
  planes: Map<string, Float32Array>;
  /** Loads, keyed on everything that shapes them (the scenario's SCOP, the base figures and each home's household). */
  loads: Map<string, Loads>;
  /** Local month and hour of each hour of the year (the monthly sums, the car and the cooling pump). */
  local?: { month: Uint8Array; hour: Uint8Array };
};
const caches = new WeakMap<EnergyInputs, Cache>();
const MAX_PLANES = 256, MAX_LOADS = 24;

/**
 * The sun, the calibration and the shared plant's series, once per input set. The homes' series and loads are
 * cached apart, keyed on what shapes them, so a home with another roof or other options never reuses a stale one.
 */
function cacheFor(inputs: EnergyInputs, w: Weather): Cache {
  let c = caches.get(inputs);
  if (c) return c;
  const sun = sunTable(inputs.year);
  // calibrate to PVGIS: the model's 1 kWp due south at 35 degrees, no horizon, against PVGIS's own yield
  // for this spot (long-term average, 14 % losses); every panel series is scaled by the same factor
  const ref = annualYield(panelSeries(w, sun, { tilt: 35, azimuth: 180 }));
  const calibration = inputs.pvgis_kwh_per_kwp["35/0"] / ref;
  const office = scaled(panelSeries(w, sun, { tilt: inputs.office_roof.tilt, azimuth: inputs.office_roof.azimuth, horizon: inputs.office_roof.horizon }).kw, calibration);
  const park = scaled(panelSeries(w, sun, { tilt: 30, azimuth: 180, horizon: inputs.park.horizon }).kw, calibration);
  c = { sun, calibration, office, park, parkYield: annualYield({ kw: park }), officeYield: annualYield({ kw: office }), planes: new Map(), loads: new Map() };
  caches.set(inputs, c);
  return c;
}

function scaled(a: Float32Array, k: number) {
  for (let i = 0; i < a.length; i++) a[i] *= k;
  return a;
}

/** Keeps a cache map below `max` entries (the oldest goes first). */
function bound<V>(m: Map<string, V>, max: number) {
  while (m.size >= max) m.delete(m.keys().next().value as string);
}

/** A plane's AC output per kWp, hour by hour (calibrated). Shared between runs: never written to. */
function planeSeries(c: Cache, w: Weather, p: Panel): Float32Array {
  const key = `${p.tilt}|${p.azimuth}|${p.horizon ? p.horizon.join(",") : "-"}`;
  let s = c.planes.get(key);
  if (!s) {
    s = scaled(panelSeries(w, c.sun, { tilt: p.tilt, azimuth: p.azimuth, horizon: p.horizon }).kw, c.calibration);
    bound(c.planes, MAX_PLANES);
    c.planes.set(key, s);
  }
  return s;
}

function localHours(c: Cache, year: number) {
  if (!c.local) {
    const month = new Uint8Array(HOURS), hour = new Uint8Array(HOURS);
    for (let h = 0; h < HOURS; h++) { const l = localOf(year, h); month[h] = l.month; hour[h] = l.hour; }
    c.local = { month, hour };
  }
  return c.local;
}

/**
 * A car's home charging, placed the way smart control places it: the car comes home at the local hour `from` and
 * must have the day's energy by `to`. The day's kWh go first into hours with spare solar power, then into the
 * cheapest hours, and with a flat price into the hours when the house itself uses least.
 */
function chargeSeries(ev: NonNullable<HomeOptions["ev"]>, hourOfDay: Uint8Array, spare: (h: number) => number, buy: (h: number) => number, houseLoad: (h: number) => number) {
  const out = new Float32Array(HOURS);
  const daily = ev.kwhYear / 365;
  if (!(daily > 0) || !(ev.kw > 0)) return out;
  for (let s = 0; s < HOURS; s++) {
    if (hourOfDay[s] !== ev.from || hourOfDay[(s + HOURS - 1) % HOURS] === ev.from) continue;
    const win: { h: number; j: number; sun: number; price: number; load: number }[] = [];
    for (let j = 0; j < 24; j++) {
      const h = (s + j) % HOURS;
      if (hourOfDay[h] === ev.to) break;
      win.push({ h, j, sun: Math.max(0, spare(h)), price: buy(h), load: houseLoad(h) });
    }
    win.sort((a, b) => (b.sun > 0.01 ? 1 : 0) - (a.sun > 0.01 ? 1 : 0) || b.sun - a.sun || a.price - b.price || a.load - b.load || a.j - b.j);
    let left = daily;
    for (const x of win) {
      const e = Math.min(ev.kw, left);
      out[x.h] += e;
      left -= e;
      if (left <= 1e-9) break;
    }
  }
  return out;
}

export function runYear(inputs: EnergyInputs, w: Weather, homes: HomeSpec[], sc: Scenario, base: { elPerHome: number; heatPerHome: number; officeKwh: number; workshopKwh: number }, prices = BUDGET_PRICES): YearResult {
  const n = homes.length;
  const c = cacheFor(inputs, w);
  const per = homes.map((s) => s.opts);
  const household = (o: HomeOptions | undefined) => (o ? [o.size, o.insul, o.shift, o.roomHeat].map((v) => v ?? "").join(":") : "");
  const lkey = [sc.scop, n, base.elPerHome, base.heatPerHome, base.officeKwh, base.workshopKwh, SIM_SETTINGS.dhw_share, ...per.map(household)].join("|");
  let L = c.loads.get(lkey);
  if (!L) {
    const perHome = per.some(Boolean) ? per.map((o) => (o ? { size: o.size, insul: o.insul, shift: o.shift, roomHeat: o.roomHeat } : undefined)) : undefined;
    L = buildLoads(inputs.year, w, { homes: n, elPerHome: base.elPerHome, heatPerHome: base.heatPerHome, dhwShare: SIM_SETTINGS.dhw_share, scop: sc.scop, officeKwh: base.officeKwh, workshopKwh: base.workshopKwh, perHome });
    bound(c.loads, MAX_LOADS);
    c.loads.set(lkey, L);
  }
  const loads = L;
  const wind = sc.windKw > 0 ? windSeries(w, { kw: sc.windKw, hub: 18, siteFactor: sc.windSiteFactor, availability: 0.8 }) : new Float32Array(HOURS);
  const buyAt = (h: number) => (sc.prices === "budget" ? prices.buyFixed : w.price[h] + prices.gridFee);

  // each home's panels (its roof and any other plane), its cooling pump and its car
  const roof = homes.map((s) => planeSeries(c, w, s));
  const kwp = per.map((o) => o?.kwp ?? sc.pvPerHomeKwp);
  const extra = per.map((o) => (o?.planes ?? []).map((p) => ({ s: planeSeries(c, w, p), kwp: p.kwp })));
  const pvAt = (k: number, h: number) => {
    let g = roof[k][h] * kwp[k];
    const ex = extra[k];
    for (let i = 0; i < ex.length; i++) g += ex[i].s[h] * ex[i].kwp;
    return g;
  };
  const local = localHours(c, inputs.year);
  const monthOf = local.month;
  const cool = per.map((o) => {
    if (!o?.cooling) return null;
    const a = new Float32Array(HOURS);
    for (let h = 0; h < HOURS; h++) if (o.cooling.months.includes(local.month[h])) a[h] = o.cooling.kw;
    return a;
  });
  const evs = per.map((o, k) => {
    if (!o?.ev) return null;
    const co = cool[k];
    const houseLoad = (h: number) => loads.appliance[k][h] + loads.hp[k][h] + (co ? co[h] : 0);
    return chargeSeries(o.ev, local.hour, (h) => pvAt(k, h) - houseLoad(h), buyAt, houseLoad);
  });

  const cap = sc.batteryKwh, pmax = sc.batteryKw, socMax = 0.95 * cap;
  const keep = Math.max(0.05, Math.min(0.9, sc.reserve)) * cap;  // the outage reserve is not used day to day
  const socMin = keep;
  const rt = Math.sqrt(BUDGET.battery.round_trip_pct / 100);   // 90 % round trip, as in the budget
  const ec = rt, ed = rt;
  const soc = new Float32Array(n).fill(Math.max(keep, cap * 0.5));
  const pv = homes.map(() => new Float32Array(HOURS)), load = homes.map(() => new Float32Array(HOURS));
  const socS = homes.map(() => new Float32Array(HOURS)), share = homes.map(() => new Float32Array(HOURS));
  const F = {
    pvRoofs: new Float32Array(HOURS), pvOffice: new Float32Array(HOURS), park: new Float32Array(HOURS), wind,
    homes: new Float32Array(HOURS), heatPumps: new Float32Array(HOURS), ev: new Float32Array(HOURS), office: new Float32Array(HOURS),
    charge: new Float32Array(HOURS), discharge: new Float32Array(HOURS), imp: new Float32Array(HOURS), exp: new Float32Array(HOURS), shared: new Float32Array(HOURS),
    soc: new Float32Array(HOURS), buy: new Float32Array(HOURS), sell: new Float32Array(HOURS),
    temp: w.temp, ghi: w.ghi, wind10: w.wind, cop: L.cop,
  };
  const surplus = new Float64Array(n), deficit = new Float64Array(n);
  let cost = 0, refCost = 0, refDemand = 0;
  const monthly = { prod: Array(12).fill(0), use: Array(12).fill(0), imp: Array(12).fill(0), exp: Array(12).fill(0), selfUse: Array(12).fill(0) };

  for (let h = 0; h < HOURS; h++) {
    const buy = buyAt(h);
    const sell = sc.prices === "budget" ? prices.sellFixed : Math.max(0, w.price[h]);
    F.buy[h] = buy; F.sell[h] = sell;
    let S = 0, D = 0;
    for (let k = 0; k < n; k++) {
      const g = pvAt(k, h);
      const co = cool[k], car = evs[k];
      let l = L.appliance[k][h] + L.hp[k][h];
      if (co) l += co[h];
      if (car) l += car[h];
      pv[k][h] = g; load[k][h] = l;
      const own = Math.min(g, l);
      surplus[k] = g - own; deficit[k] = l - own;
      S += surplus[k]; D += deficit[k];
      F.pvRoofs[h] += g; F.homes[h] += L.appliance[k][h]; F.heatPumps[h] += co ? L.hp[k][h] + co[h] : L.hp[k][h];
      if (car) F.ev[h] += car[h];
      // the reference: the same home with direct electric heat and no panels or battery (the same car, no cooling)
      let ref = L.appliance[k][h] + L.heat[k][h];
      if (car) ref += car[h];
      refDemand += ref;
      refCost += ref * buy;
    }
    const og = c.office[h] * sc.officePvKwp, ol = L.office[h] + L.workshop[h];
    const parkG = c.park[h] * sc.parkKwp;
    F.pvOffice[h] = og; F.park[h] = parkG; F.office[h] = ol;
    refDemand += ol; refCost += ol * buy;
    const oOwn = Math.min(og, ol);
    let oSur = og - oOwn, oDef = ol - oOwn;
    let community = parkG + wind[h];
    let imp = 0, exp = 0, shared = 0, chg = 0, dis = 0;

    if (sc.sharing) {
      // 1) neighbours: every surplus in the field meets every need in the field
      const supply = S + oSur + community, need = D + oDef;
      shared = Math.min(supply, need);
      const fs = supply > 0 ? shared / supply : 0, fn = need > 0 ? shared / need : 0;
      for (let k = 0; k < n; k++) { share[k][h] = deficit[k] * fn - surplus[k] * fs; surplus[k] *= 1 - fs; deficit[k] *= 1 - fn; }
      oSur *= 1 - fs; oDef *= 1 - fn; community *= 1 - fs;
      // 2) what is left charges the batteries, pooled
      let left = S * (1 - fs) + oSur + community;
      if (left > 0 && cap > 0) {
        let room = 0;
        for (let k = 0; k < n; k++) room += Math.min(pmax, (socMax - soc[k]) / ec);
        const take = Math.min(left, room);
        if (room > 0) for (let k = 0; k < n; k++) { const r = Math.min(pmax, (socMax - soc[k]) / ec); const x = take * (r / room); soc[k] += x * ec; }
        chg = take; left -= take;
      }
      exp = left;
      // 3) what is still missing comes from the batteries, pooled, then the grid
      let miss = D * (1 - fn) + oDef;
      if (miss > 0 && cap > 0) {
        let avail = 0;
        for (let k = 0; k < n; k++) avail += Math.min(pmax, (soc[k] - socMin) * ed);
        const give = Math.min(miss, avail);
        if (avail > 0) for (let k = 0; k < n; k++) { const a = Math.min(pmax, (soc[k] - socMin) * ed); const x = give * (a / avail); soc[k] -= x / ed; }
        dis = give; miss -= give;
      }
      imp = miss;
    } else {
      for (let k = 0; k < n; k++) {
        let s = surplus[k], d = deficit[k];
        if (s > 0 && cap > 0) { const x = Math.min(s, pmax, (socMax - soc[k]) / ec); soc[k] += x * ec; chg += x; s -= x; }
        if (d > 0 && cap > 0) { const x = Math.min(d, pmax, (soc[k] - socMin) * ed); soc[k] -= x / ed; dis += x; d -= x; }
        exp += s; imp += d;
      }
      exp += oSur + community; imp += oDef;
    }
    // keep the outage reserve topped up from the grid (after a power cut, or if the year starts low)
    if (cap > 0) for (let k = 0; k < n; k++) {
      if (soc[k] < keep - 1e-6) { const x = Math.min(pmax, (keep - soc[k]) / ec); soc[k] += x * ec; imp += x; }
    }
    let socSum = 0;
    for (let k = 0; k < n; k++) { socS[k][h] = cap > 0 ? soc[k] / cap : 0; socSum += socS[k][h]; }
    F.soc[h] = n ? socSum / n : 0;
    F.imp[h] = imp; F.exp[h] = exp; F.shared[h] = shared; F.charge[h] = chg; F.discharge[h] = dis;
    cost += imp * buy - exp * sell;
    const m = monthOf[h] - 1;
    const prod = F.pvRoofs[h] + og + parkG + wind[h];
    const use = F.homes[h] + F.heatPumps[h] + F.ev[h] + ol;
    monthly.prod[m] += prod; monthly.use[m] += use; monthly.imp[m] += imp; monthly.exp[m] += exp; monthly.selfUse[m] += prod - exp;
  }

  const sum = (a: Float32Array) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };
  const pvRoofs = sum(F.pvRoofs), pvOffice = sum(F.pvOffice), park = sum(F.park), windE = sum(wind);
  const production = pvRoofs + pvOffice + park + windE;
  const homesEl = sum(F.homes), heatPumpEl = sum(F.heatPumps), evEl = sum(F.ev), office = sum(F.office);
  const demand = homesEl + heatPumpEl + evEl + office;
  const imp = sum(F.imp), exp = sum(F.exp);
  let heat = 0;
  for (let k = 0; k < n; k++) heat += sum(L.heat[k]);
  const yields = roof.map((s) => annualYield({ kw: s }));
  const totals: Totals = {
    production, pvRoofs, pvOffice, park, wind: windE,
    demand, homesEl, heatPumpEl, ev: evEl, heat, office,
    imp, exp, shared: sum(F.shared), batteryOut: sum(F.discharge),
    selfSufficiency: demand > 0 ? 1 - imp / demand : 0,
    selfConsumption: production > 0 ? 1 - exp / production : 0,
    cost, refCost, saving: refCost - cost, savingPerHome: n ? (refCost - cost) / n : 0,
    co2Saved: Math.max(0, refDemand - imp) * prices.co2, refDemand,
  };
  return {
    scenario: sc, homes: n, pv, load, appliance: L.appliance, soc: socS, share, ev: evs, field: F, totals, monthly,
    yieldPerKwp: {
      roofsMean: yields.reduce((a, b) => a + b, 0) / Math.max(1, yields.length),
      best: Math.max(...yields), worst: Math.min(...yields),
      office: c.officeYield, park: c.parkYield, pvgisSouth35: inputs.pvgis_kwh_per_kwp["35/0"], calibration: c.calibration,
    },
  };
}

/**
 * A power cut from hour `start`, `hours` long: the field on its own panels and batteries. With
 * `essential` on, homes cut to what matters (heat pump at half, a third of the rest). Cars are not
 * charged while the grid is down. Returns, per hour, which homes still have power, their state of
 * charge, and what could not be supplied.
 */
export function outage(y: YearResult, start: number, hours: number, essential: boolean, emergencyKwh = 0) {
  const n = y.homes, sc = y.scenario;
  let reserve = emergencyKwh * 0.95;           // the shared emergency battery, kept full for this
  const cap = sc.batteryKwh, pmax = sc.batteryKw, socMin = 0.05 * cap;
  const ed = Math.sqrt(0.9), ec = Math.sqrt(0.9);
  const soc = Array.from({ length: n }, (_, k) => y.soc[k][Math.max(0, start - 1)] * cap);
  const on: Uint8Array[] = [], socOut: Float32Array[] = [];
  let unserved = 0, firstDark = -1;
  for (let t = 0; t < hours; t++) {
    const h = (start + t) % HOURS;
    const row = new Uint8Array(n), srow = new Float32Array(n);
    const g = y.pv.map((p) => p[h]);
    const l = y.load.map((x, k) => {
      const all = x[h] - (y.ev?.[k]?.[h] ?? 0);
      if (!essential) return all;
      // essential: the heat pump at half, a third of everything else (light, fridge, router, cooking)
      const app = y.appliance[k][h];
      return SIM_SETTINGS.essential.heat_pump * Math.max(0, all - app) + SIM_SETTINGS.essential.rest * app;
    });
    const extra = (y.field.park[h] + y.field.wind[h] + y.field.pvOffice[h]) * (sc.sharing ? 1 : 0);
    let pool = sc.sharing ? extra : 0;
    // own panels first
    const need = new Float64Array(n), left = new Float64Array(n);
    for (let k = 0; k < n; k++) { const own = Math.min(g[k], l[k]); need[k] = l[k] - own; left[k] = g[k] - own; }
    if (sc.sharing) {
      for (let k = 0; k < n; k++) pool += left[k];
      for (let k = 0; k < n; k++) { const x = Math.min(need[k], pool); need[k] -= x; pool -= x; }
      // spare power charges batteries
      for (let k = 0; k < n && pool > 0; k++) { const x = Math.min(pool, pmax, (0.95 * cap - soc[k]) / ec); soc[k] += x * ec; pool -= x; }
      // batteries cover what is missing, shared across the field
      for (let k = 0; k < n; k++) {
        let d = need[k];
        for (let j = 0; j < n && d > 0; j++) {
          const j2 = (k + j) % n;
          const x = Math.min(d, pmax, (soc[j2] - socMin) * ed);
          if (x > 0) { soc[j2] -= x / ed; d -= x; }
        }
        // the shared emergency battery, last
        if (d > 0 && reserve > 0) { const x = Math.min(d, reserve * ed); reserve -= x / ed; d -= x; }
        need[k] = d;
      }
    } else {
      for (let k = 0; k < n; k++) {
        if (left[k] > 0) { const x = Math.min(left[k], pmax, (0.95 * cap - soc[k]) / ec); soc[k] += x * ec; }
        const x = Math.min(need[k], pmax, (soc[k] - socMin) * ed);
        soc[k] -= Math.max(0, x) / ed;
        need[k] -= Math.max(0, x);
      }
    }
    for (let k = 0; k < n; k++) {
      row[k] = need[k] > 0.05 ? 0 : 1;
      unserved += Math.max(0, need[k]);
      srow[k] = cap > 0 ? soc[k] / cap : 0;
    }
    if (firstDark < 0 && row.some((v) => v === 0)) firstDark = t;
    on.push(row); socOut.push(srow);
  }
  const litAtEnd = on.length ? on[on.length - 1].reduce((a, b) => a + b, 0) : n;
  return { on, soc: socOut, unserved, firstDark, litAtEnd, emergencyLeft: reserve };
}
