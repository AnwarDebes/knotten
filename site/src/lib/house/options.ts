/**
 * What the 3D model draws for one configured house: the configurator's choices (src/lib/configurator)
 * read as plain drawing parameters. The standard choice of every option gives STANDARD, which draws
 * the house exactly as the model shows it today.
 *
 * Colours are #rrggbb (sRGB, as the swatches); null means "as in the model", where each house keeps
 * the colours the model gives it (src/lib/configurator/palette.ts).
 */
import { FACADES, MAX_MODULES, MODEL_MODULES, TRIM } from "@/lib/configurator/palette";
import type { Choice } from "@/lib/configurator/types";

export type Cladding = "board-on-board" | "vertical-flush" | "horizontal";
export type RoofStyle = "seam" | "tile" | "sedum-north";
export type Railing = "glass" | "timber" | "steel";
export type Parking = "space" | "carport" | "carport-pv";
export type LowerVariant = "finished" | "three-bedrooms" | "rental" | "shell";
export type Stove = "none" | "chimney" | "stove";

export type HouseOptions = {
  /** the plan mirrored relative to the field plan */
  flip: boolean;
  facade: string | null;
  trim: string | null;
  frame: string | null;
  cladding: Cladding;
  roof: RoofStyle;
  roofColour: string | null;
  /** 430 Wp modules on the view-side roof (0 to MAX_MODULES) */
  modules: number;
  /** the panels are the roof: the whole south slope is black glass */
  integrated: boolean;
  chargers: 0 | 1 | 2;
  stove: Stove;
  terrace: "model" | "large";
  railing: Railing;
  deck: string | null;
  parking: Parking;
  lower: LowerVariant;
  // ---- inside
  floor: string | null;
  plank: "model" | "wide";
  wall: string | null;
  kitchen: string | null;
  worktop: string | null;
  bath: "model" | "large" | "dark";
  bathColour: string | null;
};

export const STANDARD: HouseOptions = {
  flip: false, facade: null, trim: null, frame: null, cladding: "board-on-board", roof: "seam", roofColour: null,
  modules: MODEL_MODULES, integrated: false, chargers: 1, stove: "none", terrace: "model", railing: "glass", deck: null,
  parking: "space", lower: "finished", floor: null, plank: "model", wall: null, kitchen: null, worktop: null, bath: "model", bathColour: null,
};

/** Terrace depth in metres (the model's 3 m, or 4.5 m). */
export const terraceDepth = (o: HouseOptions) => (o.terrace === "large" ? 4.5 : 3.0);

const hex = (v: unknown) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null);

/**
 * The trim that goes with a facade colour. The model pairs each of its six claddings with a trim
 * (palette.ts); any other facade colour gets a deeper shade of itself, as the model's dark claddings do.
 */
export function trimFor(facade: string | null): string | null {
  if (!facade) return null;
  const k = FACADES.findIndex((f) => f.toLowerCase() === facade.toLowerCase());
  if (k >= 0) return TRIM[k];
  const n = parseInt(facade.slice(1), 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) * 0.72).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

/** The drawing parameters for a house, from the configurator's resolved choices (state.ts resolved()). */
export function houseOptions(r: Record<string, Choice | undefined>): HouseOptions {
  const p = (id: string) => r[id]?.params ?? {};
  const o: HouseOptions = { ...STANDARD };
  o.flip = p("speilvendt").mirror === "flip";
  o.facade = hex(p("farge").facade);
  o.trim = trimFor(o.facade);
  o.frame = hex(p("vinduer").frame);
  const pat = p("kledning").pattern;
  o.cladding = pat === "vertical-flush" || pat === "horizontal" ? pat : "board-on-board";
  const roof = p("tak").roof;
  o.roof = roof === "tile" ? "tile" : roof === "sedum-north" ? "sedum-north" : "seam";
  o.roofColour = hex(p("tak").roofColour);
  const m = Number(p("solceller").modules ?? MODEL_MODULES);
  o.modules = Number.isFinite(m) ? Math.max(0, Math.min(MAX_MODULES, Math.round(m))) : MODEL_MODULES;
  o.integrated = p("solceller").integrated === true;
  const ch = Number(p("lading").chargers ?? 1);
  o.chargers = ch === 0 ? 0 : ch === 2 ? 2 : 1;
  const st = p("ildsted").stove;
  o.stove = st === "chimney" || st === "stove" ? st : "none";
  o.terrace = p("terrasse").terrace === "large" ? "large" : "model";
  const rail = p("rekkverk").railing;
  o.railing = rail === "timber" || rail === "steel" ? rail : "glass";
  o.deck = hex(p("terrassebord").deck);
  const park = p("parkering").parking;
  o.parking = park === "carport" || park === "carport-pv" ? park : "space";
  const low = p("underetasje").lower;
  o.lower = low === "three-bedrooms" || low === "rental" || low === "shell" ? low : "finished";
  o.floor = hex(p("gulv").floor);
  o.plank = p("gulv").plank === "wide" ? "wide" : "model";
  o.wall = hex(p("vegger").wall);
  o.kitchen = hex(p("kjokken").kitchen);
  o.worktop = hex(p("benkeplate").worktop);
  const bath = p("bad").bath;
  o.bath = bath === "large" ? "large" : hex(bath) ? "dark" : "model";
  o.bathColour = hex(bath);
  return o;
}

/** True when the house needs geometry of its own (the overlay house): anything the shaders alone cannot draw. */
export function needsOwnGeometry(o: HouseOptions) {
  return o.flip || o.terrace !== "model" || o.railing !== "glass" || o.parking !== "space" || o.chargers !== 1 || o.stove !== "none" || o.lower === "rental";
}

/** True when the inside differs from the model's. */
export function customInterior(o: HouseOptions) {
  return o.flip || o.lower !== "finished" || o.stove !== "none" || o.terrace !== "model" || !!o.floor || o.plank !== "model" || !!o.wall || !!o.kitchen || !!o.worktop || o.bath !== "model";
}

/** A stable key of what the house's own geometry depends on (rebuild when it changes). */
export function geometryKey(o: HouseOptions) {
  return [o.flip, o.terrace, o.railing, o.parking, o.chargers, o.stove, o.lower].join("|");
}

/** A stable key of what the inside depends on. */
export function interiorKey(o: HouseOptions) {
  return [o.flip, o.lower, o.stove, o.terrace, o.floor, o.plank, o.wall, o.kitchen, o.worktop, o.bath, o.bathColour].join("|");
}
