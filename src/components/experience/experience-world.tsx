"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Html } from "@react-three/drei";
import * as THREE from "three";
import { useTranslations, useLocale } from "next-intl";
import {
  type Heightmap,
  type SunSeason,
  type SunTime,
  elevationAt,
  bearingToSea,
} from "@/components/terrain/types";
import { sunDirection } from "@/components/terrain/sun";
import { cn } from "@/lib/utils";
import { PLOTS } from "@/content/plots";
import { AMENITIES, SITE } from "@/content/amenities";
import type { Quality } from "./experience-launcher";

/** Touch input, written by the on-screen controls and read in the frame loop. */
type TouchInput = {
  moveX: number;
  moveY: number;
  sprint: boolean;
  rise: boolean;
  descend: boolean;
};

/* eslint-disable react-hooks/immutability -- React Three Fiber drives the scene
   by mutating Three.js objects (camera transform, geometry) imperatively inside
   useFrame and effects; that is the engine's intended model, not a React state
   mutation. */

/**
 * The immersive Knotten world, rendered at a true 1:1 metre scale (1 scene unit
 * = 1 metre) so the walk speed, eye height and distances are real. The terrain
 * is the actual Kartverket landform from public/terrain/heightmap.json; the sun
 * is the real position for the site. This is the first build: real terrain, sky,
 * sun, sea and plot markers, walkable in first person. Photoreal imagery, the
 * high-resolution core, the indicative homes and the energy layer arrive in the
 * later specs. Dynamically imported (ssr:false), so Three.js never ships in the
 * route's initial bundle.
 */

const EYE_HEIGHT = 1.7; // metres, real eye height
const WALK = 1.4; // m/s, real walking speed
const SPRINT = 3.6; // m/s

// Stable Canvas props. Inline object literals here would change identity on
// every re-render (the HUD updates a few times a second), making R3F re-apply
// them and reset the camera, which froze the walker in place.
const CAMERA_PROPS = {
  fov: 70,
  near: 0.1,
  far: 7000,
  position: [0, 110, 0] as [number, number, number],
};

const STATUS_COLOR: Record<string, string> = {
  ledig: "#37a06a",
  reservert: "#c9821f",
  solgt: "#a8443c",
};

function buildTerrainGeometry(h: Heightmap): THREE.BufferGeometry {
  const cols = h.width;
  const rows = h.height;
  const geo = new THREE.PlaneGeometry(h.widthMeters, h.heightMeters, cols - 1, rows - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const colors = new Float32Array(cols * rows * 3);
  const z = h.z;
  const mx = h.widthMeters / (cols - 1);
  const mz = h.heightMeters / (rows - 1);
  const shore = new THREE.Color("#b3a981");
  const grassLow = new THREE.Color("#466a2f");
  const grassMid = new THREE.Color("#5c7340");
  const grassHigh = new THREE.Color("#6f7349");
  const rock = new THREE.Color("#8b8478");
  const c = new THREE.Color();
  for (let r = 0; r < rows; r++) {
    for (let cc = 0; cc < cols; cc++) {
      const i = r * cols + cc;
      const e = z[i] ?? 0;
      pos.setY(i, e);
      // Local slope from the four neighbours: steeper ground reads as rock.
      const eL = z[cc > 0 ? i - 1 : i] ?? e;
      const eR = z[cc < cols - 1 ? i + 1 : i] ?? e;
      const eU = z[r > 0 ? i - cols : i] ?? e;
      const eD = z[r < rows - 1 ? i + cols : i] ?? e;
      const slope = Math.min(1, Math.hypot((eR - eL) / (2 * mx), (eD - eU) / (2 * mz)));
      if (e < 2) c.copy(shore);
      else if (e < 35) c.copy(grassLow).lerp(grassMid, e / 35);
      else c.copy(grassMid).lerp(grassHigh, Math.min(1, (e - 35) / 130));
      c.lerp(rock, Math.min(0.82, slope * 1.05));
      // A little deterministic per-cell variation so it is not a flat wash.
      const hsh = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const j = 0.93 + (hsh < 0 ? hsh + 1 : hsh) * 0.14;
      colors[i * 3] = c.r * j;
      colors[i * 3 + 1] = c.g * j;
      colors[i * 3 + 2] = c.b * j;
    }
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function worldXZ(h: Heightmap, u: number, v: number): [number, number] {
  return [(u - 0.5) * h.widthMeters, (v - 0.5) * h.heightMeters];
}

/**
 * Real forest, instanced. Each tree is [x, groundY, z, height, kind] derived
 * from the Kartverket canopy height model (DOM minus DTM). Trunk and foliage are
 * separate InstancedMeshes per species (four draw calls total) sharing the same
 * per-tree transform, so thousands of trees stay cheap. Conifer = furu/gran,
 * deciduous = bjork/eik.
 */
function Trees({ list }: { list: number[][] }) {
  const con = useMemo(() => list.filter((t) => t[4] === 0), [list]);
  const dec = useMemo(() => list.filter((t) => t[4] === 1), [list]);
  const conTrunk = useRef<THREE.InstancedMesh | null>(null);
  const conFol = useRef<THREE.InstancedMesh | null>(null);
  const decTrunk = useRef<THREE.InstancedMesh | null>(null);
  const decFol = useRef<THREE.InstancedMesh | null>(null);

  const cyl = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.04, 0.07, 0.3, 5);
    g.translate(0, 0.15, 0);
    return g;
  }, []);
  const cone = useMemo(() => {
    const g = new THREE.ConeGeometry(0.24, 0.78, 7);
    g.translate(0, 0.61, 0);
    return g;
  }, []);
  const cyl2 = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.04, 0.07, 0.42, 5);
    g.translate(0, 0.21, 0);
    return g;
  }, []);
  const ball = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.32, 0);
    g.translate(0, 0.72, 0);
    return g;
  }, []);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    const fill = (ref: RefObject<THREE.InstancedMesh | null>, arr: number[][]) => {
      const mesh = ref.current;
      if (!mesh) return;
      for (let i = 0; i < arr.length; i++) {
        const t = arr[i];
        if (!t) continue;
        q.setFromAxisAngle(up, (i * 2.3999) % 6.2831853);
        pos.set(t[0] ?? 0, t[1] ?? 0, t[2] ?? 0);
        const h = t[3] ?? 6;
        const w = h * 0.6;
        scl.set(w, h, w);
        m.compose(pos, q, scl);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    fill(conTrunk, con);
    fill(conFol, con);
    fill(decTrunk, dec);
    fill(decFol, dec);
  }, [con, dec]);

  return (
    <>
      <instancedMesh ref={conTrunk} args={[cyl, undefined, con.length]} frustumCulled={false}>
        <meshStandardMaterial color="#5b4632" roughness={0.95} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={conFol} args={[cone, undefined, con.length]} frustumCulled={false}>
        <meshStandardMaterial color="#2f5236" roughness={0.85} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={decTrunk} args={[cyl2, undefined, dec.length]} frustumCulled={false}>
        <meshStandardMaterial color="#5b4632" roughness={0.95} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={decFol} args={[ball, undefined, dec.length]} frustumCulled={false}>
        <meshStandardMaterial color="#5a7a3c" roughness={0.85} metalness={0} />
      </instancedMesh>
    </>
  );
}

