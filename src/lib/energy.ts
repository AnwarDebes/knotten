/**
 * Indicative energy and savings model for the Knotten homes. Pure and
 * stateless: no personal data, no side effects. Every figure is an indicative
 * estimate anchored to the verified research (see docs/research), and the
 * assumptions are exported so the UI can show them with their sources. This is
 * not professional energy modelling and not a guarantee.
 */

export type Orientation = "soer" | "oestVest" | "nord";
export type Household = "small" | "medium" | "large";

export type EnergyInput = {
  areaM2: number;
  orientation: Orientation;
  household: Household;
  ev: boolean;
  battery: boolean;
};

export type EnergyResult = {
  annualDemandKwh: number;
  pvKwp: number;
  annualProductionKwh: number;
  selfConsumedKwh: number;
  selfSufficiency: number; // 0..1
  annualSavingsNok: number;
  resilienceHours: number;
};

/** Indicative assumptions, with the research note each is anchored to. */
export const ASSUMPTIONS = {
  // Passivhus net heating about 15 kWh/m2 per year; with a heat pump (COP ~3)
  // the delivered electricity for heating is about 5 kWh/m2 per year.
  heatingElPerM2: 5,
  // Household electricity (appliances, hot water, lighting), indicative SSB level.
  householdKwh: { small: 4000, medium: 6000, large: 8000 } as Record<Household, number>,
  // An electric car, about 15000 km per year at 0.2 kWh/km.
  evKwh: 3000,
  // Solar yield about 1010 kWh/kWp per year (PVGIS, south). Orientation factor.
  pvYieldPerKwp: 1010,
  orientationFactor: { soer: 1, oestVest: 0.85, nord: 0.6 } as Record<Orientation, number>,
  // Indicative system size from the home size (roof area), clamped.
  pvKwpPerM2: 1 / 22,
  pvKwpMin: 3,
  pvKwpMax: 12,
  // Share of solar production used on site: lower without storage, higher with a battery.
  selfConsumptionRate: { noBattery: 0.32, battery: 0.6 },
  // Avoided cost per self-consumed kWh: spot plus grid tariff plus levies that a
  // plusskunde avoids on power used behind the meter. Indicative NO2, after the
  // current support schemes.
  avoidedCostPerKwh: 1.4,
  // Battery size if chosen, and the critical load it keeps running in an outage.
  batteryKwh: 10,
  batteryUsable: 0.9,
  criticalLoadKw: 0.7,
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, step = 1) => Math.round(value / step) * step;

export function computeEnergy(input: EnergyInput): EnergyResult {
  const a = ASSUMPTIONS;

  const heating = input.areaM2 * a.heatingElPerM2;
  const household = a.householdKwh[input.household];
  const ev = input.ev ? a.evKwh : 0;
  const annualDemandKwh = round(heating + household + ev, 100);

  const pvKwp = round(clamp(input.areaM2 * a.pvKwpPerM2, a.pvKwpMin, a.pvKwpMax), 0.5);
  const annualProductionKwh = round(
    pvKwp * a.pvYieldPerKwp * a.orientationFactor[input.orientation],
    100,
  );

  const rate = input.battery ? a.selfConsumptionRate.battery : a.selfConsumptionRate.noBattery;
  const selfConsumedKwh = round(Math.min(annualDemandKwh, annualProductionKwh * rate), 100);

  const selfSufficiency = annualDemandKwh > 0 ? selfConsumedKwh / annualDemandKwh : 0;
  const annualSavingsNok = round(selfConsumedKwh * a.avoidedCostPerKwh, 100);
  const resilienceHours = input.battery
    ? round((a.batteryKwh * a.batteryUsable) / a.criticalLoadKw)
    : 0;

  return {
    annualDemandKwh,
    pvKwp,
    annualProductionKwh,
    selfConsumedKwh,
    selfSufficiency,
    annualSavingsNok,
    resilienceHours,
  };
}
