"use client";

import { useMemo } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { BufferGeometry, Color, Float32BufferAttribute, PlaneGeometry } from "three";
import {
  type Heightmap,
  type SunSeason,
  type SunTime,
  TERRAIN_SCALE,
  elevationAt,
  bearingToSea,
} from "./types";
import { sunDirection } from "./sun";
import type { Plot, PlotStatus } from "@/content/plots";

const STATUS_COLOR: Record<PlotStatus, string> = {
  ledig: "#1f6f43",
  reservert: "#8a5a00",
  solgt: "#7a3b36",
};

function buildTerrainGeometry(h: Heightmap): BufferGeometry {
  const cols = h.width;
  const rows = h.height;
  const wM = h.widthMeters * TERRAIN_SCALE;
  const hM = h.heightMeters * TERRAIN_SCALE;
  const geo = new PlaneGeometry(wM, hM, cols - 1, rows - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.getAttribute("position");
  const colors: number[] = [];
  const c = new Color();
  const low = new Color("#3f6b3a");
  const mid = new Color("#8a9a5b");
  const high = new Color("#b9b3a4");
  const sand = new Color("#cdbf9a");
  for (let i = 0; i < cols * rows; i++) {
    const z = h.z[i] ?? 0;
    pos.setY(i, z * TERRAIN_SCALE);
    if (z < 1) c.copy(sand);
    else if (z < 40) c.copy(low).lerp(mid, z / 40);
    else c.copy(mid).lerp(high, Math.min(1, (z - 40) / 130));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function plotWorld(h: Heightmap, p: Plot): [number, number, number] {
  const wM = h.widthMeters * TERRAIN_SCALE;
  const hM = h.heightMeters * TERRAIN_SCALE;
  return [(p.u - 0.5) * wM, elevationAt(h, p.u, p.v) * TERRAIN_SCALE + 0.4, (p.v - 0.5) * hM];
}

function PlotMarker({
  position,
  color,
  selected,
  onSelect,
}: {
  position: [number, number, number];
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  };
  return (
    <mesh position={position} onClick={onClick} castShadow>
      <coneGeometry args={[selected ? 0.9 : 0.7, selected ? 2.4 : 1.8, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={selected ? color : "#000000"}
        emissiveIntensity={selected ? 0.5 : 0}
      />
    </mesh>
  );
}

function Sightline({ h, plot }: { h: Heightmap; plot: Plot }) {
  const points = useMemo(() => {
    const [x, y, z] = plotWorld(h, plot);
    const bearing = bearingToSea(h, plot.u, plot.v);
    const len = (h.widthMeters * TERRAIN_SCALE) / 6;
    const end: [number, number, number] = [
      x + Math.cos(bearing) * len,
      0.3,
      z + Math.sin(bearing) * len,
    ];
    return [[x, y, z], end] as [number, number, number][];
  }, [h, plot]);
  return <Line points={points} color="#0e7c8b" lineWidth={3} dashed={false} />;
}

export default function TerrainCanvas({
  heightmap,
  plots,
  selectedId,
  onSelect,
  season,
  time,
}: {
  heightmap: Heightmap;
  plots: Plot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  season: SunSeason;
  time: SunTime;
}) {
  const geometry = useMemo(() => buildTerrainGeometry(heightmap), [heightmap]);
  const wM = heightmap.widthMeters * TERRAIN_SCALE;
  const hM = heightmap.heightMeters * TERRAIN_SCALE;
  const selected = plots.find((p) => p.id === selectedId) ?? null;
  const sunDir = useMemo(() => sunDirection(season, time), [season, time]);
  const sunPos: [number, number, number] = [sunDir.x * wM, sunDir.y * wM, sunDir.z * wM];

  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={[1, 2]}
      camera={{ position: [wM * 0.55, hM * 0.6, hM * 0.85], fov: 45 }}
      onPointerMissed={() => onSelect("")}
    >
      <color attach="background" args={["#cfe0ee"]} />
      <hemisphereLight args={["#dbe9f5", "#5b6b4a", 0.7]} />
      <directionalLight
        position={sunPos}
        intensity={2}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-wM}
        shadow-camera-right={wM}
        shadow-camera-top={wM}
        shadow-camera-bottom={-wM}
        shadow-camera-near={1}
        shadow-camera-far={wM * 4}
      />
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[wM * 1.6, hM * 1.6]} />
        <meshStandardMaterial
          color="#27607a"
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={0.92}
        />
      </mesh>
      {plots.map((p) => (
        <PlotMarker
          key={p.id}
          position={plotWorld(heightmap, p)}
          color={STATUS_COLOR[p.status]}
          selected={p.id === selectedId}
          onSelect={() => onSelect(p.id)}
        />
      ))}
      {selected ? <Sightline h={heightmap} plot={selected} /> : null}
      <OrbitControls
        enablePan={false}
        minDistance={hM * 0.3}
        maxDistance={hM * 1.6}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 4, 0]}
      />
    </Canvas>
  );
}