const FLOOR_H = 3; // metres per storey

/**
 * Indicative multi-storey residential building: a clean white massing with
 * ribbon windows on each floor, a flat roof and a rooftop solar array. These are
 * the larger blocks a denser coastal plan would allow, not single houses. The
 * form, height and count are indicative and follow the zoning plan; the solar
 * yield is real (about 1010 kWh/kWp at 58 N).
 */
function BigBuilding({ W, D, storeys }: { W: number; D: number; storeys: number }) {
  const H = storeys * FLOOR_H;
  const mass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#e9ebe6", roughness: 0.85 }),
    [],
  );
  const glass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2b4763",
        metalness: 0.45,
        roughness: 0.18,
        emissive: new THREE.Color("#16293f"),
        emissiveIntensity: 0.22,
      }),
    [],
  );
  const roofMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#565b62", roughness: 0.8 }),
    [],
  );
  const pv = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1f5aa8",
        metalness: 0.6,
        roughness: 0.16,
        emissive: new THREE.Color("#1b3f73"),
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const floors = useMemo(() => {
    const out: number[] = [];
    for (let f = 0; f < storeys; f++) out.push(f * FLOOR_H + FLOOR_H * 0.55);
    return out;
  }, [storeys]);
  const bw = W * 0.86;
  const bd = D * 0.86;
  const bh = FLOOR_H * 0.42;
  return (
    <group>
      <mesh position={[0, H / 2, 0]} material={mass}>
        <boxGeometry args={[W, H, D]} />
      </mesh>
      {floors.map((wy, f) => (
        <group key={f}>
          <mesh position={[0, wy, D / 2 + 0.03]} material={glass}>
            <boxGeometry args={[bw, bh, 0.06]} />
          </mesh>
          <mesh position={[0, wy, -D / 2 - 0.03]} material={glass}>
            <boxGeometry args={[bw, bh, 0.06]} />
          </mesh>
          <mesh position={[W / 2 + 0.03, wy, 0]} material={glass}>
            <boxGeometry args={[0.06, bh, bd]} />
          </mesh>
          <mesh position={[-W / 2 - 0.03, wy, 0]} material={glass}>
            <boxGeometry args={[0.06, bh, bd]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, H + 0.2, 0]} material={roofMat}>
        <boxGeometry args={[W + 0.3, 0.4, D + 0.3]} />
      </mesh>
      <mesh position={[0, H + 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]} material={pv}>
        <planeGeometry args={[W * 0.8, D * 0.66]} />
      </mesh>
    </group>
  );
}

function Houses({ h }: { h: Heightmap }) {
  const blocks = useMemo(() => {
    // Skip the first plot, which is the enterable show-home building.
    const out = [];
    for (let i = 1; i < PLOTS.length; i++) {
      const p = PLOTS[i];
      if (!p) continue;
      const storeys = 3 + (i % 2); // three or four storeys
      const W = 15 + (i % 3) * 3;
      const D = 11 + (i % 2) * 2;
      const [x, z] = worldXZ(h, p.u, p.v);
      const y = elevationAt(h, p.u, p.v) - 0.3;
      const yaw = -bearingToSea(h, p.u, p.v) + Math.PI / 2;
      out.push({ id: p.id, x, y, z, W, D, storeys, yaw });
    }
    return out;
  }, [h]);

  return (
    <>
      {blocks.map((b) => (
        <group key={b.id} position={[b.x, b.y, b.z]} rotation={[0, b.yaw, 0]}>
          <BigBuilding W={b.W} D={b.D} storeys={b.storeys} />
        </group>
      ))}
    </>
  );
}

/** True when the visitor's OS asks for reduced motion; decorative animation holds still. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- sync the media
       query to state on mount and on change; this is the standard pattern and is
       hydration-safe because the initial state matches the server (no reduction). */
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** True on touch / coarse-pointer devices; drives the on-screen controls and hint. */
function usePointerCoarse(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- sync the media
       query after mount; hydration-safe (server matches the false default). */
    setCoarse(mq.matches);
    const on = () => setCoarse(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return coarse;
}

/**
 * The energy concept, in motion. Glowing particles flow from each home up to a
 * shared hub, an indicative picture of the rooftop solar feeding the local
 * energy sharing (plusskunde up to 1 MW per property). The figures are real
 * (PVGIS about 1010 kWh/kWp at 58 N); the layout is indicative. Under reduced
 * motion the particles are placed once and held still. The flow speeds up and
 * brightens with the sun (gen, from the real solar altitude), so the energy
 * visibly tracks generation as the season and time of day change.
 */
function EnergyFlows({ h, gen, per }: { h: Heightmap; gen: number; per: number }) {
  const { hub, starts } = useMemo(() => {
    const pts = PLOTS.map((p) => {
      const [x, z] = worldXZ(h, p.u, p.v);
      return new THREE.Vector3(x, elevationAt(h, p.u, p.v) + 7, z);
    });
    const hubV = new THREE.Vector3();
    pts.forEach((p) => hubV.add(p));
    hubV.multiplyScalar(1 / Math.max(1, pts.length));
    hubV.y += 12;
    return { hub: hubV, starts: pts };
  }, [h]);

  const PER = per;
  const count = starts.length * PER;
  const ref = useRef<THREE.InstancedMesh | null>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const reduced = usePrefersReducedMotion();
  const filled = useRef(false);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    if (reduced && filled.current) return; // reduced motion: place once, then hold
    const time = reduced ? 0 : state.clock.elapsedTime;
    let idx = 0;
    for (let s = 0; s < starts.length; s++) {
      const st = starts[s];
      if (!st) continue;
      for (let k = 0; k < PER; k++) {
        const t = (time * (0.07 + gen * 0.26) + k / PER + s * 0.137) % 1;
        v.lerpVectors(st, hub, t);
        v.y += Math.sin(t * Math.PI) * 5;
        m.makeTranslation(v.x, v.y, v.z);
        mesh.setMatrixAt(idx++, m);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    filled.current = true;
  });

  return (
    <group>
      <mesh position={[hub.x, hub.y, hub.z]}>
        <icosahedronGeometry args={[5, 1]} />
        <meshStandardMaterial
          color="#16c2d4"
          emissive="#16c2d4"
          emissiveIntensity={0.5 + gen * 0.9}
          roughness={0.3}
        />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[1.5, 8, 8]} />
        <meshStandardMaterial
          color="#aef4fc"
          emissive="#7fe3ec"
          emissiveIntensity={0.7 + gen * 1.2}
          roughness={0.4}
        />
      </instancedMesh>
    </group>
  );
}

/**
 * Floating point-of-interest labels at each plot, so a visitor can identify the
 * homesites while walking. A status dot and the plot code; scaled by distance.
 * Plot positions are indicative placeholders.
 */
function PlotLabels({ h }: { h: Heightmap }) {
  return (
    <>
      {PLOTS.map((p) => {
        const [x, z] = worldXZ(h, p.u, p.v);
        const y = elevationAt(h, p.u, p.v);
        const color = STATUS_COLOR[p.status] ?? "#37a06a";
        return (
          <Html
            key={p.id}
            position={[x, y + 9, z]}
            center
            distanceFactor={150}
            zIndexRange={[20, 0]}
          >
            <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
              {p.code}
            </div>
          </Html>
        );
      })}
    </>
  );
}

/**
 * The enterable show-home building at the start plot: a multi-storey block like
 * its neighbours, but with an open, enterable ground floor behind a large
 * sea-facing picture window, so a visitor can step inside and look out to the
 * fjord. Walls are double-sided so the interior reads; there is no collision, so
 * the visitor simply walks in. Indicative, like all the massing.
 */
function ShowHome({ h }: { h: Heightmap }) {
  const cfg = useMemo(() => {
    const p = PLOTS[0];
    const u = p ? p.u : 0.3;
    const v = p ? p.v : 0.62;
    const [x, z] = worldXZ(h, u, v);
    const y = elevationAt(h, u, v) - 0.3;
    const yaw = Math.PI / 2 - bearingToSea(h, u, v); // local +Z faces the sea
    return { x, y, z, yaw };
  }, [h]);
  const W = 14;
  const D = 10;
  const gH = 3.2; // enterable ground-floor height
  const t2 = 0.2;
  const back = W / 2 - 0.7; // back-wall panel width (1.4 m doorway gap)

  return (
    <group position={[cfg.x, cfg.y, cfg.z]} rotation={[0, cfg.yaw, 0]}>
      {/* enterable ground floor */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#a9854f" roughness={0.75} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-W / 2, gH / 2, 0]}>
        <boxGeometry args={[t2, gH, D]} />
        <meshStandardMaterial color="#edefea" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[W / 2, gH / 2, 0]}>
        <boxGeometry args={[t2, gH, D]} />
        <meshStandardMaterial color="#edefea" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-(W / 4 + 0.35), gH / 2, -D / 2]}>
        <boxGeometry args={[back, gH, t2]} />
        <meshStandardMaterial color="#edefea" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[W / 4 + 0.35, gH / 2, -D / 2]}>
        <boxGeometry args={[back, gH, t2]} />
        <meshStandardMaterial color="#edefea" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      {/* sea-facing wall: a low sill and a glass picture window */}
      <mesh position={[0, 0.45, D / 2]}>
        <boxGeometry args={[W, 0.9, t2]} />
        <meshStandardMaterial color="#edefea" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, (gH + 0.9) / 2, D / 2]}>
        <boxGeometry args={[W - 0.4, gH - 0.9, 0.08]} />
        <meshStandardMaterial
          color="#9fd0e0"
          transparent
          opacity={0.26}
          roughness={0.05}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* a lightly furnished living space, so stepping inside has a payoff */}
      <mesh position={[0, 0.08, 0.5]}>
        <boxGeometry args={[5, 0.04, 4]} />
        <meshStandardMaterial color="#8a7d63" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.42, -0.3]}>
        <boxGeometry args={[3.2, 0.45, 1.1]} />
        <meshStandardMaterial color="#566270" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.8, -0.85]}>
        <boxGeometry args={[3.2, 0.7, 0.22]} />
        <meshStandardMaterial color="#566270" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.28, 0.95]}>
        <boxGeometry args={[1.5, 0.42, 0.8]} />
        <meshStandardMaterial color="#6b4f34" roughness={0.6} />
      </mesh>
      <mesh position={[W / 2 - 0.6, 0.45, -1]}>
        <boxGeometry args={[0.8, 0.9, 4]} />
        <meshStandardMaterial color="#d8dad5" roughness={0.7} />
      </mesh>
      <mesh position={[W / 2 - 0.6, 0.92, -1]}>
        <boxGeometry args={[0.95, 0.08, 4.1]} />
        <meshStandardMaterial color="#2e3033" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[-W / 2 + 1.5, 0.37, 1.2]}>
        <boxGeometry args={[1.5, 0.74, 2.2]} />
        <meshStandardMaterial color="#6b4f34" roughness={0.6} />
      </mesh>

      {/* the storeys above, the same block form as the neighbours */}
      <group position={[0, gH, 0]}>
        <BigBuilding W={W} D={D} storeys={3} />
      </group>
    </group>
  );
}

