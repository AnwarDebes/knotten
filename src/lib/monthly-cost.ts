import { consumerPricePerKwh, type Scheme } from "./price-resilience";

/**
 * Total monthly cost of ownership, indicative only and never a loan offer. The
 * energy line reuses the SPEC-10 scheme pricing so figures stay consistent with
 * the price-resilience tool; the loan line is a standard annuity. The Knotten
 * home is compared to a conventional home on identical loan terms, so only the
 * energy line differs and the energy advantage is isolated honestly.
 */

export const MONTHLY_ASSUMPTIONS = {
  // Indicative recent NO2 average spot price (NOK/kWh ex VAT), excluding the
  // 2022 crisis peak. Editable via CMS-lite; shown with its source and date.
  annualAvgSpotExVat: 0.8,
  // Conventional new home: SSB household baseline (about 14,700 kWh/year, 2024).
  conventionalAnnualKwh: 14700,
  // Share of the conventional home's use it cannot self-cover (no solar).
  conventionalSelfCover: 0,
} as const;

/** Standard annuity monthly payment. Handles a 0% rate without dividing by zero. */
export function annuityMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  years: number,
): number {
  if (principal <= 0 || years <= 0) return 0;
  const n = years * 12;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/** Cheaper consumer price per kWh at a given spot, across the two support schemes. */
export function bestPricePerKwh(spotExVat: number): { price: number; scheme: Scheme } {
  const stotte = consumerPricePerKwh(spotExVat, "stromstotte");
  const norge = consumerPricePerKwh(spotExVat, "norgespris");
  return norge < stotte
    ? { price: norge, scheme: "norgespris" }
    : { price: stotte, scheme: "stromstotte" };
}

/**
 * Indicative annual energy cost (NOK). Self-consumed kWh behind the meter avoid
 * all grid cost; the rest is priced at the cheaper support scheme.
 */
export function annualEnergyCost(
  annualDemandKwh: number,
  selfCoverShare: number,
  spotExVat = MONTHLY_ASSUMPTIONS.annualAvgSpotExVat,
): number {
  const gridDraw = annualDemandKwh * (1 - Math.min(1, Math.max(0, selfCoverShare)));
  return gridDraw * bestPricePerKwh(spotExVat).price;
}

export type MonthlyCostInput = {
  kjopesum: number;
  egenkapital: number;
  rentePercent: number;
  lopetidYears: number;
  felleskostnaderPerMonth: number;
  // Knotten home, from the SPEC-05 energy model.
  knottenAnnualKwh: number;
  knottenSelfCover: number;
};

export type SideCost = {
  loanMonthly: number;
  energyMonthly: number;
  felleskostnaderMonthly: number;
  totalMonthly: number;
};

export type MonthlyCostResult = {
  loanPrincipal: number;
  knotten: SideCost;
  conventional: SideCost;
  energyDeltaMonthly: number;
  /** Cumulative energy saving over the horizon (NOK). */
  cumulativeEnergyDelta: (years: number) => number;
};

export function computeMonthlyCost(input: MonthlyCostInput): MonthlyCostResult {
  const principal = Math.max(0, input.kjopesum - input.egenkapital);
  const loanMonthly = annuityMonthlyPayment(principal, input.rentePercent, input.lopetidYears);
  const felles = Math.max(0, input.felleskostnaderPerMonth);

  const knottenEnergyMonthly =
    annualEnergyCost(input.knottenAnnualKwh, input.knottenSelfCover) / 12;
  const conventionalEnergyMonthly =
    annualEnergyCost(
      MONTHLY_ASSUMPTIONS.conventionalAnnualKwh,
      MONTHLY_ASSUMPTIONS.conventionalSelfCover,
    ) / 12;

  const knotten: SideCost = {
    loanMonthly,
    energyMonthly: knottenEnergyMonthly,
    felleskostnaderMonthly: felles,
    totalMonthly: loanMonthly + felles + knottenEnergyMonthly,
  };
  const conventional: SideCost = {
    loanMonthly,
    energyMonthly: conventionalEnergyMonthly,
    felleskostnaderMonthly: felles,
    totalMonthly: loanMonthly + felles + conventionalEnergyMonthly,
  };

  const energyDeltaMonthly = conventionalEnergyMonthly - knottenEnergyMonthly;

  return {
    loanPrincipal: principal,
    knotten,
    conventional,
    energyDeltaMonthly,
    cumulativeEnergyDelta: (years: number) => energyDeltaMonthly * 12 * years,
  };
}

/** Enova grants (verified June 2026, re-verify before publishing amounts). */
export const ENOVA = [
  { key: "solar", rate: 0.25, capLabelNo: "inntil 2 500 kr/kW", capLabelEn: "up to 2,500 kr/kW" },
  { key: "storage", rate: 0.25, capLabelNo: "maks 10 000 kr", capLabelEn: "max 10,000 kr" },
  { key: "waterHeater", rate: 0.25, capLabelNo: "maks 4 000 kr", capLabelEn: "max 4,000 kr" },
] as const;
