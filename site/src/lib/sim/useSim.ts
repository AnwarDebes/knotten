"use client";
/**
 * The page side of the energy simulation: one worker, one year per scenario, results cached (the
 * last few scenarios), so switching back and forth is instant. The house configurator's estimates
 * run in the same worker (houseEstimate).
 */
import { useEffect, useState } from "react";
import type { HomeSpec, Scenario, YearResult } from "./run";
import { BASE } from "./scenario";
import type { HouseJob } from "./sim.worker";
import type { EnergyEstimate } from "../configurator/types";

export type SimInfo = {
  year: number;
  sources: Record<string, string>;
  park: { x: number; y: number; z: number; name: string };
  pvgis: Record<string, number>;
  tmy_months: [number, number][];
};
type Out = { result: YearResult; info: SimInfo };
type Reply = { id: number; result?: YearResult; inputs?: SimInfo; estimate?: EnergyEstimate; error?: string };

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (v: Reply) => void; reject: (e: Error) => void }>();
const cache = new Map<string, Promise<Out>>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./sim.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<Reply>) => {
      const p = pending.get(e.data.id);
      pending.delete(e.data.id);
      if (!p) return;
      if (e.data.error) p.reject(new Error(e.data.error));
      else p.resolve(e.data);
    };
  }
  return worker;
}

function post(job: Record<string, unknown>): Promise<Reply> {
  return new Promise<Reply>((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ ...job, id, origin: location.origin });
  });
}

/** Keeps the newest `max` entries of a cache (a Map remembers the order of insertion). */
function trim<V>(m: Map<string, V>, max: number) {
  while (m.size > max) m.delete(m.keys().next().value as string);
}

export function simulate(homes: HomeSpec[], scenario: Scenario): Promise<Out> {
  // keyed on the homes themselves (roofs, horizons and options), not only on how many there are, so a
  // change to one home's roof or options never reuses a stale year
  const key = `${JSON.stringify(homes)}|${JSON.stringify(scenario)}`;
  let p = cache.get(key);
  if (!p) {
    p = post({ kind: "field", homes, scenario, base: BASE }).then((r) => {
      if (!r.result || !r.inputs) throw new Error("simulation failed");
      return { result: r.result, info: r.inputs };
    });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
    // keep the last six years in memory (each is a few megabytes of hourly series)
    trim(cache, 6);
  }
  return p;
}

const houses = new Map<string, Promise<EnergyEstimate>>();

/**
 * One configured house's energy estimate, worked out in the worker. `key` must name everything the estimate
 * depends on (useEnergyEstimate builds it); the last couple of dozen answers are kept.
 */
export function houseEstimate(key: string, job: Omit<HouseJob, "id" | "origin" | "kind">): Promise<EnergyEstimate> {
  let p = houses.get(key);
  if (!p) {
    p = post({ kind: "house", ...job }).then((r) => {
      if (!r.estimate) throw new Error("estimate failed");
      return r.estimate;
    });
    p.catch(() => houses.delete(key));
    houses.set(key, p);
    trim(houses, 24);
  }
  return p;
}

export function useSim(homes: HomeSpec[], scenario: Scenario, enabled = true) {
  const [state, setState] = useState<{ out: Out | null; error: string | null; busy: boolean }>({ out: null, error: null, busy: true });
  const key = JSON.stringify(scenario);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marks the run as busy while the worker computes the new scenario
    setState((s) => ({ ...s, busy: true }));
    simulate(homes, JSON.parse(key)).then((out) => { if (alive) setState({ out, error: null, busy: false }); }).catch((e) => { if (alive) setState((s) => ({ ...s, error: String(e), busy: false })); });
    return () => { alive = false; };
  }, [homes, key, enabled]);
  return state;
}
