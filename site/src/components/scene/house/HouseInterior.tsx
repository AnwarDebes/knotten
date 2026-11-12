"use client";
import { use, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { Plot } from "@/lib/types";
import { HOUSE, OPENINGS, keep, vaultAt, type HouseFit, type RoomId } from "@/lib/house/plan";
import { customInterior, interiorKey } from "@/lib/house/options";
import { Builders } from "./kit";
import { fitFor, houseMatrix, loadHouses } from "./frame";
import { buildInterior, type InteriorLook } from "./interior";
import { bakeLight, flatLight, type LightLook } from "./lighting";
import type { CustomBuild } from "./custom";
import { interiorMaterials, interiorUniforms, setInteriorHouse, socUniform } from "./interiorMaterials";
import { FRAME, drawMovable, movablesOf } from "./exterior";
import { sharedHouseMaterials } from "./materials";
import { drawScreens, makeScreen } from "./screens";
import { walkState } from "./walkState";
import { walkWorld } from "./walk";
import { builtGroundHeight } from "../twin/twinData";
import { twinUniforms } from "../twin/materials";

/** The front door and the sliding doors are drawn with the rooms' materials, so their inner faces are lit like the hall. */
const MOVE_MAT: Record<string, string> = { paint: "paintwood", frame: "paintwood", metal: "chrome", glass: "glass" };

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * The inside of the visited house: its rooms, its furniture and installations, its inner doors (they
 * open as the visitor comes to them), and its front door and sliding doors (drawn apart from the
 * houses outside so they can open). Sets the light of the rooms to this house's frame and windows,
 * clears the ground out of its footprint, and keeps the screens in the house showing the house's own
 * figures from the energy simulation.
 */
export function HouseInterior({ plots, index, locale, custom }: { plots: Plot[]; index: number; locale: "no" | "en"; custom?: CustomBuild | null }) {
  const file = use(loadHouses());
  // the configured house (the configurator) is built with the buyer's choices for the inside; every other house,
  // and a configured house whose inside is the model's, as in the model (so nothing is built twice)
  const here = custom && custom.index === index ? custom : null;
  const mine = here && customInterior(here.options) ? here : null;
  const key = mine ? `${interiorKey(mine.options)}|${mine.fit.mirror}|${mine.fit.lower}` : "";
  // (the choices that shape the inside, held by their key: a change of the facade colour does not rebuild the rooms)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const chosen = useMemo(() => mine, [key]);
  const fits = useMemo(() => plots.map((q, i) => (chosen && chosen.index === i ? chosen.fit : fitFor(file, q))), [file, plots, chosen]);
  const p = plots[index], fit = fits[index];
  const build = useMemo(() => buildHouse(p, fit, index, chosen), [p, fit, index, chosen]);
  // what the walk finds outside the house as chosen now (a deeper terrace, a carport), held by its key
  const out = here?.exterior;
  const outdoorKey = out ? JSON.stringify([out.terraceDepth, out.patioDepth, out.carport]) : "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const outdoor = useMemo(() => (out ? { terraceDepth: out.terraceDepth, patioDepth: out.patioDepth, carport: out.carport } : {}), [outdoorKey]);
  useEffect(() => {
    if (window.location.search.includes("twindebug")) console.info(`house ${p.id}: built in ${build.ms.toFixed(0)} ms, light ${build.lightMs.toFixed(0)} ms`);
  }, [build, p]);
  const screen = useMemo(() => makeScreen(), []);
  const mats = useMemo(() => interiorMaterials(screen.texture), [screen]);
  const ext = sharedHouseMaterials();
  const hm = useMemo(() => houseMatrix(p, fit.mirror), [p, fit]);


  // the front door and the sliding doors of this house, in the house's frame, each on its own pivot
  const movables = useMemo(() => movablesOf(fit.lower, build.plan.openings).map((m) => {
    const B = new Builders();
    B.attr("aHouse", [index]);
    B.attr("aMove", [0]);
    B.at(new THREE.Matrix4());
    drawMovable(B, m, fit.floor_z + (m.opening.level === "lower" ? HOUSE.lower : 0), (index * 0.618) % 1);
    const geos = B.geometries();
    for (const g of Object.values(geos)) flatLight(g, 0.3, 0.1);
    // the pivot: the hinge for the front door (on its outer face), the track for a sliding sash
    const h = m.opening;
    // (a door on the view side, the rental unit's own, has its hinge on the outer face of the front wall)
    const pivot = m.kind !== "swing" ? new THREE.Vector3(0, 0, 0) : h.side === "front" ? new THREE.Vector3(h.c + h.w / 2 - FRAME.w, 0, -(HOUSE.hd - FRAME.at - 0.01)) : new THREE.Vector3(h.c + h.w / 2 - FRAME.w, 0, -(-HOUSE.hd + FRAME.at + 0.01));
    for (const g of Object.values(geos)) g.translate(-pivot.x, -pivot.y, -pivot.z);
    return { m, geos, pivot };
  }), [fit, index, build]);

  // ---- the house's frame, windows and inner walls for the light; the ground cleared from its footprint
  useEffect(() => {
    setInteriorHouse(p.local.x, p.local.y, p.local.z_floor, p.house.facing_deg, fit.mirror, fit.lower, build.plan);
    const f = (p.house.facing_deg * Math.PI) / 180;
    twinUniforms.uClipHouse.value.set(p.local.x, -p.local.y, Math.cos(f), Math.sin(f));
    twinUniforms.uClipOn.value = 1;
    return () => { twinUniforms.uClipOn.value = 0; };
  }, [p, fit, build]);

  // ---- the walk's world for this house
  useEffect(() => {
    walkState.world = walkWorld(plots, fits, index, build, builtGroundHeight, outdoor);
    walkState.nav = null;
    walkState.visit = index;
    walkState.doorOpen.clear();
    // hotspots in scene coordinates
    walkState.hotPos.clear();
    walkState.hotLevel.clear();
    for (const h of build.hotspots) {
      walkState.hotPos.set(h.id, new THREE.Vector3(h.u, h.z, -h.v).applyMatrix4(hm));
      walkState.hotLevel.set(h.id, h.level);
    }
  }, [build, plots, fits, index, hm, outdoor]);

  // ---- the rooms' shaders compiled while the camera flies in, so the first look round does not stutter
  const gl = useThree((s) => s.gl), scene = useThree((s) => s.scene), camera = useThree((s) => s.camera);
  useEffect(() => {
    let live = true;
    const t0 = performance.now();
    gl.compileAsync(scene, camera).then(() => {
      if (live && window.location.search.includes("twindebug")) console.info(`house ${p.id}: shaders ready in ${(performance.now() - t0).toFixed(0)} ms`);
    }).catch(() => {});
    return () => { live = false; };
  }, [gl, scene, camera, build, mats, p]);

  useEffect(() => () => {
    Object.values(build.geos).forEach((g) => g.dispose());
    build.doors.forEach((d) => Object.values(d.geo).forEach((g) => g.dispose()));
  }, [build]);
  useEffect(() => () => movables.forEach((m) => Object.values(m.geos).forEach((g) => g.dispose())), [movables]);
  useEffect(() => () => { Object.values(mats).forEach((m) => m.dispose()); screen.texture.dispose(); }, [mats, screen]);

  // ---- doors, lamps, the sun over the plot's horizon, the screens
  const doorRefs = useRef(new Map<string, THREE.Group>());
  const moveRefs = useRef(new Map<string, THREE.Group>());
  const drawn = useRef<{ live: unknown; key: string }>({ live: undefined, key: "" });
  const root = useRef<THREE.Group>(null);
  const order = useRef<{ indoors: boolean; build: unknown }>({ indoors: false, build: null });
  const horizon = p.horizon_deg_by_bearing;
  useFrame((_, dt) => {
    const w = walkState;
    // indoors the rooms are drawn first: the ground and the forest outside are then shaded only where a window shows them
    const indoors = w.place.level !== "outside";
    if (root.current && (order.current.indoors !== indoors || order.current.build !== build)) {
      order.current = { indoors, build };
      root.current.traverse((o) => { if ((o as THREE.Mesh).isMesh && o.renderOrder !== 3) o.renderOrder = indoors ? -2 : 0; });
    }
    // inner doors open when the visitor comes within 1.4 m, shut again beyond 2.6 m
    for (const d of build.doors) {
      const cu = d.hinge[0] + d.leafDir[0] * d.w * 0.5, cv = d.hinge[1] + d.leafDir[1] * d.w * 0.5;
      const near = Math.hypot(w.u - cu, w.v - cv);
      const sameLevel = (d.level === "lower") === (w.z < -1.0);
      const cur = w.doorOpen.get(d.id) ?? 0;
      const target = sameLevel && near < 1.4 ? 1 : near > 2.6 || !sameLevel ? 0 : cur > 0.5 ? 1 : 0;
      const next = cur + Math.sign(target - cur) * Math.min(Math.abs(target - cur), dt * 1.6);
      w.doorOpen.set(d.id, next);
      const g = doorRefs.current.get(d.id);
      if (g) {
        const alongU = Math.abs(d.leafDir[0]) > 0.5;
        const into: [number, number] = alongU ? [0, d.into] : [d.into, 0];
        const sgn = Math.sign(d.leafDir[0] * into[1] - d.leafDir[1] * into[0]) || 1;
        const base = Math.atan2(d.leafDir[1], d.leafDir[0]);
        g.rotation.y = base + sgn * next * next * (3 - 2 * next) * (Math.PI / 2) * 0.95;
      }
    }
    // the front door swings out, the sliding doors slide, when the visitor is near (inside or out)
    for (const { m, pivot } of movables) {
      const o = m.opening;
      const cu = o.c, cv = o.side === "back" ? -HOUSE.hd : HOUSE.hd;
      const lvl = o.level === "lower" ? HOUSE.lower : 0;
      const near = Math.hypot(w.u - cu, w.v - cv) + Math.abs(w.z - lvl) * 2;
      const cur = w.doorOpen.get(o.id) ?? 0;
      const target = near < 2.2 ? 1 : near > 3.4 ? 0 : cur > 0.5 ? 1 : 0;
      const next = cur + Math.sign(target - cur) * Math.min(Math.abs(target - cur), dt * 1.2);
      w.doorOpen.set(o.id, next);
      const g = moveRefs.current.get(o.id);
      if (!g) continue;
      const e = next * next * (3 - 2 * next);
      if (m.kind === "swing") { g.position.copy(pivot); g.rotation.y = (o.side === "front" ? -1 : 1) * e * 1.65; }
      else g.position.set(-e * (o.w / 2 - 0.12), 0, 0);
    }
    // lamps: on in the dark and at dusk
    const night = twinUniforms.uNight.value;
    interiorUniforms.uLampsOn.value = Math.min(1, night * 1.5 + (1 - smooth(-2, 14, Math.asin(Math.max(-1, Math.min(1, twinUniforms.uSunWorld.value.y))) * 57.3)) * 0.55);
    // the sun only reaches the rooms when it clears the measured horizon of this plot
    const s = twinUniforms.uSunWorld.value;
    const el = Math.asin(Math.max(-1, Math.min(1, s.y))) * 57.2958;
    const az = ((Math.atan2(s.x, -s.z) * 57.2958) + 360) % 360;
    const k = Math.floor(az), t = az - k;
    const hz = horizon.length === 360 ? horizon[k % 360] * (1 - t) + horizon[(k + 1) % 360] * t : 0;
    interiorUniforms.uSunUp.value = smooth(hz - 0.3, hz + 0.4, el);
    // the battery's charge bar, and the screens when what they show has changed (each drawing sends a 1024 px canvas to the GPU)
    if (w.live) socUniform.value = w.live.soc;
    const key = `${locale}|${p.id}`;
    if (w.live !== drawn.current.live || key !== drawn.current.key) {
      drawn.current = { live: w.live, key };
      drawScreens(screen, w.live, locale, Number(p.id.split("-")[1]));
    }
  });

  return (
    <group ref={root}>
      {Object.entries(build.geos).map(([k, g]) => {
        const m = (mats as Record<string, THREE.Material>)[k];
        return m ? <mesh key={k} geometry={g} material={m} renderOrder={k === "glass" ? 3 : 0} /> : null;
      })}
      <group matrixAutoUpdate={false} matrix={hm}>
        {build.doors.map((d) => (
          <group key={d.id} position={[d.hinge[0], d.z, -d.hinge[1]]} ref={(el) => { if (el) doorRefs.current.set(d.id, el); else doorRefs.current.delete(d.id); }}>
            {Object.entries(d.geo).map(([k, g]) => {
              const m = (mats as Record<string, THREE.Material>)[k];
              return m ? <mesh key={k} geometry={g} material={m} /> : null;
            })}
          </group>
        ))}
        {movables.map(({ m, geos, pivot }) => (
          <group key={m.opening.id} position={pivot} ref={(el) => { if (el) moveRefs.current.set(m.opening.id, el); else moveRefs.current.delete(m.opening.id); }}>
            {Object.entries(geos).map(([k, g]) => {
              const mat = (MOVE_MAT[k] ? (mats as Record<string, THREE.Material>)[MOVE_MAT[k]] : undefined) ?? (ext as Record<string, THREE.Material>)[k];
              return mat ? <mesh key={k} geometry={g} material={mat} renderOrder={k === "glass" ? 3 : 0} /> : null;
            })}
          </group>
        ))}
      </group>
    </group>
  );
}

/** The inside of a house with its light worked out, and how long that took. */
function buildHouse(p: Plot, fit: HouseFit, index: number, custom: CustomBuild | null = null) {
  const t0 = performance.now();
  const look = custom ? interiorLook(custom) : undefined;
  const b = buildInterior(p, fit, index, look);
  const ms = performance.now() - t0;
  const lightMs = bakeLight(b, p, fit, look ? lightLook(custom!, look) : undefined);
  // the door leaves get the room's light (they are drawn apart from the baked rooms)
  b.doors.forEach((d) => Object.values(d.geo).forEach((g) => flatLight(g, 0.08, 0.2)));
  return Object.assign(b, { ms, lightMs });
}

/** The buyer's choices for the inside, as the builder takes them. */
function interiorLook(c: CustomBuild): InteriorLook {
  const o = c.options;
  return { plan: c.plan, wall: o.wall, floor: o.floor, plank: o.plank, kitchen: o.kitchen, worktop: o.worktop, bath: o.bath, bathColour: o.bathColour };
}

const lum = (hex: string) => { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };
/** The model's oiled oak (linear), whose swatch is the floor's standard. */
const OAK_LUM = 0.2126 * 0.6 + 0.7152 * 0.39 + 0.0722 * 0.21;

/**
 * The light bounced round each room follows the surfaces the buyer chose: the room's average reflectance
 * (the model's white walls and ceilings and oak floors give the bake's 0.55) is scaled, wall, floor and
 * ceiling by their share of the room's surface, by each chosen colour's luminance against the model's. Under
 * a deeper terrace the lower floor's openings see less sky: the vertical sky factor (1/pi)(t + sin 2t / 2) of
 * the sky above the horizon up to the deck's edge, t the edge's angle seen 1.3 m below the deck.
 */
function lightLook(c: CustomBuild, look: InteriorLook): LightLook {
  const wallK = look.wall ? lum(look.wall) / lum("#f7f6f2") : 1;
  const floorK = look.floor ? (lum(look.floor) / OAK_LUM) : 1;
  const tileK = look.bathColour ? lum(look.bathColour) / lum("#77797a") : 1;
  const plain = wallK === 1 && floorK === 1 && tileK === 1;
  const rooms = c.plan.rooms;
  const rho = plain ? undefined : (zone: RoomId) => {
    const r = rooms.find((x) => x.id === zone);
    if (!r) return 0.55;
    const w = r.rect.u1 - r.rect.u0, d = r.rect.v1 - r.rect.v0;
    const h = r.ceiling === "vault" ? (vaultAt(0) + vaultAt(HOUSE.id)) / 2 : r.level === "lower" ? HOUSE.lowerCeiling - HOUSE.lower : HOUSE.flat;
    const aw = 2 * (w + d) * h, af = w * d, ac = w * d;
    const wet = zone === "bath" || zone === "bath2";
    const kw = wet ? (wallK + tileK) / 2 : wallK;
    const kf = r.floor === "oak" ? floorK : wet ? tileK : 1;
    return Math.min(0.85, 0.55 * (aw * kw + af * kf + ac) / (aw + af + ac));
  };
  const depth = c.plan.terraceDepth;
  const sky = (t: number) => (t + Math.sin(2 * t) / 2) / Math.PI;
  const lowerShade = depth > HOUSE.terraceDepth ? sky(Math.atan2(1.3, depth)) / sky(Math.atan2(1.3, HOUSE.terraceDepth)) : undefined;
  return { rho, lowerShade };
}

/** Openings of the house that a visitor walks through (for the walk's door logic and the plan). */
export function walkDoors(lower: boolean) {
  return OPENINGS.filter((o) => keep(o, lower) && (o.kind === "entry" || o.kind === "slide" || o.kind === "garden"));
}
