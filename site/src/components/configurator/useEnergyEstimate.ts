"use client";

/**
 * The configured house's energy figures for the configurator pages (both designs).
 *
 * The first answer is the quick overslag from the energy budget's own figures. The hourly model for this house on
 * its plot then runs in the page's simulation worker (src/lib/sim/sim.worker.ts), which loads the weather year once.
 * While it works, `loading` is true and `estimate` holds the last result, or the quick overslag before the first.
 * Answers are cached by everything they depend on (the plot, the energy choices, the price model), so going back to
 * an earlier choice is instant, and a facade colour or a floor does not start a new run.
 */
import { useEffect, useMemo, useState } from "react";
import { OPTIONS } from "@/lib/configurator/catalog";
import { estimateEnergy } from "@/lib/configurator/energy";
import { resolved, type PlotFacts } from "@/lib/configurator/state";
import type { EnergyEstimate, EnergyOptions, HouseConfig } from "@/lib/configurator/types";
import { houseEstimate } from "@/lib/sim/useSim";
import type { Plot } from "@/lib/types";

/** The options the energy model reads: those marked "energy" in the catalogue, and the lower floor (heated area). */
const ENERGY_OPTIONS = OPTIONS.filter((o) => o.effects.includes("energy") || o.id === "underetasje").map((o) => o.id);

type Job = { config: HouseConfig; facts: PlotFacts | null; opts: EnergyOptions };

export function useEnergyEstimate(cfg: HouseConfig, plot: Plot | null, facts: PlotFacts | null, opts: EnergyOptions = {}): { estimate: EnergyEstimate; loading: boolean } {
  const prices = opts.prices === "spot2025" ? "spot2025" : "budget";
  const quick = useMemo(() => estimateEnergy(cfg, plot, facts, { prices }), [cfg, plot, facts, prices]);
  // the worker's job, written so that it is also the cache key: only what the estimate depends on
  const key = useMemo(() => {
    const c = resolved(cfg, facts);
    const job: Job = {
      config: { v: 1, plot: plot?.id ?? null, sel: Object.fromEntries(ENERGY_OPTIONS.map((id) => [id, c[id].id])) },
      facts: facts ? { id: facts.id, index: facts.index, lowerFloor: facts.lowerFloor } : null,
      opts: { prices },
    };
    return JSON.stringify(job);
  }, [cfg, plot, facts, prices]);
  const [done, setDone] = useState<{ key: string; estimate: EnergyEstimate | null } | null>(null);

  useEffect(() => {
    let alive = true;
    const job = JSON.parse(key) as Job;
    houseEstimate(key, { ...job, plot }).then(
      (estimate) => { if (alive) setDone({ key, estimate }); },
      // no worker or no weather data: the quick overslag stands, and the page stops waiting
      () => { if (alive) setDone({ key, estimate: null }); },
    );
    return () => { alive = false; };
  }, [key, plot]);

  if (done && done.key === key) return { estimate: done.estimate ?? quick, loading: false };
  return { estimate: done?.estimate ?? quick, loading: true };
}
