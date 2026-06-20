import type { Orientation } from "@/lib/energy";

/**
 * Placeholder house types for the configurator. Clearly indicative until the
 * developer supplies real types (INPUTS-NEEDED item 4): adding a real type here
 * needs no code change. The energy standard is the passivhus baseline (net
 * heating about 15 kWh/m2 per year for larger homes).
 */
export type HouseType = {
  id: string;
  nameNo: string;
  nameEn: string;
  heatedAreaM2: number;
  footprintM2: number;
  defaultOrientation: Orientation;
  solar: { min: number; max: number; default: number };
  battery: { min: number; max: number; default: number };
};

export const HOUSE_TYPES: HouseType[] = [
  {
    id: "kompakt",
    nameNo: "Kompakt (placeholder)",
    nameEn: "Compact (placeholder)",
    heatedAreaM2: 110,
    footprintM2: 70,
    defaultOrientation: "soer",
    solar: { min: 3, max: 8, default: 5 },
    battery: { min: 0, max: 15, default: 5 },
  },
  {
    id: "familie",
    nameNo: "Familie (placeholder)",
    nameEn: "Family (placeholder)",
    heatedAreaM2: 150,
    footprintM2: 95,
    defaultOrientation: "soer",
    solar: { min: 4, max: 10, default: 7 },
    battery: { min: 0, max: 20, default: 10 },
  },
  {
    id: "romslig",
    nameNo: "Romslig (placeholder)",
    nameEn: "Spacious (placeholder)",
    heatedAreaM2: 190,
    footprintM2: 120,
    defaultOrientation: "oestVest",
    solar: { min: 5, max: 12, default: 9 },
    battery: { min: 0, max: 25, default: 12 },
  },
];
