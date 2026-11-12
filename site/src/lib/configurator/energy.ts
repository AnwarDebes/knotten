/**
 * Energy estimate for one configured house on its plot, a year of model figures.
 *
 * CONTRACT STUB: a rough budget-based estimate so pages can be built against the shape. The configurator-model
 * stream replaces the body with the hourly simulation (src/lib/sim) for this house and plot. Keep the signature.
 */
import { BUDGET } from "@/lib/facts";
import type { Plot } from "@/lib/types";
import { resolved, type PlotFacts } from "./state";
import type { EnergyEstimate, EnergyOptions, HouseConfig } from "./types";

const MODULE_KWP = 0.43;

export function estimateEnergy(cfg: HouseConfig, plot: Plot | null, facts: PlotFacts | null = null, opts: EnergyOptions = {}): EnergyEstimate {
  void plot;
  void opts;
  const c = resolved(cfg, facts);
  const modules = Number(c.solceller?.params?.modules ?? 16);
  const pvKwp = Math.round(modules * MODULE_KWP * 100) / 100;
  const pvKwh = Math.round(pvKwp * BUDGET.pv.yield_kwh_per_kwp * (BUDGET.pv.system_eff_pct / 100));
  const householdKwh = BUDGET.el_per_home_kwh;
  const heatElKwh = Math.round(BUDGET.heat_per_home_kwh / BUDGET.bedrock.scop);
  const evKwh = Number(c.lading?.params?.chargers ?? 0) * 2500;
  const useKwh = householdKwh + heatElKwh + evKwh;
  const battery = Number(c.batteri?.params?.batteryKwh ?? 0);
  const selfUsePct = Math.min(95, 35 + battery * 2.2);
  const used = Math.round((pvKwh * selfUsePct) / 100);
  return {
    pvKwp, pvKwh, householdKwh, heatElKwh, evKwh, useKwh,
    selfUsePct: Math.round(selfUsePct),
    selfSufficiencyPct: Math.round((used / useKwh) * 100),
    importKwh: Math.max(0, useKwh - used),
    exportKwh: Math.max(0, pvKwh - used),
    costNok: null,
    referenceCostNok: null,
    outageHours: null,
    provisional: true,
    method: { no: "Foreløpig overslag fra energiregnskapet.", en: "Provisional estimate from the energy budget." },
  };
}