/** Initial compass bearing from one lat/lng to another, radians clockwise from north. */
function geoBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toR = (d: number) => (d * Math.PI) / 180;
  const p1 = toR(lat1);
  const p2 = toR(lat2);
  const dl = toR(lng2 - lng1);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return Math.atan2(y, x);
}

/**
 * Direction markers to the real landmarks (Vigeland, Mandal, Kristiansand,
 * Lindesnes lighthouse), each placed at its true geographic bearing from the
 * site so a visitor can orient: that way is the town, that way the lighthouse.
 * Distances are the real, sourced figures.
 */
function AmenityMarkers({ h }: { h: Heightmap }) {
  const locale = useLocale();
  const markers = useMemo(() => {
    const R = h.widthMeters * 0.62;
    return AMENITIES.filter((a) => a.distanceKm != null && a.distanceKm >= 4).map((a) => {
      const th = geoBearing(SITE.lat, SITE.lng, a.lat, a.lng);
      const x = Math.sin(th) * R;
      const z = -Math.cos(th) * R;
      const u = Math.min(0.999, Math.max(0.001, x / h.widthMeters + 0.5));
      const v = Math.min(0.999, Math.max(0.001, z / h.heightMeters + 0.5));
      const y = elevationAt(h, u, v) + 45;
      const name = locale === "en" ? a.nameEn : a.nameNo;
      return { id: a.id, x, y, z, label: `${name} · ${a.distanceKm} km` };
    });
  }, [h, locale]);

  return (
    <>
      {markers.map((m) => (
        <Html key={m.id} position={[m.x, m.y, m.z]} center zIndexRange={[15, 0]}>
          <div className="rounded bg-black/65 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white/90">
            {m.label}
          </div>
        </Html>
      ))}
    </>
  );
}

