import { fmt, type Lang, type T } from "@/lib/facts";
import { plotName, plotNo, rowLabel } from "@/lib/format";
import type { Plot, SunDay } from "@/lib/types";
// which plots have a still of their view (written with the stills; read when the site is built)
import STILLS from "../../../public/renders/plots/index.json";

/**
 * The words and the small sums both designs use for a plot: its status and price as the administrator set them
 * (Tomter og priser in the portal), the sort orders of the plot lists, the one-line description for search engines
 * and link previews, and the neighbours. No Node or browser imports: the pages and the plot picker both read it.
 */
export type PlotStatus = "available" | "reserved" | "sold" | "unreleased";

export const STATUS_TEXT: Record<PlotStatus, T> = {
  unreleased: { no: "Ikke sluppet", en: "Unreleased" },
  available: { no: "Ledig", en: "Available" },
  reserved: { no: "Reservert", en: "Reserved" },
  sold: { no: "Solgt", en: "Sold" },
};

/** Until the administrator sets a price, a plot says so in these words (no invented prices). */
export const ON_REQUEST: T = { no: "Pris på forespørsel", en: "Price on request" };

/** "1 250 000 kr", or "Pris på forespørsel" when no price is set. */
export function priceText(price: number | undefined, lang: Lang): string {
  return price ? `${fmt(price, lang)} kr` : ON_REQUEST[lang];
}

/** The plot's number with two digits, as the Klassisk addresses and the links into the forms carry it: "07". */
export const plotNr = (id: string) => id.replace("plot-", "");

/** The sort orders of the plot lists in both designs. "row" is the plots' own order, row by row, west to east. */
export type PlotSort = "row" | "dec" | "sea" | "height";

/** `short`: the same order named for a narrow panel (the Klassisk plot picker). */
export const SORTS: { key: PlotSort; label: T; short: T }[] = [
  { key: "row", label: { no: "Rekke", en: "Row" }, short: { no: "Rekke", en: "Row" } },
  { key: "dec", label: { no: "Sol 21. desember", en: "Sun 21 December" }, short: { no: "Sol 21. des", en: "Sun 21 Dec" } },
  { key: "sea", label: { no: "Sjø i sikt", en: "Water in view" }, short: { no: "Sjø i sikt", en: "Water" } },
  { key: "height", label: { no: "Høyde", en: "Elevation" }, short: { no: "Høyde", en: "Elevation" } },
];

export function isSort(v: unknown): v is PlotSort {
  return v === "row" || v === "dec" || v === "sea" || v === "height";
}

