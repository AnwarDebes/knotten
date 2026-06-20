/**
 * Price-resilience model for NO2. The frame is exposure and independence, never
 * a guaranteed saving: it shows how a low-energy, self-producing, battery-backed
 * home draws less from the grid and shifts what it does draw to cheaper hours,
 * across real historical spot prices. All figures are indicative estimates.
 *
 * Prices in are NOK/kWh excluding VAT (the hvakosterstrommen.no convention and
 * the basis the strømstøtte threshold is defined on). Consumer-facing prices add
 * 25% VAT plus an indicative grid tariff. Support schemes follow
 * docs/research/strompris-og-stotteordninger.md.
 */

export type Scheme = "stromstotte" | "norgespris";

export const PRICE_ASSUMPTIONS = {
  vat: 0.25,
  // Ordinær strømstøtte: state covers 90% of spot above 77 øre/kWh ex VAT.
  stotteThresholdExVat: 0.77,
  stotteCoverage: 0.9,
  // Norgespris: optional fixed 50 øre/kWh incl VAT.
  norgesprisInclVat: 0.5,
  // Indicative nettleie + avgifter (energiledd + elavgift), NOK/kWh incl VAT.
  gridTariffInclVat: 0.4,
  monthlyCapKwh: 5000,
} as const;

/** Consumer energy price (NOK/kWh incl VAT) for one grid-drawn kWh, excluding grid tariff. */
export function energyPriceInclVat(spotExVat: number, scheme: Scheme): number {
  if (scheme === "norgespris") return PRICE_ASSUMPTIONS.norgesprisInclVat;
  const stotte =
    PRICE_ASSUMPTIONS.stotteCoverage *
    Math.max(0, spotExVat - PRICE_ASSUMPTIONS.stotteThresholdExVat);
  const afterSupport = Math.max(0, spotExVat - stotte);
  return afterSupport * (1 + PRICE_ASSUMPTIONS.vat);
}

/** Full consumer price per grid-drawn kWh (energy incl VAT plus grid tariff). */
export function consumerPricePerKwh(spotExVat: number, scheme: Scheme): number {
  return energyPriceInclVat(spotExVat, scheme) + PRICE_ASSUMPTIONS.gridTariffInclVat;
}

export type HomeProfile = {
  /** Total electricity demand over the period (kWh). */
  periodDemandKwh: number;
  /** Share of demand covered behind the meter by own solar (0..1); avoids all cost. */
  selfCoverShare: number;
  /** Usable battery capacity (kWh); 0 means no battery. */
  batteryKwh: number;
};

export type ExposureResult = {
  selfCoveredKwh: number;
  gridDrawKwh: number;
  selfCoveredShare: number;
  /** Total grid cost over the period, per scheme (NOK). */
  cost: Record<Scheme, number>;
  /** Cost incurred during the most expensive tenth of hours, per scheme (NOK). */
  spikeCost: Record<Scheme, number>;
};

const SPIKE_FRACTION = 0.1;

/**
 * Battery benefit for one day: shift up to the usable capacity from the most
 * expensive hours to the cheapest, limited per hour by that hour's grid demand
 * (a proxy for power limits). Returns the consumer-cost saving for the day.
 */
function batterySavingForDay(
  dayPrices: number[],
  demandPerHour: number,
  capKwh: number,
  scheme: Scheme,
): number {
  if (capKwh <= 0 || demandPerHour <= 0) return 0;
  const cp = dayPrices.map((p) => consumerPricePerKwh(p, scheme));
  const peak = [...cp.keys()].sort((a, b) => cp[b]! - cp[a]!);
  const cheap = [...cp.keys()].sort((a, b) => cp[a]! - cp[b]!);
  const removable = cp.map(() => demandPerHour);
  const addable = cp.map(() => demandPerHour);
  let toMove = capKwh;
  let saved = 0;
  let pi = 0;
  let ai = 0;
  while (toMove > 1e-9 && pi < peak.length && ai < cheap.length) {
    const hi = peak[pi]!;
    const lo = cheap[ai]!;
    if (hi === lo) break;
    const delta = cp[hi]! - cp[lo]!;
    if (delta <= 0) break;
    const m = Math.min(toMove, removable[hi]!, addable[lo]!);
    if (m <= 1e-9) {
      if (removable[hi]! <= 1e-9) pi++;
      else ai++;
      continue;
    }
    saved += m * delta;
    removable[hi]! -= m;
    addable[lo]! -= m;
    toMove -= m;
    if (removable[hi]! <= 1e-9) pi++;
    if (addable[lo]! <= 1e-9) ai++;
  }
  return saved;
}

/** Compute grid exposure for a home over a period of hourly ex-VAT spot prices. */
export function computeExposure(pricesExVat: number[], home: HomeProfile): ExposureResult {
  const hours = pricesExVat.length;
  const share = Math.min(1, Math.max(0, home.selfCoverShare));
  const selfCoveredKwh = home.periodDemandKwh * share;
  const gridDrawKwh = home.periodDemandKwh - selfCoveredKwh;
  const demandPerHour = hours > 0 ? gridDrawKwh / hours : 0;

  const schemes: Scheme[] = ["stromstotte", "norgespris"];
  const cost: Record<Scheme, number> = { stromstotte: 0, norgespris: 0 };
  const spikeCost: Record<Scheme, number> = { stromstotte: 0, norgespris: 0 };

  // Threshold price for the most expensive tenth of hours.
  const sortedDesc = [...pricesExVat].sort((a, b) => b - a);
  const spikeCount = Math.max(1, Math.floor(hours * SPIKE_FRACTION));
  const spikeThreshold = sortedDesc[spikeCount - 1] ?? Infinity;

  for (const scheme of schemes) {
    let base = 0;
    for (const p of pricesExVat) {
      const c = demandPerHour * consumerPricePerKwh(p, scheme);
      base += c;
      if (p >= spikeThreshold) spikeCost[scheme] += c;
    }
    // Apply battery hour-shifting day by day.
    let batterySaving = 0;
    if (home.batteryKwh > 0) {
      for (let i = 0; i < hours; i += 24) {
        batterySaving += batterySavingForDay(
          pricesExVat.slice(i, i + 24),
          demandPerHour,
          home.batteryKwh,
          scheme,
        );
      }
    }
    cost[scheme] = Math.max(0, base - batterySaving);
  }

  return {
    selfCoveredKwh,
    gridDrawKwh,
    selfCoveredShare: share,
    cost,
    spikeCost,
  };
}

/** Pick the cheaper scheme for a result (what a rational household would choose). */
export function bestScheme(result: ExposureResult): Scheme {
  return result.cost.norgespris < result.cost.stromstotte ? "norgespris" : "stromstotte";
}