/**
 * The investor: a low-poly figure in a dark suit with a white shirt, a tie and a
 * briefcase, built from primitives (no external asset). Modelled facing +Z; the
 * controller rotates the whole group to face the walking direction.
 */
function InvestorModel({
  legL,
  legR,
  armL,
}: {
  legL: RefObject<THREE.Group | null>;
  legR: RefObject<THREE.Group | null>;
  armL: RefObject<THREE.Group | null>;
}) {
  const suit = "#2a3346";
  const suitDark = "#232b3b";
  const skin = "#d8a878";
  return (
    <group>
      {/* legs pivot at the hips so they swing; left leg */}
      <group ref={legL} position={[-0.12, 0.92, 0]}>
        <mesh position={[0, -0.46, 0]}>
          <boxGeometry args={[0.2, 0.92, 0.24]} />
          <meshStandardMaterial color={suitDark} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.87, 0.06]}>
          <boxGeometry args={[0.22, 0.12, 0.36]} />
          <meshStandardMaterial color="#141619" roughness={0.5} />
        </mesh>
      </group>
      <group ref={legR} position={[0.12, 0.92, 0]}>
        <mesh position={[0, -0.46, 0]}>
          <boxGeometry args={[0.2, 0.92, 0.24]} />
          <meshStandardMaterial color={suitDark} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.87, 0.06]}>
          <boxGeometry args={[0.22, 0.12, 0.36]} />
          <meshStandardMaterial color="#141619" roughness={0.5} />
        </mesh>
      </group>
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[0.56, 0.68, 0.32]} />
        <meshStandardMaterial color={suit} roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.28, 0.17]}>
        <boxGeometry args={[0.16, 0.5, 0.02]} />
        <meshStandardMaterial color="#eef1f4" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.2, 0.185]}>
        <boxGeometry args={[0.05, 0.34, 0.02]} />
        <meshStandardMaterial color="#8a2433" roughness={0.5} />
      </mesh>
      {/* the free arm pivots at the shoulder and swings */}
      <group ref={armL} position={[-0.37, 1.55, 0]}>
        <mesh position={[0, -0.33, 0]}>
          <boxGeometry args={[0.16, 0.66, 0.22]} />
          <meshStandardMaterial color={suit} roughness={0.78} />
        </mesh>
      </group>
      {/* the other arm carries the briefcase and stays still */}
      <mesh position={[0.37, 1.2, 0.05]}>
        <boxGeometry args={[0.16, 0.66, 0.22]} />
        <meshStandardMaterial color={suit} roughness={0.78} />
      </mesh>
      <mesh position={[0.37, 0.84, 0.05]}>
        <boxGeometry args={[0.11, 0.12, 0.13]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.68, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.74, -0.02]}>
        <sphereGeometry args={[0.145, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#33291f" roughness={0.85} />
      </mesh>
      <mesh position={[0.53, 0.62, 0.05]}>
        <boxGeometry args={[0.12, 0.34, 0.44]} />
        <meshStandardMaterial color="#4a3320" roughness={0.45} metalness={0.1} />
      </mesh>
    </group>
  );
}