/** Sorted copy: most winter sun, most water in view or highest first; "row" keeps the plots' own order. */
export function sortPlots<P extends { id: string; dec: number; water: number; ground: number }>(list: P[], by: PlotSort): P[] {
  const out = [...list];
  if (by === "dec") out.sort((a, b) => b.dec - a.dec);
  else if (by === "sea") out.sort((a, b) => b.water - a.water);
  else if (by === "height") out.sort((a, b) => b.ground - a.ground);
  else out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

/** What the plot lists need of a plot, small enough to send to the browser with every plot on it. */
export type PlotSummary = {
  id: string;
  n: number;
  nr: string;
  row: string;
  ground: number;
  floor: number;
  slope: number;
  facing: number;
  /** hours of sun on 21 December, the sort key */
  dec: number;
  sun: { dec: SunDay; mar: SunDay; jun: SunDay };
  water: number;
  openSea: boolean;
  openSeaDeg: number;
  farthestKm: number;
  note: T | null;
  status: PlotStatus;
  price?: number;
  /** the model's still of the view from the plot, and where it looks */
  still: { src: string; bearing: number } | null;
};

export function plotSummary(p: Plot, c: { status: PlotStatus; price_nok?: number } | undefined): PlotSummary {
  return {
    id: p.id,
    n: Number(plotNo(p.id)),
    nr: plotNr(p.id),
    row: rowLabel(p),
    ground: p.local.z_ground,
    floor: p.local.z_floor,
    slope: p.terrain.slope_deg,
    facing: p.house.facing_deg,
    dec: p.sun.dec21.hours,
    sun: { dec: p.sun.dec21, mar: p.sun.mar21, jun: p.sun.jun21 },
    water: p.view.water_visible_deg,
    openSea: p.view.open_sea_visible,
    openSeaDeg: p.view.open_sea_deg,
    farthestKm: p.view.farthest_water_m / 1000,
    note: p.terrain.note ?? null,
    status: c?.status ?? "unreleased",
    ...(c?.price_nok ? { price: c.price_nok } : {}),
    still: (() => { const v = plotStill(p, "no"); return v ? { src: v.src, bearing: v.bearing } : null; })(),
  };
}

/** The one line for search engines and link previews, the same in both designs. */
export function plotDescription(p: Plot, lang: Lang): string {
  const no = lang === "no";
  const h = fmt(p.sun.dec21.hours, lang, 1);
  return no
    ? `${plotName(p.id, true)} på Knotten. Sol 21. desember: ${h} timer. Sjø i sikt: ${p.view.water_visible_deg} grader.${p.view.open_sea_visible ? " Åpent hav i sikt." : ""}`
    : `${plotName(p.id, false)} at Knotten. Sun 21 December: ${h} hours. Water in view: ${p.view.water_visible_deg} degrees.${p.view.open_sea_visible ? " Open sea in view." : ""}`;
}

/** The plots before and after this one, and the others in its row (the plots are numbered row by row). */
export function neighbours<P extends { id: string; row_label?: string; row: number }>(plots: P[], id: string): { prev: P | null; next: P | null; row: P[] } {
  const i = plots.findIndex((p) => p.id === id);
  const me = plots[i];
  return {
    prev: i > 0 ? plots[i - 1] : null,
    next: i >= 0 && i < plots.length - 1 ? plots[i + 1] : null,
    row: me ? plots.filter((p) => p.id !== id && rowLabel(p) === rowLabel(me)) : [],
  };
}

/**
 * The model's still of the view from a plot (public/renders/plots, E1): rendered from the 3D twin with the scene's own
 * camera for standing on the plot (in front of the house, 1.6 m over the floor, looking at the middle of the water in
 * view), on 21 June at 15:00, with the field built as in the model's proposal. Null for a plot without one.
 */
export type PlotStill = { src: string; w: number; h: number; bearing: number; alt: string; caption: string };

export function plotStill(p: Plot, lang: Lang): PlotStill | null {
  if (!(STILLS.plots as string[]).includes(p.id)) return null;
  const wb = p.view.water_bearings;
  const bearing = Math.round(((wb ? (wb[0] + wb[1]) / 2 : p.house.facing_deg) + 360) % 360);
  const no = lang === "no";
  const name = plotName(p.id, no);
  const eye = fmt(STILLS.eye_above_floor_m, lang, 1);
  return {
    src: `/renders/plots/${p.id}.webp`,
    w: STILLS.w,
    h: STILLS.h,
    bearing,
    alt: no
      ? `Utsikten fra ${name.toLowerCase()} i 3D-modellen, mot ${bearing} grader: sjø i sikt over ${p.view.water_visible_deg} grader${p.view.open_sea_visible ? ", med åpent hav" : ""}, og nabohusene i forslaget`
      : `The view from ${name.toLowerCase()} in the 3D model, towards ${bearing} degrees: water in view across ${p.view.water_visible_deg} degrees${p.view.open_sea_visible ? ", with open sea" : ""}, and the neighbouring houses of the proposal`,
    caption: no
      ? `Et bilde fra 3D-modellen, ikke et fotografi: foran huset, ${eye} m over gulvnivå, mot ${bearing} grader, 21. juni kl. 15.00. Feltet er bygget ut som i modellens forslag, med nabohusene, og trærne i siktlinjen fra stua er ryddet. Terrenget er Kartverkets laserdata.`
      : `A picture from the 3D model, not a photograph: in front of the house, ${eye} m above the floor level, towards ${bearing} degrees, 21 June at 15:00. The field is built as in the model's proposal, with the neighbouring houses, and the trees in the sight line from the living room are cleared. The terrain is Kartverket's laser data.`,
  };
}

/** The still's heading in both designs. */
export const STILL_TITLE: T = { no: "Modellbilde fra tomten", en: "Model view from the plot" };
