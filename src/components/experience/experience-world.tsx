"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
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
import { HOUSE_TYPES } from "@/content/house-types";
import { AMENITIES, SITE } from "@/content/amenities";

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
const GL_PROPS = { logarithmicDepthBuffer: true, antialias: true };
const DPR: [number, number] = [1, 2];

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

/**
 * Indicative house massing, generated from the placeholder house-type envelopes
 * and the real Norwegian small-house rules: about 6 m eaves, a gable saltak kept
 * under the 9 m ridge limit (pbl 29-4), white Sorlandet timber. Clearly not a
 * final design; the count, placement and form change with the zoning plan. One
 * home per placeholder plot for now.
 */
function makeRoof(W: number, D: number, rise: number): THREE.ExtrudeGeometry {
  const ov = 0.35; // eave overhang
  const s = new THREE.Shape();
  s.moveTo(-W / 2 - ov, 0);
  s.lineTo(W / 2 + ov, 0);
  s.lineTo(0, rise);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: D + 2 * ov, bevelEnabled: false });
  g.translate(0, 0, -(D + 2 * ov) / 2);
  g.computeVertexNormals();
  return g;
}

/**
 * Indicative rooftop solar, a dark-glass panel array laid on one roof slope at
 * the real pitch. The PV concept is real (about 1010 kWh/kWp at 58 N); the panel
 * placement is indicative, like the massing.
 */
function RoofPanels({ W, D, eaveH, rise }: { W: number; D: number; eaveH: number; rise: number }) {
  const a = Math.atan2(rise, W / 2);
  const len = Math.hypot(W / 2, rise) * 0.78;
  const dep = D * 0.62;
  const cy = eaveH + rise / 2 + Math.cos(a) * 0.12;
  const dx = W / 4 + Math.sin(a) * 0.12;
  return (
    <>
      <mesh position={[dx, cy, 0]} rotation={[0, 0, -a]}>
        <boxGeometry args={[len, 0.14, dep]} />
        <meshStandardMaterial
          color="#1f5aa8"
          metalness={0.6}
          roughness={0.16}
          emissive="#1b3f73"
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh position={[-dx, cy, 0]} rotation={[0, 0, a]}>
        <boxGeometry args={[len, 0.14, dep]} />
        <meshStandardMaterial
          color="#1f5aa8"
          metalness={0.6}
          roughness={0.16}
          emissive="#1b3f73"
          emissiveIntensity={0.35}
        />
      </mesh>
    </>
  );
}

