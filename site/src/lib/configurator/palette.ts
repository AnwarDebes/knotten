/**
 * The colours the model's example houses wear today, in one place. The 3D kit (components/scene/house/exterior.ts)
 * reads them from here, and the configurator shows them as the "Som i modellen" / "As in the model" choice.
 * Changing a value here changes the 3D picture: keep them as they are unless the model itself should change.
 *
 * Houses take the facade and trim by their index in public/data/plots.json (plot-01 is index 0), cycling
 * through the six stained and painted claddings below.
 */

/** Stained and painted standing cladding: charcoal, weathered grey, white, natural larch, dark green, light grey. */
export const FACADES = ["#3a3f43", "#8d867b", "#e4e1da", "#9b7a55", "#3f4a40", "#c9c6bf"] as const;
/** Corner boards, reveals, fascia, soffits and verges, paired with FACADES by index. */
export const TRIM = ["#2c3033", "#e8e6e1", "#f2f0ec", "#2f3236", "#2b322c", "#f2f0ec"] as const;
export const FACADE_NAMES = [
  { no: "Kull", en: "Charcoal" },
  { no: "Værgrå", en: "Weathered grey" },
  { no: "Kvit", en: "White" },
  { no: "Lerk", en: "Natural larch" },
  { no: "Mørk grønn", en: "Dark green" },
  { no: "Lys grå", en: "Light grey" },
] as const;

/** Window and door frames on every house. */
export const FRAME = "#2b2f33";
/** Standing-seam steel roof on every house. */
export const ROOF = "#2c3034";
/** 430 Wp modules the model lays on each view-side roof today (16 x 0.43 = 6.88 kWp). */
export const MODEL_MODULES = 16;
/** Modules that fit on the view-side slope (2 rows of 9). */
export const MAX_MODULES = 18;

/** Index of a plot ("plot-07" -> 6), or -1. */
export function plotIndex(plotId: string | null | undefined): number {
  const m = /^plot-(\d{2})$/.exec(plotId ?? "");
  return m ? Number(m[1]) - 1 : -1;
}

/** The look a house has in the model today. */
export function modelLook(index: number) {
  const i = ((index % FACADES.length) + FACADES.length) % FACADES.length;
  return { facade: FACADES[i], trim: TRIM[i], facadeName: FACADE_NAMES[i], frame: FRAME, roof: ROOF, modules: MODEL_MODULES };
}
