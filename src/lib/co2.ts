/**
 * Indicative CO2 estimate for living in an energy-smart home versus a standard
 * reference home, in tonnes CO2-equivalents per year. The method is NS 3720
 * (operational phase only for v1); the energy figures come from the SPEC-05
 * model, so this number is consistent with the savings shown elsewhere. The
 * result depends strongly on the chosen grid emission factor, which is stated
 * openly with a sensitivity range. This is an estimate, not a certification.
 */

// Grid emission factors (kg CO2e per kWh), each cited with its basis. The
// default is an indicative Nordic consumption mix; the Norwegian physical
// production factor is far lower and a European residual mix far higher, so the
// result is shown across this range.
export const CO2_FACTORS = {
  norwayProduction: 0.019,
  nordicMix: 0.13,
  europeanResidual: 0.4,
} as const;

export type FactorKey = keyof typeof CO2_FACTORS;
export const DEFAULT_FACTOR: FactorKey = "nordicMix";

/** Reference standard home: SSB household electricity baseline (about 14,700 kWh/year, 2024). */
export const REFERENCE_ANNUAL_KWH = 14700;

export type Co2Result = {
  smartGridKwh: number;
  referenceGridKwh: number;
  smartTonnes: number;
  referenceTonnes: number;
  savedTonnes: number;
  /** Saved tonnes at the low and high ends of the factor range, for sensitivity. */
  savedLow: number;
  savedHigh: number;
};

function tonnes(kwh: number, factor: number): number {
  return Math.round(((kwh * factor) / 1000) * 100) / 100;
}

/**
 * Annual CO2 comparison. The smart home's grid draw is its demand minus the
 * self-sufficient share (self-consumed solar avoids grid emissions); the
 * reference home draws the full baseline.
 */
export function computeCo2(input: {
  smartDemandKwh: number;
  smartSelfSufficiency: number;
  referenceKwh?: number;
  factor?: number;
}): Co2Result {
  const factor = input.factor ?? CO2_FACTORS[DEFAULT_FACTOR];
  const referenceGridKwh = input.referenceKwh ?? REFERENCE_ANNUAL_KWH;
  const smartGridKwh = Math.round(
    input.smartDemandKwh * (1 - Math.min(1, Math.max(0, input.smartSelfSufficiency))),
  );
  const smartTonnes = tonnes(smartGridKwh, factor);
  const referenceTonnes = tonnes(referenceGridKwh, factor);
  const savedKwh = referenceGridKwh - smartGridKwh;
  return {
    smartGridKwh,
    referenceGridKwh,
    smartTonnes,
    referenceTonnes,
    savedTonnes: Math.round((referenceTonnes - smartTonnes) * 100) / 100,
    savedLow: tonnes(savedKwh, CO2_FACTORS.norwayProduction),
    savedHigh: tonnes(savedKwh, CO2_FACTORS.europeanResidual),
  };
}
