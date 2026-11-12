/**
 * One configured house: from the buyer's choices (lib/house/options.ts) to what the 3D builds for it.
 * The look (colours, cladding, roof, modules) goes to the look texture and needs no geometry; what the
 * shaders cannot draw (mirrored, a deeper terrace, balusters, chargers, a chimney, the rental unit's
 * door, a carport) makes the house's own geometry, drawn in place of its merged copy.
 *
 * The carport is placed beside the house where the plot has room for it, checked against the road, the
 * footpath, the property's boundary, the neighbours' houses, terraces and entrances, the plot itself
 * (nearer this house than any other) and the ground (a slab at the road's height, on a cast edge or on
 * columns where the ground falls away, never under the ground).
 */
import type { Plot } from "@/lib/types";
import { HOUSE, type HouseFit } from "@/lib/house/plan";
import { needsOwnGeometry, terraceDepth, type HouseOptions } from "@/lib/house/options";
import { planFor, type Plan } from "@/lib/house/variants";
import { carportModules, groundFor, type Carport, type ExteriorOptions } from "./exterior";
import { fromScene, toLocal } from "./frame";

type XY = [number, number];

/** The row roads and the footpath (public/data/road.json) and the property's boundary (public/data/parcels.json). */
export type SiteData = { roads: XY[][]; paths: XY[][]; boundary: XY[] };

let siteP: Promise<SiteData | null> | null = null;
/** The site's roads, footpath and boundary, fetched once; null when they cannot be had (no carport is placed then). */
export function loadSite(): Promise<SiteData | null> {
  if (!siteP) {
    siteP = Promise.all([fetch("/data/road.json").then((r) => (r.ok ? r.json() : null)), fetch("/data/parcels.json").then((r) => (r.ok ? r.json() : null))])
      .then(([road, parcels]) => {
        if (!road || !parcels) return null;
        const roads = [...(road.rows ?? []), ...(road.ramps ?? [])].map((x: { pts: XY[] }) => x.pts);
        const paths = (road.paths ?? []).map((x: { pts: XY[] }) => x.pts);
        const boundary = (parcels.parcels?.[0]?.ring ?? []) as XY[];
        return { roads, paths, boundary };
      })
      .catch(() => { siteP = null; return null; });
  }
  return siteP;
}

const CARPORT = { w: 3.3, d: 6.6 };
/** Half the row roads' asphalt (pipeline/twin_grading.py lays 5 m) and the clearances kept from things. */
const ROAD_HALF = 2.5, ROAD_CLEAR = 0.3, PATH_CLEAR = 1.1, BOUNDARY_CLEAR = 1.0, NEIGHBOUR_CLEAR = 1.0, OWN_CLEAR = 0.6;
/** The slab may stand this far over the road's edge (a short ramp) and this far over the ground (on columns). */
const MAX_RAMP = 0.6, MAX_FILL = 4.0;

