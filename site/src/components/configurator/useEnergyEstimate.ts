"use client";

/**
 * The configured house's energy figures for the configurator pages (both designs).
 *
 * CONTRACT STUB: returns the quick budget estimate. The configurator-model stream replaces the body with the
 * hourly simulation for this house and plot (it may load the weather year and run in a worker; while it works,
 * `loading` is true and `estimate` holds the last result or the quick estimate). Keep the signature and the
 * return shape: the pages only call this hook.
 */
import { useMemo } from "react";
import { estimateEnergy } from "@/lib/configurator/energy";
import type { PlotFacts } from "@/lib/configurator/state";
import type { EnergyEstimate, EnergyOptions, HouseConfig } from "@/lib/configurator/types";
import type { Plot } from "@/lib/types";

export function useEnergyEstimate(cfg: HouseConfig, plot: Plot | null, facts: PlotFacts | null, opts: EnergyOptions = {}): { estimate: EnergyEstimate; loading: boolean } {
  const prices = opts.prices;
  const estimate = useMemo(() => estimateEnergy(cfg, plot, facts, { prices }), [cfg, plot, facts, prices]);
  return { estimate, loading: false };
}