function Houses({ h }: { h: Heightmap }) {
  const houses = useMemo(() => {
    // Skip the first plot, which is rendered as the enterable show-home.
    const out = [];
    for (let i = 1; i < PLOTS.length; i++) {
      const p = PLOTS[i];
      if (!p) continue;
      const ht = HOUSE_TYPES[i % HOUSE_TYPES.length];
      const foot = ht ? ht.footprintM2 : 90;
      const area = ht ? ht.heatedAreaM2 : 140;
      const W = Math.sqrt(foot * 1.35);
      const D = foot / W;
      const storeys = area / foot > 1.55 ? 2 : 1;
      const eaveH = storeys === 2 ? 5.8 : 3.2;
      const rise = Math.min((W / 2) * Math.tan((38 * Math.PI) / 180), 9 - eaveH);
      const [x, z] = worldXZ(h, p.u, p.v);
      const y = elevationAt(h, p.u, p.v) - 0.3;
      const yaw = -bearingToSea(h, p.u, p.v) + Math.PI / 2;
      out.push({ id: p.id, x, y, z, W, D, eaveH, rise, yaw, roof: makeRoof(W, D, rise) });
    }
    return out;
  }, [h]);

  return (
    <>
      {houses.map((ho) => (
        <group key={ho.id} position={[ho.x, ho.y, ho.z]} rotation={[0, ho.yaw, 0]}>
          <mesh position={[0, ho.eaveH / 2, 0]}>
            <boxGeometry args={[ho.W, ho.eaveH, ho.D]} />
            <meshStandardMaterial color="#edefea" roughness={0.82} metalness={0} />
          </mesh>
          <mesh position={[0, ho.eaveH, 0]} geometry={ho.roof}>
            <meshStandardMaterial color="#3a4047" roughness={0.7} metalness={0} />
          </mesh>
          <RoofPanels W={ho.W} D={ho.D} eaveH={ho.eaveH} rise={ho.rise} />
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

/**
 * The energy concept, in motion. Glowing particles flow from each home up to a
 * shared hub, an indicative picture of the rooftop solar feeding the local
 * energy sharing (plusskunde up to 1 MW per property). The figures are real
 * (PVGIS about 1010 kWh/kWp at 58 N); the layout is indicative. Under reduced
 * motion the particles are placed once and held still. The flow speeds up and
 * brightens with the sun (gen, from the real solar altitude), so the energy
 * visibly tracks generation as the season and time of day change.
 */
function EnergyFlows({ h, gen }: { h: Heightmap; gen: number }) {
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

  const PER = 10;
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
 * One enterable show-home at the start plot: floor, walls, a doorway and a large
 * sea-facing picture window, so a visitor can step inside and look out to the
 * fjord. Clearly indicative, like all the massing. Walls are double-sided so the
 * interior reads; there is no collision, so the visitor simply walks in.
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
  const W = 11;
  const D = 8.5;
  const eaveH = 5.6;
  const t2 = 0.2;
  const rise = Math.min((W / 2) * Math.tan((38 * Math.PI) / 180), 9 - eaveH);
  const roof = useMemo(() => makeRoof(W, D, rise), [rise]);
  const back = W / 2 - 0.6; // back-wall panel width (1.2 m doorway gap)

  return (
    <group position={[cfg.x, cfg.y, cfg.z]} rotation={[0, cfg.yaw, 0]}>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#a9854f" roughness={0.75} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, eaveH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#e7e9e4" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-W / 2, eaveH / 2, 0]}>
        <boxGeometry args={[t2, eaveH, D]} />
        <meshStandardMaterial color="#edefea" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[W / 2, eaveH / 2, 0]}>
        <boxGeometry args={[t2, eaveH, D]} />
        <meshStandardMaterial color="#edefea" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-(W / 4 + 0.3), eaveH / 2, -D / 2]}>
        <boxGeometry args={[back, eaveH, t2]} />
        <meshStandardMaterial color="#edefea" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[W / 4 + 0.3, eaveH / 2, -D / 2]}>
        <boxGeometry args={[back, eaveH, t2]} />
        <meshStandardMaterial color="#edefea" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      {/* sea-facing wall: a low sill and a glass picture window */}
      <mesh position={[0, 0.45, D / 2]}>
        <boxGeometry args={[W, 0.9, t2]} />
        <meshStandardMaterial color="#edefea" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, (eaveH + 0.9) / 2, D / 2]}>
        <boxGeometry args={[W - 0.4, eaveH - 0.9, 0.08]} />
        <meshStandardMaterial
          color="#9fd0e0"
          transparent
          opacity={0.26}
          roughness={0.05}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, eaveH, 0]} geometry={roof}>
        <meshStandardMaterial color="#3a4047" roughness={0.7} />
      </mesh>
      <RoofPanels W={W} D={D} eaveH={eaveH} rise={rise} />
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
function InvestorModel() {
  const suit = "#2a3346";
  const suitDark = "#232b3b";
  const skin = "#d8a878";
  return (
    <group>
      <mesh position={[-0.12, 0.46, 0]}>
        <boxGeometry args={[0.2, 0.92, 0.24]} />
        <meshStandardMaterial color={suitDark} roughness={0.85} />
      </mesh>
      <mesh position={[0.12, 0.46, 0]}>
        <boxGeometry args={[0.2, 0.92, 0.24]} />
        <meshStandardMaterial color={suitDark} roughness={0.85} />
      </mesh>
      <mesh position={[-0.12, 0.05, 0.06]}>
        <boxGeometry args={[0.22, 0.12, 0.36]} />
        <meshStandardMaterial color="#141619" roughness={0.5} />
      </mesh>
      <mesh position={[0.12, 0.05, 0.06]}>
        <boxGeometry args={[0.22, 0.12, 0.36]} />
        <meshStandardMaterial color="#141619" roughness={0.5} />
      </mesh>
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
      <mesh position={[-0.37, 1.22, 0]}>
        <boxGeometry args={[0.16, 0.66, 0.22]} />
        <meshStandardMaterial color={suit} roughness={0.78} />
      </mesh>
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
  speedMul,
}: {
  h: Heightmap;
  onElev: (m: number) => void;
  speedMul: number;
}) {
  const { camera, gl } = useThree();
  const group = useRef<THREE.Group | null>(null);
  const keys = useRef<Record<string, boolean>>({});
  const locked = useRef(false);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const placed = useRef(false);
  const since = useRef(0);
  const bob = useRef(0);
  const pos = useRef(new THREE.Vector3());
  const alt = useRef(0); // metres above the terrain (fly-up survey)
  const face = useRef(0); // figure heading
  const orbit = useRef({ yaw: Math.PI, pitch: 0.22 });

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
  }, [h]);

  useEffect(() => {
    const dom = gl.domElement;
    // Two ways to look, both smooth and unbounded (a full 360 with no snap):
    // press and drag, or click once to capture the mouse (pointer lock).
    const onPointerDown = (e: PointerEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      if (document.pointerLockElement !== dom) {
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
    const onPointerUp = () => {
      dragging.current = false;
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
      } else if (dragging.current) {
        // Press-and-drag: absolute cursor deltas, so a full 360 stays smooth.
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
      if (e.code === "Space") e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("pointermove", onMouseMove);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
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
    const len = Math.hypot(mX, mZ);
    const sprint = k["ShiftLeft"] || k["ShiftRight"];
    const speed = (sprint ? SPRINT : WALK) * speedMul;
    if (len > 0) {
      mX /= len;
      mZ /= len;
      pos.current.x += mX * speed * dt;
      pos.current.z += mZ * speed * dt;
      face.current = Math.atan2(mX, mZ);
      bob.current += dt * speed * 1.7;
    }
    const climb = 9 * speedMul;
    if (k["Space"]) alt.current += climb * dt;
    if (k["KeyC"] || k["ControlLeft"]) alt.current -= climb * dt;
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

    const dist = 6.5;
    const cp = Math.cos(orbit.current.pitch);
    const camX = pos.current.x - Math.sin(yaw) * dist * cp;
    const camZ = pos.current.z - Math.cos(yaw) * dist * cp;
    let camY = baseY + 2.1 + Math.sin(orbit.current.pitch) * dist;
    camY = Math.max(ground + 0.8, camY);
    camera.position.set(camX, camY, camZ);
    camera.lookAt(pos.current.x, baseY + EYE_HEIGHT, pos.current.z);

    since.current += dt;
    if (since.current > 0.2) {
      since.current = 0;
      onElev(ground + alt.current);
    }
  });

  return (
    <group ref={group}>
      <InvestorModel />
    </group>
  );
}

function Scene({
  h,
  onElev,
  trees,
  season,
  time,
  speedMul,
}: {
  h: Heightmap;
  onElev: (m: number) => void;
  trees: number[][] | null;
  season: SunSeason;
  time: SunTime;
  speedMul: number;
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
      <EnergyFlows h={h} gen={gen} />
      <PlotLabels h={h} />
      <AmenityMarkers h={h} />

      <Investor h={h} onElev={onElev} speedMul={speedMul} />
    </>
  );
}

export default function ExperienceWorld({ heightmap }: { heightmap: Heightmap }) {
  const t = useTranslations("opplev");
  const tt = useTranslations("terrain");
  const [elev, setElev] = useState(0);
  const [locked, setLocked] = useState(false);
  const [trees, setTrees] = useState<number[][] | null>(null);
  const [season, setSeason] = useState<SunSeason>("summer");
  const [time, setTime] = useState<SunTime>("midday");
  const [speedMul, setSpeedMul] = useState(1);

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
        if (ok) setTrees(d.trees);
      })
      .catch(() => {});
    return () => {
      ok = false;
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <Canvas frameloop="always" camera={CAMERA_PROPS} gl={GL_PROPS} dpr={DPR}>
        <Scene
          h={heightmap}
          onElev={setElev}
          trees={trees}
          season={season}
          time={time}
          speedMul={speedMul}
        />
      </Canvas>

      {/* Click-to-look hint, shown while the cursor is free */}
      {!locked ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-4">
          <div className="rounded-md bg-black/55 px-4 py-2 text-center text-sm text-white">
            {t("controls.walk")} &middot; {t("controls.look")} &middot; {t("controls.sprint")}{" "}
            &middot; {t("controls.fly")}
          </div>
        </div>
      ) : null}

      {/* Bottom HUD: live elevation + attribution (left), indicative badge (right) */}
      <div className="pointer-events-none absolute bottom-3 left-3 space-y-1">
        <div className="rounded-md bg-black/55 px-3 py-1.5 text-xs text-white tabular-nums">
          {t("hud.elevation")}: {Math.round(elev)} moh
        </div>
        <div className="max-w-sm rounded-md bg-[#0c5560]/75 px-3 py-1 text-[10px] text-white/95">
          {t("energyNote")}
        </div>
        <div className="max-w-sm rounded-md bg-black/45 px-3 py-1 text-[10px] text-white/85">
          {t("attribution")}
        </div>
      </div>
      <div className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-[#9e4a2c]/90 px-3 py-1 text-xs font-medium text-white">
        {t("hud.indicative")}
      </div>

      {/* Sun control: real season and time of day for 58 N. Release the cursor
          (Esc) to click. */}
      <div className="pointer-events-auto absolute top-20 right-3 flex flex-col items-end gap-1.5">
        <div className="flex gap-1 rounded-md bg-black/55 p-1">
          {(["summer", "winter"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeason(s)}
              className={cn(
                "rounded px-2 py-1 text-xs",
                season === s
                  ? "bg-[#16c2d4] font-medium text-[#06222b]"
                  : "text-white/85 hover:text-white",
              )}
            >
              {tt(`sun.${s}`)}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-md bg-black/55 p-1">
          {(["morning", "midday", "evening"] as const).map((tm) => (
            <button
              key={tm}
              type="button"
              onClick={() => setTime(tm)}
              className={cn(
                "rounded px-2 py-1 text-xs",
                time === tm
                  ? "bg-[#16c2d4] font-medium text-[#06222b]"
                  : "text-white/85 hover:text-white",
              )}
            >
              {tt(`sun.${tm}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-md bg-black/55 p-1">
          <span className="px-1 text-[10px] tracking-wide text-white/70 uppercase">
            {t("controls.speedLabel")}
          </span>
          {([1, 2, 3] as const).map((mul) => (
            <button
              key={mul}
              type="button"
              onClick={() => setSpeedMul(mul)}
              className={cn(
                "rounded px-2 py-1 text-xs tabular-nums",
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
