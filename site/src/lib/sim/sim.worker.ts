/// <reference lib="webworker" />
/**
 * Runs the energy simulation off the page's main thread. A "field" job runs the year for the whole field and
 * sends the typed arrays back (transferred, not copied); a "house" job works out the house configurator's
 * estimate for one configured house on its plot and sends back only the figures.
 */
import { weatherOf, type EnergyInputs, type Weather } from "./inputs";
import { runYear, type HomeSpec, type Scenario } from "./run";
import { estimateEnergy } from "../configurator/energy";
import type { PlotFacts } from "../configurator/state";
import type { EnergyOptions, HouseConfig } from "../configurator/types";
import type { Plot } from "../types";

type FieldJob = { id: number; kind?: "field"; homes: HomeSpec[]; scenario: Scenario; base: { elPerHome: number; heatPerHome: number; officeKwh: number; workshopKwh: number }; origin: string };
export type HouseJob = { id: number; kind: "house"; config: HouseConfig; plot: Plot | null; facts: PlotFacts | null; opts: EnergyOptions; origin: string };

let inputs: EnergyInputs | null = null;
let weather: Weather | null = null;

async function load(origin: string) {
  if (!inputs || !weather) {
    const res = await fetch(new URL("/twin/energy.json", origin));
    if (!res.ok) throw new Error(`energy.json ${res.status}`);
    inputs = (await res.json()) as EnergyInputs;
    weather = weatherOf(inputs);
  }
  return { inputs, weather };
}

self.onmessage = async (e: MessageEvent<FieldJob | HouseJob>) => {
  const job = e.data;
  const { id } = job;
  try {
    const sim = await load(job.origin);
    if (job.kind === "house") {
      const estimate = estimateEnergy(job.config, job.plot, job.facts, job.opts, sim);
      (self as unknown as Worker).postMessage({ id, estimate });
      return;
    }
    const r = runYear(sim.inputs, sim.weather, job.homes, job.scenario, job.base);
    const buffers: ArrayBuffer[] = [];
    const take = (a: Float32Array) => { buffers.push(a.buffer as ArrayBuffer); return a; };
    // the per-home and field series are fresh arrays per run; weather series are copied, not moved
    r.pv.forEach(take); r.load.forEach(take); r.soc.forEach(take); r.share.forEach(take);
    r.ev.forEach((a) => { if (a) take(a); });
    const f = r.field;
    [f.pvRoofs, f.pvOffice, f.park, f.homes, f.heatPumps, f.ev, f.office, f.charge, f.discharge, f.imp, f.exp, f.shared, f.soc, f.buy, f.sell].forEach(take);
    const copy = { ...r, appliance: r.appliance.map((a) => a.slice()), field: { ...f, wind: f.wind.slice(), temp: f.temp.slice(), ghi: f.ghi.slice(), wind10: f.wind10.slice(), cop: f.cop.slice() } };
    (self as unknown as Worker).postMessage({ id, result: copy, inputs: { year: sim.inputs.year, sources: sim.inputs.sources, park: sim.inputs.park, pvgis: sim.inputs.pvgis_kwh_per_kwp, tmy_months: sim.inputs.tmy_months } }, buffers);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, error: String(err) });
  }
};
