/**
 * Placeholder plots for the 3D terrain map. Positions are normalised terrain
 * coordinates (u east, v south, both 0..1) chosen on the real hillside with a
 * sea view. These are ILLUSTRATIVE: the number of plots, their boundaries,
 * prices and views are unknown until the survey and zoning are done. Editable
 * later via the content layer (SPEC-09).
 */
export type PlotStatus = "ledig" | "reservert" | "solgt";

export type Plot = {
  id: string;
  code: string;
  u: number;
  v: number;
  status: PlotStatus;
};

export const PLOTS: Plot[] = [
  { id: "a1", code: "A1", u: 0.3, v: 0.62, status: "ledig" },
  { id: "a2", code: "A2", u: 0.34, v: 0.66, status: "ledig" },
  { id: "a3", code: "A3", u: 0.385, v: 0.63, status: "reservert" },
  { id: "b1", code: "B1", u: 0.78, v: 0.4, status: "ledig" },
  { id: "b2", code: "B2", u: 0.82, v: 0.44, status: "ledig" },
  { id: "b3", code: "B3", u: 0.75, v: 0.45, status: "solgt" },
];
