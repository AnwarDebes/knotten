"use client";
import { use, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { Plot } from "@/lib/types";
import { TRIM } from "@/lib/configurator/palette";
import type { HouseOptions } from "@/lib/house/options";
import { buildCustomExterior, buildExteriors, MODULE } from "../house/exterior";
import { fitFor, loadHouses } from "../house/frame";
import { houseUniforms, MAX_HOUSES, overlayHouseMaterials, sharedHouseDepth, sharedHouseMaterials } from "../house/materials";
import { isHidden, setHidden, setHouseDefaults, setHouseLook, setModules } from "../house/look";
import { customHouse, type CustomBuild, type SiteData } from "../house/custom";
import { builtGroundHeight, loadTwin } from "./twinData";

export { MODULE, houseUniforms, MAX_HOUSES };

/** Each house's position by plot id, for the camera, the labels and the energy overlay. */
export type PlotMeshes = { walls?: THREE.Mesh; roof?: THREE.Mesh; pos: THREE.Vector3 };
export type PlotRegistry = Map<string, PlotMeshes>;

/** How many modules a house carries in a scenario: from kWp, laid in rows from the eaves up. */
export function modulesFor(kwp: number) {
  return Math.max(0, Math.round((kwp * 1000) / MODULE.wp));
}

/** A house with a buyer's choices (the configurator), by its index in the plots. */
export type CustomRequest = { index: number; options: HouseOptions; site: SiteData | null };

const meshRaycast = THREE.Mesh.prototype.raycast;
const _inv = new THREE.Matrix4();
const _ray = new THREE.Ray();
const _v = new THREE.Vector3();

/**
 * Picking a house by its own triangles, but only the triangles of houses the ray can reach. Every house is
 * one run of the merged index (they are built one after another), so a test against each house's box decides
 * which runs are tested at all. The hits are exactly those of testing every triangle: a triangle can only be
 * hit where its house's box is. (Testing all 335 000 triangles took about 16 ms on a laptop for each press,
 * release and click.) The runs and boxes are found on the first pick. A house drawn apart (look.ts hidden)
 * is left out: its own meshes take the click.
 */
function housePicker(g: THREE.BufferGeometry): THREE.Mesh["raycast"] {
  let runs: { start: number; count: number; box: THREE.Box3; house: number }[] | null = null;
  const findRuns = () => {
    const out: { start: number; count: number; box: THREE.Box3; house: number }[] = [];
    const index = g.index, house = g.getAttribute("aHouse"), pos = g.getAttribute("position");
    if (!index || !house) return out;
    let cur = -1, start = 0, box: THREE.Box3 | null = null;
    for (let i = 0; i + 2 < index.count; i += 3) {
      const h = Math.round(house.getX(index.getX(i)));
      if (h !== cur) {
        if (box) out.push({ start, count: i - start, box, house: cur });
        cur = h; start = i; box = new THREE.Box3();
      }
      for (let k = 0; k < 3; k++) box!.expandByPoint(_v.fromBufferAttribute(pos, index.getX(i + k)));
    }
    if (box) out.push({ start, count: index.count - start, box, house: cur });
    return out;
  };
  return function (this: THREE.Mesh, raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
    if (!g.index) { meshRaycast.call(this, raycaster, intersects); return; }
    runs ??= findRuns();
    _inv.copy(this.matrixWorld).invert();
    _ray.copy(raycaster.ray).applyMatrix4(_inv);
    const { start, count } = g.drawRange;
    try {
      for (const r of runs) {
        if (isHidden(r.house) || !_ray.intersectsBox(r.box)) continue;
        g.setDrawRange(r.start, r.count);
        meshRaycast.call(this, raycaster, intersects);
      }
    } finally {
      g.setDrawRange(start, count);
    }
  };
}

// which materials throw shadows (glass, lamps and the thin modules only take them)
const CASTS = new Set(["clad", "paint", "frame", "metal", "pvframe", "roof", "deck", "concrete", "paving", "stone"]);

/**
 * The 30 houses of the model, outside: the example house (src/lib/house/plan.ts) on every plot,
 * fitted to the graded ground, with or without its lower floor (houses.json). Every material is one
 * mesh for all houses. `visit` is the house being walked through: its glass turns clear and its
 * doors are drawn apart, so they can open. `modules` is the modules each roof carries (one count for
 * all, or one per house), shown from the 18 places every roof has. `custom` is a house with a buyer's
 * choices: its look goes to the look texture, and what needs geometry of its own is built for it alone
 * and drawn in place of its merged copy (the other houses are not touched).
 */
export function TwinHouses({ plots, shadows, modules, registry, visit, custom, onCustom }: { plots: Plot[]; shadows: boolean; modules: number | ArrayLike<number>; registry?: React.RefObject<PlotRegistry>; visit?: string | null; custom?: CustomRequest | null; onCustom?: (b: CustomBuild | null) => void }) {
  const twin = use(loadTwin());
  const file = use(loadHouses());
  const fits = useMemo(() => plots.map((p) => fitFor(file, p)), [file, plots]);
  // the ground is read from the graded terrain, which is in once loadTwin has resolved
  const geos = useMemo(() => { void twin; return buildExteriors(plots, fits, builtGroundHeight); }, [plots, fits, twin]);
  const mats = sharedHouseMaterials();
  const depth = sharedHouseDepth();
  const pickers = useMemo(() => Object.fromEntries(Object.entries(geos).map(([k, g]) => [k, housePicker(g)])), [geos]);
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos]);

  // what each house is in the model (its trim and decking, the way it faces), for the look texture
  useLayoutEffect(() => {
    plots.forEach((p, i) => setHouseDefaults(i, TRIM[i % TRIM.length], i % 3 === 1 ? "#8a7b68" : "#7b6046", p.house.facing_deg));
  }, [plots]);

  // ---- the configured house
  const build = useMemo(() => (custom && custom.index >= 0 && custom.index < plots.length ? customHouse(plots, fits, custom.index, custom.options, custom.site, builtGroundHeight) : null), [custom, plots, fits]);
  const own = useMemo<OwnGeometry | null>(() => {
    if (!build?.own) return null;
    void twin;
    return { index: build.index, geos: buildCustomExterior(plots[build.index], build.fit, build.index, builtGroundHeight, build.modules, build.exterior) };
  }, [build, plots, twin]);
  // A house's own geometry is shown once its shaders are built (in parallel where the driver allows), so a
  // new choice never holds up a frame; until then the geometry shown before (or the merged copy) stands in.
  const [shown, setShown] = useState<OwnGeometry | null>(null);
  const { gl, scene, camera } = useThree();
  const [pendingGroup, setPendingGroup] = useState<THREE.Group | null>(null);
  const pending = own && own !== shown ? own : null;
  useEffect(() => {
    if (!pending || !pendingGroup) return;
    let alive = true;
    gl.compileAsync(pendingGroup, camera, scene).catch(() => {}).then(() => { if (alive) setShown(pending); });
    return () => { alive = false; };
  }, [pending, pendingGroup, gl, camera, scene]);
  const ownShown = own && shown && shown.index === own.index ? shown : null;
  // geometries no longer wanted or shown are freed
  const made = useRef(new Set<OwnGeometry>());
  useEffect(() => {
    if (own) made.current.add(own);
    for (const x of made.current) if (x !== own && x !== shown) { Object.values(x.geos).forEach((g) => g.dispose()); made.current.delete(x); }
  }, [own, shown]);
  useEffect(() => () => { for (const x of made.current) Object.values(x.geos).forEach((g) => g.dispose()); }, []);

  // the look, the modules, and which merged copy is hidden
  useLayoutEffect(() => {
    const n = Math.min(plots.length, MAX_HOUSES);
    for (let i = 0; i < n; i++) {
      const count = typeof modules === "number" ? modules : modules[i] ?? 0;
      setModules(i, build && build.index === i ? build.modules : count);
    }
  }, [modules, plots, build]);
  useLayoutEffect(() => {
    if (!build) return;
    setHouseLook(build.index, build.options);
    return () => setHouseLook(build.index, null);
  }, [build]);
  useLayoutEffect(() => {
    if (!ownShown) return;
    setHidden(ownShown.index, true);
    return () => setHidden(ownShown.index, false);
  }, [ownShown]);
  useEffect(() => {
    if (!onCustom) return;
    // ready once the house's own geometry (if it needs any) is on screen
    if (!build || !build.own || (own && shown === own)) onCustom(build);
  }, [build, own, shown, onCustom]);

  useEffect(() => {
    houseUniforms.uVisit.value = visit ? plots.findIndex((p) => p.id === visit) : -1;
  }, [visit, plots]);

  // one position per plot for the camera and labels
  useEffect(() => {
    const r = registry?.current;
    if (!r) return;
    plots.forEach((p) => r.set(p.id, { pos: new THREE.Vector3(p.local.x, p.local.z_floor + p.house.eaves_m, -p.local.y) }));
    return () => { plots.forEach((p) => r.delete(p.id)); };
  }, [plots, registry]);

  const ownMats = own ? overlayHouseMaterials() : null;
  const ownMeshes = (x: OwnGeometry) => Object.entries(x.geos).map(([k, g]) => {
    const m = ownMats && (ownMats as Record<string, THREE.Material>)[k];
    if (!m) return null;
    return <mesh key={k} name={`house-own-${k}`} geometry={g} material={m} castShadow={shadows && CASTS.has(k)} receiveShadow={shadows && k !== "glass" && k !== "railglass"} renderOrder={k === "railglass" ? 2 : 0} />;
  });
  return (
    <group>
      {Object.entries(geos).map(([k, g]) => {
        const m = (mats as Record<string, THREE.Material>)[k];
        if (!m) return null;
        const casts = shadows && CASTS.has(k);
        return <mesh key={k} name={`houses-${k}`} geometry={g} material={m} raycast={pickers[k]} castShadow={casts} customDepthMaterial={casts ? (k === "pvframe" ? depth.slots : depth.plain) : undefined} receiveShadow={shadows && k !== "glass" && k !== "railglass"} renderOrder={k === "railglass" ? 2 : 0} />;
      })}
      {ownShown && <group key="shown" name="house-own">{ownMeshes(ownShown)}</group>}
      {pending && <group key="pending" ref={setPendingGroup} visible={false}>{ownMeshes(pending)}</group>}
    </group>
  );
}

type OwnGeometry = { index: number; geos: Record<string, THREE.BufferGeometry> };