/**
 * Third-person investor controller, GTA-style. WASD or arrows walk in the
 * camera's frame and the figure turns to face the way it moves; Shift sprints;
 * Space rises and C descends for an overhead survey. The camera orbits the
 * investor with the mouse (after a click for pointer lock): the yaw is unbounded
 * so it spins a full, smooth 360 with no snap, and the pitch sweeps from the sky
 * down to nearly overhead. Terrain-follow keeps the figure on the real ground.
 */
function Investor({
  h,
  onElev,
  onPose,
  speedMul,
  input,
}: {
  h: Heightmap;
  onElev: (m: number) => void;
  onPose: (p: { u: number; v: number }) => void;
  speedMul: number;
  input: RefObject<TouchInput>;
}) {
  const { camera, gl } = useThree();
  const reduced = usePrefersReducedMotion();
  const group = useRef<THREE.Group | null>(null);
  const keys = useRef<Record<string, boolean>>({});
  const locked = useRef(false);
  const dragging = useRef(false);
  const lookId = useRef<number | null>(null);
  const last = useRef({ x: 0, y: 0 });
  const placed = useRef(false);
  const since = useRef(0);
  const bob = useRef(0);
  const pos = useRef(new THREE.Vector3());
  const alt = useRef(0); // metres above the terrain (fly-up survey)
  const face = useRef(0); // figure heading
  const orbit = useRef({ yaw: Math.PI, pitch: 0.22 });
  const legL = useRef<THREE.Group | null>(null);
  const legR = useRef<THREE.Group | null>(null);
  const armL = useRef<THREE.Group | null>(null);
  const intro = useRef({ active: false, t: 0 });

  useEffect(() => {
    if (placed.current) return;
    placed.current = true;
    const start = PLOTS[0];
    const u = start ? start.u : 0.3;
    const v = start ? start.v : 0.62;
    const [px, pz] = worldXZ(h, u, v);
    const b = bearingToSea(h, u, v);
    const bx = px - Math.cos(b) * 24 - Math.sin(b) * 15;
    const bz = pz - Math.sin(b) * 24 + Math.cos(b) * 15;
    const gy = Math.max(elevationAt(h, bx / h.widthMeters + 0.5, bz / h.heightMeters + 0.5), 0);
    pos.current.set(bx, gy, bz);
    const toPlot = Math.atan2(px - bx, pz - bz);
    face.current = toPlot;
    orbit.current.yaw = toPlot;
    // Cinematic intro: ease from a high overview down to the investor, unless the
    // visitor prefers reduced motion.
    intro.current = { active: !reduced, t: 0 };
  }, [h, reduced]);

  useEffect(() => {
    const dom = gl.domElement;
    // Two ways to look, both smooth and unbounded (a full 360 with no snap):
    // press and drag, or click once to capture the mouse (pointer lock).
    const onPointerDown = (e: PointerEvent) => {
      // Claim a single finger/cursor for looking; a second touch stays free for
      // the joystick and buttons without hijacking the camera.
      if (lookId.current !== null) return;
      lookId.current = e.pointerId;
      dragging.current = true;
      intro.current.active = false; // skip the intro the moment the visitor acts
      last.current = { x: e.clientX, y: e.clientY };
      // Pointer lock only makes sense for a mouse, never a finger.
      if (e.pointerType === "mouse" && document.pointerLockElement !== dom) {
        try {
          const ret = dom.requestPointerLock?.() as unknown;
          if (ret && typeof (ret as { catch?: unknown }).catch === "function") {
            (ret as Promise<void>).catch(() => {});
          }
        } catch {
          // Pointer lock can be unavailable (embedded contexts); drag-look covers it.
        }
      }
    };
    const onPointerEnd = (e: PointerEvent) => {
      if (e.pointerId === lookId.current) {
        dragging.current = false;
        lookId.current = null;
      }
    };
    const onLockChange = () => {
      locked.current = document.pointerLockElement === dom;
    };
    const onMouseMove = (e: PointerEvent) => {
      let dx: number;
      let dy: number;
      if (locked.current) {
        // Pointer-lock: relative movement deltas.
        dx = e.movementX;
        dy = e.movementY;
      } else if (dragging.current && e.pointerId === lookId.current) {
        // Press-and-drag (mouse or the look finger): absolute deltas, smooth 360.
        dx = e.clientX - last.current.x;
        dy = e.clientY - last.current.y;
        last.current = { x: e.clientX, y: e.clientY };
      } else {
        return;
      }
      orbit.current.yaw -= dx * 0.0026;
      orbit.current.pitch += dy * 0.0026;
      // From looking up at the sky to almost straight down for an overhead view.
      orbit.current.pitch = Math.max(-1.15, Math.min(1.45, orbit.current.pitch));
    };
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      intro.current.active = false;
      if (e.code === "Space") e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("pointermove", onMouseMove);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("pointermove", onMouseMove);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [gl]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const k = keys.current;
    const yaw = orbit.current.yaw;
    const fX = Math.sin(yaw);
    const fZ = Math.cos(yaw);
    const rX = Math.cos(yaw);
    const rZ = -Math.sin(yaw);
    let mX = 0;
    let mZ = 0;
    if (k["KeyW"] || k["ArrowUp"]) {
      mX += fX;
      mZ += fZ;
    }
    if (k["KeyS"] || k["ArrowDown"]) {
      mX -= fX;
      mZ -= fZ;
    }
    if (k["KeyD"] || k["ArrowRight"]) {
      mX += rX;
      mZ += rZ;
    }
    if (k["KeyA"] || k["ArrowLeft"]) {
      mX -= rX;
      mZ -= rZ;
    }
    // Fold in the touch joystick on the same basis (moveY forward, moveX strafe).
    // A single key gives length >= 1, so mag = 1 and the desktop numbers are
    // unchanged; a partial joystick walks proportionally slower.
    const j = input.current;
    mX += fX * j.moveY + rX * j.moveX;
    mZ += fZ * j.moveY + rZ * j.moveX;
    const len = Math.hypot(mX, mZ);
    const mag = Math.min(1, len);
    const sprint = k["ShiftLeft"] || k["ShiftRight"] || j.sprint;
    const speed = (sprint ? SPRINT : WALK) * speedMul;
    if (len > 0) {
      mX /= len;
      mZ /= len;
      pos.current.x += mX * speed * mag * dt;
      pos.current.z += mZ * speed * mag * dt;
      face.current = Math.atan2(mX, mZ);
      bob.current += dt * speed * mag * 3.2;
    }
    // Vertical: Space rises, C or Ctrl descends. When airborne and pressing
    // neither, settle gently back to the ground, so simply releasing Space
    // always brings you down and you can never get stuck in the air.
    const climb = 9 * speedMul;
    const rising = k["Space"] || j.rise;
    const descending = k["KeyC"] || k["ControlLeft"] || k["ControlRight"] || j.descend;
    if (rising) alt.current += climb * dt;
    else if (descending) alt.current -= climb * dt;
    else if (alt.current > 0) alt.current -= Math.min(alt.current, 6 * dt);
    alt.current = Math.max(0, Math.min(150, alt.current));

    const hw = h.widthMeters / 2 - 3;
    const hh = h.heightMeters / 2 - 3;
    pos.current.x = Math.max(-hw, Math.min(hw, pos.current.x));
    pos.current.z = Math.max(-hh, Math.min(hh, pos.current.z));
    const u = pos.current.x / h.widthMeters + 0.5;
    const v = pos.current.z / h.heightMeters + 0.5;
    const ground = Math.max(elevationAt(h, u, v), 0);
    const baseY = ground + alt.current;
    pos.current.y = baseY;

    const g = group.current;
    const bobY = len > 0 && alt.current < 0.5 ? Math.abs(Math.sin(bob.current)) * 0.06 : 0;
    if (g) {
      g.position.set(pos.current.x, baseY + bobY, pos.current.z);
      g.rotation.y = face.current;
    }
    // Walk cycle: legs swing opposite each other, the free arm counter-swings.
    const swing = len > 0 ? Math.sin(bob.current) * 0.55 : 0;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.9;

    const dist = 6.5;
    const cp = Math.cos(orbit.current.pitch);
    const camX = pos.current.x - Math.sin(yaw) * dist * cp;
    const camZ = pos.current.z - Math.cos(yaw) * dist * cp;
    let camY = baseY + 2.1 + Math.sin(orbit.current.pitch) * dist;
    camY = Math.max(ground + 0.8, camY);
    if (intro.current.active) {
      // Establishing shot: start high and far behind, ease down to the follow
      // view over about four seconds (smoothstep), looking at the investor.
      intro.current.t = Math.min(1, intro.current.t + dt / 4);
      const e = intro.current.t * intro.current.t * (3 - 2 * intro.current.t);
      const ovX = pos.current.x - Math.sin(yaw) * 42;
      const ovZ = pos.current.z - Math.cos(yaw) * 42;
      const ovY = ground + 95;
      camera.position.set(ovX + (camX - ovX) * e, ovY + (camY - ovY) * e, ovZ + (camZ - ovZ) * e);
      if (intro.current.t >= 1) intro.current.active = false;
    } else {
      camera.position.set(camX, camY, camZ);
    }
    camera.lookAt(pos.current.x, baseY + EYE_HEIGHT, pos.current.z);

    since.current += dt;
    if (since.current > 0.2) {
      since.current = 0;
      onElev(ground + alt.current);
      onPose({ u, v });
    }
  });

  return (
    <group ref={group}>
      <InvestorModel legL={legL} legR={legR} armL={armL} />
    </group>
  );
}

