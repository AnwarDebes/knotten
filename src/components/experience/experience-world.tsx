"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Sky } from "@react-three/drei";
import * as THREE from "three";
import { useTranslations } from "next-intl";
import { type Heightmap, elevationAt, bearingToSea } from "@/components/terrain/types";
import { sunDirection } from "@/components/terrain/sun";
import { PLOTS } from "@/content/plots";
import { HOUSE_TYPES } from "@/content/house-types";

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
  const sand = new THREE.Color("#c7b894");
  const low = new THREE.Color("#3f6b3a");
  const mid = new THREE.Color("#6f7d49");
  const high = new THREE.Color("#9a9384");
  const c = new THREE.Color();
  for (let i = 0; i < cols * rows; i++) {
    const z = h.z[i] ?? 0;
    pos.setY(i, z);
    if (z < 1) c.copy(sand);
    else if (z < 40) c.copy(low).lerp(mid, z / 40);
    else c.copy(mid).lerp(high, Math.min(1, (z - 40) / 130));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
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

function Houses({ h }: { h: Heightmap }) {
  const houses = useMemo(() => {
    return PLOTS.map((p, i) => {
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
      return { id: p.id, x, y, z, W, D, eaveH, yaw, roof: makeRoof(W, D, rise) };
    });
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
        </group>
      ))}
    </>
  );
}

function Player({ h, onElev }: { h: Heightmap; onElev: (m: number) => void }) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const since = useRef(0);
  const placed = useRef(false);
  const t = useMemo(
    () => ({
      d: new THREE.Vector3(),
      f: new THREE.Vector3(),
      r: new THREE.Vector3(),
      m: new THREE.Vector3(),
    }),
    [],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    // Place the walker once. The heightmap swaps from coarse to high-res under
    // the same extent, so we keep the player where they are on the swap.
    if (placed.current) return;
    placed.current = true;
    const start = PLOTS[0];
    const u = start ? start.u : 0.4;
    const v = start ? start.v : 0.55;
    const [px, pz] = worldXZ(h, u, v);
    const b = bearingToSea(h, u, v);
    // Stand back from the plot, uphill away from the sea, so the home and the
    // view down to the fjord are both ahead of the visitor.
    const bx = px - Math.cos(b) * 38;
    const bz = pz - Math.sin(b) * 38;
    const gu = bx / h.widthMeters + 0.5;
    const gv = bz / h.heightMeters + 0.5;
    const y = Math.max(elevationAt(h, gu, gv), 0) + EYE_HEIGHT;
    camera.position.set(bx, y, bz);
    camera.lookAt(px, y - 8, pz);
  }, [h, camera]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const k = keys.current;
    camera.getWorldDirection(t.d);
    t.f.set(t.d.x, 0, t.d.z).normalize();
    t.r.set(-t.f.z, 0, t.f.x);
    t.m.set(0, 0, 0);
    if (k["KeyW"] || k["ArrowUp"]) t.m.add(t.f);
    if (k["KeyS"] || k["ArrowDown"]) t.m.addScaledVector(t.f, -1);
    if (k["KeyD"] || k["ArrowRight"]) t.m.add(t.r);
    if (k["KeyA"] || k["ArrowLeft"]) t.m.addScaledVector(t.r, -1);
    const speed = k["ShiftLeft"] || k["ShiftRight"] ? SPRINT : WALK;
    if (t.m.lengthSq() > 0) {
      t.m.normalize().multiplyScalar(speed * dt);
      camera.position.x += t.m.x;
      camera.position.z += t.m.z;
    }
    const hw = h.widthMeters / 2 - 3;
    const hh = h.heightMeters / 2 - 3;
    camera.position.x = Math.max(-hw, Math.min(hw, camera.position.x));
    camera.position.z = Math.max(-hh, Math.min(hh, camera.position.z));
    const u = camera.position.x / h.widthMeters + 0.5;
    const v = camera.position.z / h.heightMeters + 0.5;
    const ground = Math.max(elevationAt(h, u, v), 0);
    camera.position.y = ground + EYE_HEIGHT;
    since.current += dt;
    if (since.current > 0.2) {
      since.current = 0;
      onElev(ground);
    }
  });

  return null;
}

function Scene({
  h,
  onElev,
  trees,
}: {
  h: Heightmap;
  onElev: (m: number) => void;
  trees: number[][] | null;
}) {
  const geo = useMemo(() => buildTerrainGeometry(h), [h]);
  const sunPos = useMemo(() => {
    const d = sunDirection("summer", "midday");
    return new THREE.Vector3(d.x, d.y, d.z).multiplyScalar(4000);
  }, []);

  return (
    <>
      <color attach="background" args={["#cfe0ee"]} />
      <fog attach="fog" args={["#cfe0ee", 500, 3400]} />
      <hemisphereLight args={["#dbe9f5", "#586a48", 0.85]} />
      <directionalLight position={sunPos} intensity={2.1} color="#fff4e0" />
      <Sky sunPosition={sunPos} turbidity={5} rayleigh={1.4} mieCoefficient={0.006} />

      <mesh geometry={geo}>
        <meshStandardMaterial vertexColors roughness={0.96} metalness={0} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[h.widthMeters * 1.6, h.heightMeters * 1.6]} />
        <meshStandardMaterial
          color="#27607a"
          roughness={0.22}
          metalness={0.08}
          transparent
          opacity={0.93}
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

      <PointerLockControls />
      <Player h={h} onElev={onElev} />
    </>
  );
}

export default function ExperienceWorld({ heightmap }: { heightmap: Heightmap }) {
  const t = useTranslations("opplev");
  const [elev, setElev] = useState(0);
  const [locked, setLocked] = useState(false);
  const [trees, setTrees] = useState<number[][] | null>(null);

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
      <Canvas
        camera={{ fov: 70, near: 0.1, far: 7000, position: [0, 100, 0] }}
        gl={{ logarithmicDepthBuffer: true, antialias: true }}
        dpr={[1, 2]}
      >
        <Scene h={heightmap} onElev={setElev} trees={trees} />
      </Canvas>

      {/* Click-to-look hint, shown while the cursor is free */}
      {!locked ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-4">
          <div className="rounded-md bg-black/55 px-4 py-2 text-center text-sm text-white">
            {t("controls.walk")} &middot; {t("controls.look")} &middot; {t("controls.sprint")}
          </div>
        </div>
      ) : null}

      {/* Bottom HUD: live elevation + attribution (left), indicative badge (right) */}
      <div className="pointer-events-none absolute bottom-3 left-3 space-y-1">
        <div className="rounded-md bg-black/55 px-3 py-1.5 text-xs text-white tabular-nums">
          {t("hud.elevation")}: {Math.round(elev)} moh
        </div>
        <div className="max-w-sm rounded-md bg-black/45 px-3 py-1 text-[10px] text-white/85">
          {t("attribution")}
        </div>
      </div>
      <div className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-[#9e4a2c]/90 px-3 py-1 text-xs font-medium text-white">
        {t("hud.indicative")}
      </div>
    </div>
  );
}
