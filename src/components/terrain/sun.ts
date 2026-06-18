import SunCalc from "suncalc";
import type { SunSeason, SunTime } from "./types";

export type Vec3 = { x: number; y: number; z: number };

// Snigsfjorden, Rødberg (used for an astronomically reasonable sun position).
const LAT = 58.047;
const LON = 7.273;

function dateFor(season: SunSeason, time: SunTime): Date {
  if (season === "summer") {
    const hour = { morning: 8, midday: 13, evening: 19 }[time];
    // Local time is UTC+2 in summer.
    return new Date(Date.UTC(2026, 5, 21, hour - 2, 0));
  }
  const hour = { morning: 9, midday: 12, evening: 15 }[time];
  // Local time is UTC+1 in winter.
  return new Date(Date.UTC(2026, 11, 21, hour - 1, 0));
}

/**
 * Sun direction in scene space (south is +Z, west is -X, up is +Y), from
 * suncalc at the site latitude. Altitude is clamped just above the horizon so
 * a low winter sun still lights the scene.
 */
export function sunDirection(season: SunSeason, time: SunTime): Vec3 {
  const pos = SunCalc.getPosition(dateFor(season, time), LAT, LON);
  const altitude = Math.max(pos.altitude, 0.05);
  const azimuth = pos.azimuth;
  const x = Math.cos(altitude) * -Math.sin(azimuth);
  const y = Math.sin(altitude);
  const z = Math.cos(altitude) * Math.cos(azimuth);
  const len = Math.hypot(x, y, z) || 1;
  return { x: x / len, y: y / len, z: z / len };
}

export function sunAltitudeDeg(season: SunSeason, time: SunTime): number {
  return (SunCalc.getPosition(dateFor(season, time), LAT, LON).altitude * 180) / Math.PI;
}
