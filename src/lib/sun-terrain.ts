import SunCalc from "suncalc";
import { elevationAt, type Heightmap } from "@/components/terrain/types";

/**
 * Clear-sky sun geometry plus terrain occlusion against the real Kartverket DTM.
 * Used to estimate how much direct sun each plot gets across the year. This is
 * an indicative estimate: clear-sky geometry and terrain only, no cloud cover,
 * vegetation or future buildings.
 */

// Snigsfjorden, Rødberg.
export const SITE_LAT = 58.047;
export const SITE_LON = 7.273;

const EYE_HEIGHT_M = 2;

export type SunPosition = { altitude: number; azimuth: number };

export function sunPositionAt(date: Date, lat = SITE_LAT, lon = SITE_LON): SunPosition {
  const p = SunCalc.getPosition(date, lat, lon);
  return { altitude: p.altitude, azimuth: p.azimuth };
}

/**
 * True when terrain blocks the line of sight from a plot to the sun. The grid
 * runs u east (columns) and v south (rows); suncalc azimuth is measured from
 * south toward west, so the horizontal step toward the sun is (-sin az, cos az).
 */
export function isSunOccluded(
  h: Heightmap,
  u: number,
  v: number,
  azimuth: number,
  altitude: number,
): boolean {
  if (altitude <= 0) return true;
  const e0 = elevationAt(h, u, v) + EYE_HEIGHT_M;
  const dCol = -Math.sin(azimuth);
  const dRow = Math.cos(azimuth);
  const cellMeters = h.widthMeters / (h.width - 1);
  const c0 = u * (h.width - 1);
  const r0 = v * (h.height - 1);
  const tan = Math.tan(altitude);
  for (let k = 1; k < h.width; k++) {
    const c = c0 + dCol * k;
    const r = r0 + dRow * k;
    if (c < 0 || c > h.width - 1 || r < 0 || r > h.height - 1) break;
    const terr = elevationAt(h, c / (h.width - 1), r / (h.height - 1));
    const rayZ = e0 + k * cellMeters * tan;
    if (terr > rayZ) return true;
  }
  return false;
}

/** A representative clear day at the site for a season (UTC midnight start). */
export function representativeDay(season: "summer" | "winter"): Date {
  return season === "summer" ? new Date(Date.UTC(2026, 5, 21)) : new Date(Date.UTC(2026, 11, 21));
}

/**
 * Estimated hours of direct sun on a plot for a representative day, sampling at
 * stepMinutes and counting intervals where the sun is above the horizon and not
 * occluded by terrain.
 */
export function directSunHours(
  h: Heightmap,
  u: number,
  v: number,
  day: Date,
  stepMinutes = 20,
): number {
  let minutes = 0;
  const base = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    const date = new Date(base + m * 60_000);
    const { altitude, azimuth } = sunPositionAt(date);
    if (altitude > 0 && !isSunOccluded(h, u, v, azimuth, altitude)) minutes += stepMinutes;
  }
  return Math.round((minutes / 60) * 10) / 10;
}

export type DaypartState = {
  label: "morning" | "midday" | "evening";
  sunlit: boolean;
  altitudeDeg: number;
};

/** Local clock hours for each daypart, by season (UTC offset folded in). */
function daypartDate(
  day: Date,
  season: "summer" | "winter",
  part: "morning" | "midday" | "evening",
): Date {
  const offset = season === "summer" ? 2 : 1;
  const localHour =
    season === "summer"
      ? { morning: 8, midday: 13, evening: 19 }[part]
      : { morning: 9, midday: 12, evening: 15 }[part];
  return new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), localHour - offset),
  );
}

/** Sun-or-shadow state for each daypart of a representative day. */
export function daypartStates(
  h: Heightmap,
  u: number,
  v: number,
  season: "summer" | "winter",
): DaypartState[] {
  const day = representativeDay(season);
  const parts: DaypartState["label"][] = ["morning", "midday", "evening"];
  return parts.map((label) => {
    const { altitude, azimuth } = sunPositionAt(daypartDate(day, season, label));
    const sunlit = altitude > 0 && !isSunOccluded(h, u, v, azimuth, altitude);
    return { label, sunlit, altitudeDeg: Math.round((altitude * 180) / Math.PI) };
  });
}