function segDist(p: XY, a: XY, b: XY) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
  const t = L2 > 0 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0;
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t);
}
function lineDist(p: XY, lines: XY[][]) {
  let d = Infinity;
  for (const l of lines) for (let i = 0; i < l.length - 1; i++) d = Math.min(d, segDist(p, l[i], l[i + 1]));
  return d;
}
function inside(p: XY, poly: XY[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
function ringDist(p: XY, ring: XY[]) {
  let d = Infinity;
  for (let i = 0; i < ring.length; i++) d = Math.min(d, segDist(p, ring[i], ring[(i + 1) % ring.length]));
  return d;
}

/** The parts of a house nobody else may build on (house frame): the house, its terrace or patio with the stair, its entrance. */
function zones(fit: HouseFit, depth: number) {
  const H = HOUSE;
  return [
    { u0: -H.hw, u1: H.hw, v0: -H.hd, v1: H.hd },
    { u0: -H.hw - H.patioSide, u1: H.hw + H.patioSide, v0: H.hd, v1: H.hd + (fit.lower ? Math.max(H.patioDepth, depth) : depth) + 1.0 },
    { u0: 0.6 - 1.0, u1: 0.6 + 1.0, v0: -H.hd - 3.5, v1: -H.hd },
  ];
}

export type CarportCheck = { carport: Carport | null; status: "ok" | "no-room" | "pending" };

/**
 * Where a carport with storage goes on a plot: beside a gable, its open end to the row road behind the
 * houses, the first place that passes every check. null when the plot has no room for one.
 */
export function placeCarport(plots: Plot[], fits: HouseFit[], index: number, fit: HouseFit, depth: number, site: SiteData | null, groundAt: (x: number, y: number) => number, pv: boolean): CarportCheck {
  if (!site) return { carport: null, status: "pending" };
  const p = plots[index];
  const H = HOUSE;
  const to = (u: number, v: number): XY => { const l = toLocal(p, fit.mirror, u, v); return [l.x, l.y]; };
  const g = groundFor(p, fit.mirror, groundAt);
  const roadEdge = (u: number) => {
    for (let v = -H.hd; v > -40; v -= 0.05) if (lineDist(to(u, v), site.roads) < ROAD_HALF + ROAD_CLEAR) return v;
    return null;
  };
  const own = zones(fit, depth);
  const others = plots.map((q, j) => ({ q, j })).filter(({ q, j }) => j !== index && Math.hypot(q.local.x - p.local.x, q.local.y - p.local.y) < 60);
  const check = (u0: number, u1: number, v0: number, v1: number) => {
    const pts: { u: number; v: number; xy: XY }[] = [];
    for (let i = 0; i <= 6; i++) for (let k = 0; k <= 6; k++) { const u = u0 + ((u1 - u0) * i) / 6, v = v0 + ((v1 - v0) * k) / 6; pts.push({ u, v, xy: to(u, v) }); }
    for (const { xy } of pts) {
      if (site.boundary.length > 2 && (!inside(xy, site.boundary) || ringDist(xy, site.boundary) < BOUNDARY_CLEAR)) return null;
      if (lineDist(xy, site.roads) < ROAD_HALF + ROAD_CLEAR) return null;
      if (site.paths.length && lineDist(xy, site.paths) < PATH_CLEAR) return null;
    }
    for (const z of own) if (u0 < z.u1 + OWN_CLEAR && u1 > z.u0 - OWN_CLEAR && v0 < z.v1 + OWN_CLEAR && v1 > z.v0 - OWN_CLEAR) return null;
    for (const { q, j } of others) {
      const zq = zones(fits[j], H.terraceDepth);
      for (const { xy } of pts) {
        const h = fromScene(q, fits[j].mirror, xy[0], 0, -xy[1]);
        for (const z of zq) if (h.u > z.u0 - NEIGHBOUR_CLEAR && h.u < z.u1 + NEIGHBOUR_CLEAR && h.v > z.v0 - NEIGHBOUR_CLEAR && h.v < z.v1 + NEIGHBOUR_CLEAR) return null;
        // the plot: nearer this house than the other one
        if (Math.hypot(xy[0] - q.local.x, xy[1] - q.local.y) < Math.hypot(xy[0] - p.local.x, xy[1] - p.local.y) - 0.3) return null;
      }
    }
    const gs = pts.map(({ u, v }) => g(u, v));
    const slab = Math.max(...gs) + 0.12;
    const atOpen = g((u0 + u1) / 2, v0);
    if (slab - atOpen > MAX_RAMP || slab - Math.min(...gs) > MAX_FILL) return null;
    return slab;
  };
  for (const side of [1, -1]) for (const gap of [0.6, 1.0, 1.5]) {
    const a = H.hw + gap, b = a + CARPORT.w;
    const u0 = side > 0 ? a : -b, u1 = side > 0 ? b : -a;
    const edges = [u0, (u0 + u1) / 2, u1].map(roadEdge);
    if (edges.some((e) => e === null)) continue;
    const v0 = Math.max(...(edges as number[])) + ROAD_CLEAR, v1 = v0 + CARPORT.d;
    const slab = check(u0, u1, v0, v1);
    if (slab !== null) return { carport: { u0, u1, v0, v1, z: slab, open: -1, pv }, status: "ok" };
  }
  return { carport: null, status: "no-room" };
}

/** What the 3D builds for one configured house. */
export type CustomBuild = {
  index: number;
  options: HouseOptions;
  /** the house's fit to its plot, mirrored when the buyer asks for it */
  fit: HouseFit;
  plan: Plan;
  exterior: ExteriorOptions;
  /** the modules on its roof (none on rails with the integrated solar roof) */
  modules: number;
  /** the house needs geometry of its own */
  own: boolean;
  carport: CarportCheck;
  /** modules on the carport's roof, when it has the solar roof */
  carportModules: number;
};

/** The build for a house with a buyer's choices (the lower floor's variants only where the house has one). */
export function customHouse(plots: Plot[], fits: HouseFit[], index: number, options: HouseOptions, site: SiteData | null, groundAt: (x: number, y: number) => number): CustomBuild {
  const base = fits[index];
  const fit: HouseFit = options.flip ? { ...base, mirror: !base.mirror } : base;
  const lower = fit.lower ? options.lower : "finished";
  const depth = terraceDepth(options);
  const plan = planFor(lower, options.stove, depth);
  const wantsCarport = options.parking !== "space";
  const carport = wantsCarport ? placeCarport(plots, fits, index, fit, depth, site, groundAt, options.parking === "carport-pv") : { carport: null, status: "ok" as const };
  const exterior: ExteriorOptions = {
    openings: plan.openings,
    terraceDepth: depth,
    // under a deep terrace the patio reaches out under its stair's landing
    patioDepth: fit.lower && depth > HOUSE.terraceDepth ? HOUSE.patioDepth + 1.2 : HOUSE.patioDepth,
    railing: options.railing,
    chargers: options.chargers,
    chimney: options.stove !== "none",
    carport: carport.carport,
  };
  const own = needsOwnGeometry({ ...options, lower, parking: "space" }) || !!carport.carport;
  return {
    index, options, fit, plan, exterior, own, carport,
    modules: options.integrated ? 0 : options.modules,
    carportModules: carport.carport?.pv ? carportModules(carport.carport) : 0,
  };
}