function Scene({
  h,
  onElev,
  onPose,
  trees,
  season,
  time,
  speedMul,
  input,
  per,
  labels,
}: {
  h: Heightmap;
  onElev: (m: number) => void;
  onPose: (p: { u: number; v: number }) => void;
  trees: number[][] | null;
  season: SunSeason;
  time: SunTime;
  speedMul: number;
  input: RefObject<TouchInput>;
  per: number;
  labels: "all" | "plots";
}) {
  const geo = useMemo(() => buildTerrainGeometry(h), [h]);
  const { sunPos, gen } = useMemo(() => {
    const d = sunDirection(season, time);
    return {
      sunPos: new THREE.Vector3(d.x, d.y, d.z).multiplyScalar(4000),
      // Generation factor from the real solar altitude: about 1 at summer
      // midday, low under the winter and morning/evening sun, 0 below horizon.
      gen: Math.max(0, Math.min(1, d.y / 0.7)),
    };
  }, [season, time]);
  const warm = time === "morning" || time === "evening";
  const sunColor = warm ? "#ffd9a8" : "#fff4e0";
  const sunIntensity = season === "winter" ? 1.5 : time === "midday" ? 2.3 : 1.7;

  return (
    <>
      <color attach="background" args={["#cfe0ee"]} />
      <fog attach="fog" args={["#cfe0ee", 500, 3400]} />
      <hemisphereLight args={["#dbe9f5", "#586a48", 0.85]} />
      <directionalLight position={sunPos} intensity={sunIntensity} color={sunColor} />
      <Sky sunPosition={sunPos} turbidity={5} rayleigh={1.4} mieCoefficient={0.006} />

      <mesh geometry={geo}>
        <meshStandardMaterial vertexColors roughness={0.96} metalness={0} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[h.widthMeters * 1.8, h.heightMeters * 1.8]} />
        <meshStandardMaterial
          color="#1b4a5d"
          roughness={0.12}
          metalness={0.35}
          transparent
          opacity={0.94}
        />
      </mesh>

      {PLOTS.map((p) => {
        const [x, z] = worldXZ(h, p.u, p.v);
        const y = elevationAt(h, p.u, p.v);
        const color = STATUS_COLOR[p.status] ?? "#37a06a";
        return (
          <mesh key={p.id} position={[x, y + 3.2, z]}>
            <coneGeometry args={[2, 6.4, 18]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
              roughness={0.5}
            />
          </mesh>
        );
      })}

      {trees && trees.length ? <Trees list={trees} /> : null}
      <Houses h={h} />
      <ShowHome h={h} />
      <EnergyFlows h={h} gen={gen} per={per} />
      <PlotLabels h={h} />
      {labels === "all" ? <AmenityMarkers h={h} /> : null}

      <Investor h={h} onElev={onElev} onPose={onPose} speedMul={speedMul} input={input} />
    </>
  );
}

