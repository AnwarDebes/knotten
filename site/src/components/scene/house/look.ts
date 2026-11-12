/**
 * Each house's look, as a small float texture the house materials read (one column per house, one
 * row per property), so one house can wear other colours, another cladding or roof, more or fewer
 * solar modules, or be hidden (when its own geometry is drawn apart), without the 30 merged houses
 * being rebuilt or sent to the GPU again. A change is a few numbers and one small upload.
 *
 * Every override has a flag; with the flags off a house is drawn exactly as before (its colours are
 * the vertex colours the kit gave it). Colours are linear, as the vertex colours are.
 *
 *   row 0  facade colour, flag         row 5  cladding (0 board on board, 1 vertical tongue and groove,
 *   row 1  trim colour, flag                  2 horizontal), roof (0 standing seam, 1 tiles, 2 sedum on
 *   row 2  window frame colour, flag          the north slope), modules on the roof (0..18), integrated
 *   row 3  roof colour, flag                  solar roof (0 or 1)
 *   row 4  decking colour, flag        row 6  hidden (1: the merged copy is collapsed away)
 *   row 7  the house's own trim colour (to tell trim from the other painted parts)
 *   row 8  the house's own decking colour (the other timber outside keeps its shade relative to it)
 *   row 9  the direction towards the view in the scene (x, z), for telling the roof's two slopes apart
 */
import * as THREE from "three";
import { MODEL_MODULES } from "@/lib/configurator/palette";
import type { HouseOptions } from "@/lib/house/options";
import { markShadowsDirty } from "../twin/shadowState";

export const MAX_HOUSES = 48;
const ROWS = 10;
export const LOOK = { facade: 0, trim: 1, frame: 2, roof: 3, deck: 4, style: 5, flags: 6, trimDefault: 7, deckDefault: 8, dir: 9 } as const;

const data = new Float32Array(MAX_HOUSES * ROWS * 4);
for (let i = 0; i < MAX_HOUSES; i++) data[(LOOK.style * MAX_HOUSES + i) * 4 + 2] = MODEL_MODULES;

export const lookTexture = new THREE.DataTexture(data, MAX_HOUSES, ROWS, THREE.RGBAFormat, THREE.FloatType);
lookTexture.minFilter = THREE.NearestFilter;
lookTexture.magFilter = THREE.NearestFilter;
lookTexture.generateMipmaps = false;
lookTexture.needsUpdate = true;

/** The uniform every house material shares. */
export const houseLookUniform = { value: lookTexture };

/** GLSL: a house's row. */
export const LOOK_GLSL = /* glsl */ `
uniform sampler2D uHouseLook;
vec4 hLook(int house, int row) { return texelFetch(uHouseLook, ivec2(house, row), 0); }
`;

const at = (i: number, row: number) => (row * MAX_HOUSES + i) * 4;
const _c = new THREE.Color();

function put(i: number, row: number, x: number, y: number, z: number, w: number) {
  const k = at(i, row);
  if (data[k] === x && data[k + 1] === y && data[k + 2] === z && data[k + 3] === w) return false;
  data[k] = x; data[k + 1] = y; data[k + 2] = z; data[k + 3] = w;
  return true;
}
function colour(i: number, row: number, hex: string | null) {
  if (!hex) return put(i, row, 0, 0, 0, 0);
  _c.set(hex);
  return put(i, row, _c.r, _c.g, _c.b, 1);
}
function changed(shadows: boolean) {
  lookTexture.needsUpdate = true;
  if (shadows) markShadowsDirty();
}

/** What every house is in the model: its own trim and decking colours, and which way it faces. */
export function setHouseDefaults(i: number, trim: string, deck: string, facingDeg: number) {
  if (i < 0 || i >= MAX_HOUSES) return;
  _c.set(trim);
  let ch = put(i, LOOK.trimDefault, _c.r, _c.g, _c.b, 0);
  _c.set(deck);
  ch = put(i, LOOK.deckDefault, _c.r, _c.g, _c.b, 0) || ch;
  const f = (facingDeg * Math.PI) / 180;
  ch = put(i, LOOK.dir, Math.sin(f), -Math.cos(f), 0, 0) || ch;
  if (ch) changed(false);
}

const cladCode = { "board-on-board": 0, "vertical-flush": 1, horizontal: 2 } as const;
const roofCode = { seam: 0, tile: 1, "sedum-north": 2 } as const;

/** One house's chosen look (null: as in the model). The module count is set apart (setModules). */
export function setHouseLook(i: number, o: HouseOptions | null) {
  if (i < 0 || i >= MAX_HOUSES) return;
  let ch = colour(i, LOOK.facade, o?.facade ?? null);
  ch = colour(i, LOOK.trim, o?.trim ?? null) || ch;
  ch = colour(i, LOOK.frame, o?.frame ?? null) || ch;
  ch = colour(i, LOOK.roof, o?.roofColour ?? null) || ch;
  ch = colour(i, LOOK.deck, o?.deck ?? null) || ch;
  const k = at(i, LOOK.style);
  const modules = data[k + 2];
  const integrated = o?.integrated ? 1 : 0;
  const shadow = data[k + 3] !== integrated;
  ch = put(i, LOOK.style, o ? cladCode[o.cladding] : 0, o ? roofCode[o.roof] : 0, modules, integrated) || ch;
  if (ch) changed(shadow);
}

/** The modules on a house's roof (the merged roofs carry 18 places and show this many). */
export function setModules(i: number, n: number) {
  if (i < 0 || i >= MAX_HOUSES) return;
  const k = at(i, LOOK.style);
  const v = Math.max(0, Math.min(18, Math.round(n)));
  if (data[k + 2] === v) return;
  data[k + 2] = v;
  changed(true);
}

/** Hide a house's merged copy (its own geometry is drawn instead), or show it again. */
export function setHidden(i: number, hidden: boolean) {
  if (i < 0 || i >= MAX_HOUSES) return;
  if (put(i, LOOK.flags, hidden ? 1 : 0, 0, 0, 0)) changed(true);
}

export function isHidden(i: number) {
  return i >= 0 && i < MAX_HOUSES && data[at(i, LOOK.flags)] > 0.5;
}

export function modulesOf(i: number) {
  return i >= 0 && i < MAX_HOUSES ? data[at(i, LOOK.style) + 2] : MODEL_MODULES;
}