/**
 * A small orientation minimap, north up: the site bounds with each plot as a
 * status dot and the investor's live position.
 */
function Minimap({ pose }: { pose: { u: number; v: number } | null }) {
  return (
    <div className="pointer-events-none absolute right-2 bottom-12 rounded-md bg-black/55 p-1 sm:right-3 sm:p-1.5">
      <div className="relative h-20 w-20 overflow-hidden rounded sm:h-[130px] sm:w-[130px]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#41603a] via-[#3a5740] to-[#28506a]" />
        {PLOTS.map((p) => (
          <span
            key={p.id}
            className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-black/40"
            style={{
              left: `${p.u * 100}%`,
              top: `${p.v * 100}%`,
              background: STATUS_COLOR[p.status] ?? "#37a06a",
            }}
          />
        ))}
        {pose ? (
          <span
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-[#16c2d4]"
            style={{ left: `${pose.u * 100}%`, top: `${pose.v * 100}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * On-screen controls for touch devices: a left thumb joystick to walk and a
 * cluster of hold-buttons to rise, sprint and descend. Looking is a drag
 * anywhere else on the canvas. Rendered only on coarse-pointer devices.
 */
function TouchControls({ input }: { input: RefObject<TouchInput> }) {
  const knob = useRef<HTMLDivElement | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const R = 42;

  const start = (e: RPointerEvent<HTMLElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const move = (e: RPointerEvent<HTMLElement>) => {
    if (!origin.current) return;
    let dx = e.clientX - origin.current.x;
    let dy = e.clientY - origin.current.y;
    const d = Math.hypot(dx, dy);
    if (d > R) {
      dx = (dx / d) * R;
      dy = (dy / d) * R;
    }
    input.current.moveX = dx / R;
    input.current.moveY = -dy / R; // up the screen is forward
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const end = () => {
    origin.current = null;
    input.current.moveX = 0;
    input.current.moveY = 0;
    if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
  };
  const hold =
    (key: "sprint" | "rise" | "descend", on: boolean) => (e: RPointerEvent<HTMLElement>) => {
      if (on) e.currentTarget.setPointerCapture(e.pointerId);
      input.current[key] = on;
    };
  const noMenu = (e: { preventDefault: () => void }) => e.preventDefault();
  const btn =
    "pointer-events-auto flex h-12 w-12 touch-none items-center justify-center rounded-full bg-black/45 text-lg text-white/90 select-none active:bg-[#16c2d4] active:text-[#06222b]";

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      <div
        className="pointer-events-auto absolute bottom-5 left-4 h-24 w-24 touch-none rounded-full bg-black/30 ring-1 ring-white/15"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onContextMenu={noMenu}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div ref={knob} className="h-10 w-10 rounded-full bg-white/75" />
        </div>
      </div>
      <div className="absolute right-4 bottom-5 flex flex-col items-center gap-2">
        <button
          type="button"
          className={btn}
          onPointerDown={hold("rise", true)}
          onPointerUp={hold("rise", false)}
          onPointerCancel={hold("rise", false)}
          onContextMenu={noMenu}
          aria-label="Rise"
        >
          ↑
        </button>
        <button
          type="button"
          className={btn}
          onPointerDown={hold("sprint", true)}
          onPointerUp={hold("sprint", false)}
          onPointerCancel={hold("sprint", false)}
          onContextMenu={noMenu}
          aria-label="Sprint"
        >
          ⚡
        </button>
        <button
          type="button"
          className={btn}
          onPointerDown={hold("descend", true)}
          onPointerUp={hold("descend", false)}
          onPointerCancel={hold("descend", false)}
          onContextMenu={noMenu}
          aria-label="Descend"
        >
          ↓
        </button>
      </div>
    </div>
  );
}

export default function ExperienceWorld({
  heightmap,
  quality,
}: {
  heightmap: Heightmap;
  quality: Quality;
}) {
  const t = useTranslations("opplev");
  const tt = useTranslations("terrain");
  const [elev, setElev] = useState(0);
  const [locked, setLocked] = useState(false);
  const [trees, setTrees] = useState<number[][] | null>(null);
  const [season, setSeason] = useState<SunSeason>("summer");
  const [time, setTime] = useState<SunTime>("midday");
  const [speedMul, setSpeedMul] = useState(1);
  const [pose, setPose] = useState<{ u: number; v: number } | null>(null);
  const coarse = usePointerCoarse();
  const input = useRef<TouchInput>({
    moveX: 0,
    moveY: 0,
    sprint: false,
    rise: false,
    descend: false,
  });
  // Stable, quality-driven Canvas props (memoised so R3F never resets the camera).
  const dpr = useMemo<[number, number]>(() => [1, quality.dpr], [quality.dpr]);
  const gl = useMemo(
    () => ({ logarithmicDepthBuffer: true, antialias: quality.antialias }),
    [quality.antialias],
  );

  useEffect(() => {
    const onChange = () => setLocked(Boolean(document.pointerLockElement));
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  // Stream the real forest in after the terrain (it is the heaviest extra).
  useEffect(() => {
    let ok = true;
    fetch("/experience/trees.json")
      .then((r) => r.json())
      .then((d: { trees: number[][] }) => {
        // Thin the forest on low-tier devices to keep phones smooth.
        const list =
          quality.treeStride > 1 ? d.trees.filter((_, i) => i % quality.treeStride === 0) : d.trees;
        if (ok) setTrees(list);
      })
      .catch(() => {});
    return () => {
      ok = false;
    };
  }, [quality.treeStride]);

  return (
    <div className="relative h-full w-full">
      <Canvas
        frameloop="always"
        camera={CAMERA_PROPS}
        gl={gl}
        dpr={dpr}
        style={{ touchAction: "none" }}
      >
        <Scene
          h={heightmap}
          onElev={setElev}
          onPose={setPose}
          trees={trees}
          season={season}
          time={time}
          speedMul={speedMul}
          input={input}
          per={quality.energyPer}
          labels={quality.labels}
        />
      </Canvas>

      {coarse ? <TouchControls input={input} /> : null}

      {/* Controls hint, shown until the visitor is in pointer lock (mouse) */}
      {!locked ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-4 sm:bottom-24">
          <div className="max-w-[90%] rounded-md bg-black/55 px-3 py-1.5 text-center text-[11px] text-white sm:px-4 sm:py-2 sm:text-sm">
            {coarse ? (
              t("controls.touchHint")
            ) : (
              <>
                {t("controls.walk")} &middot; {t("controls.look")} &middot; {t("controls.sprint")}{" "}
                &middot; {t("controls.fly")}
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Live elevation, energy note and attribution. On touch screens these move
          to the top so the bottom corners are free for the joystick and buttons. */}
      <div
        className={cn(
          "pointer-events-none absolute space-y-1",
          coarse ? "top-14 left-2 max-w-[58%]" : "bottom-3 left-3",
        )}
      >
        <div className="rounded-md bg-black/55 px-2.5 py-1 text-[11px] text-white tabular-nums sm:px-3 sm:py-1.5 sm:text-xs">
          {t("hud.elevation")}: {Math.round(elev)} moh
        </div>
        <div
          className={cn(
            "max-w-sm rounded-md bg-[#0c5560]/75 px-3 py-1 text-[10px] text-white/95",
            coarse && "line-clamp-3",
          )}
        >
          {t("energyNote")}
        </div>
        <div
          className={cn(
            "max-w-sm rounded-md bg-black/45 px-3 py-1 text-[10px] text-white/85",
            coarse && "hidden",
          )}
        >
          {t("attribution")}
        </div>
      </div>
      <div
        className={cn(
          "pointer-events-none absolute rounded-md bg-[#9e4a2c]/90 font-medium text-white",
          coarse
            ? "top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px]"
            : "right-3 bottom-3 px-3 py-1 text-xs",
        )}
      >
        {t("hud.indicative")}
      </div>

      {!coarse ? <Minimap pose={pose} /> : null}

      {/* Sun control: real season and time of day for 58 N. Release the cursor
          (Esc) to click. */}
      <div className="pointer-events-auto absolute top-14 right-2 flex max-w-[calc(100%-1rem)] flex-col items-end gap-1 sm:top-20 sm:right-3 sm:gap-1.5">
        <div className="flex flex-wrap justify-end gap-0.5 rounded-md bg-black/55 p-0.5 sm:gap-1 sm:p-1">
          {(["summer", "winter"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeason(s)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] sm:px-2 sm:py-1 sm:text-xs",
                season === s
                  ? "bg-[#16c2d4] font-medium text-[#06222b]"
                  : "text-white/85 hover:text-white",
              )}
            >
              {tt(`sun.${s}`)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-end gap-0.5 rounded-md bg-black/55 p-0.5 sm:gap-1 sm:p-1">
          {(["morning", "midday", "evening"] as const).map((tm) => (
            <button
              key={tm}
              type="button"
              onClick={() => setTime(tm)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] sm:px-2 sm:py-1 sm:text-xs",
                time === tm
                  ? "bg-[#16c2d4] font-medium text-[#06222b]"
                  : "text-white/85 hover:text-white",
              )}
            >
              {tt(`sun.${tm}`)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-0.5 rounded-md bg-black/55 p-0.5 sm:gap-1 sm:p-1">
          <span className="hidden px-1 text-[10px] tracking-wide text-white/70 uppercase sm:inline">
            {t("controls.speedLabel")}
          </span>
          {([1, 5, 10, 20, 50] as const).map((mul) => (
            <button
              key={mul}
              type="button"
              onClick={() => setSpeedMul(mul)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] tabular-nums sm:py-1 sm:text-xs",
                speedMul === mul
                  ? "bg-[#16c2d4] font-medium text-[#06222b]"
                  : "text-white/85 hover:text-white",
              )}
            >
              {mul}&times;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
