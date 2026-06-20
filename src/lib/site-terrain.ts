import raw from "../../public/terrain/heightmap.json";
import type { Heightmap } from "@/components/terrain/types";
import { directSunHours, representativeDay } from "./sun-terrain";

/**
 * Server-side per-plot sun summary using the real Kartverket terrain, for the
 * static per-plot pages. Pure computation, safe at build time. Indicative.
 */
const heightmap = raw as Heightmap;

export function plotSunSummary(u: number, v: number): { june: number; december: number } {
  return {
    june: directSunHours(heightmap, u, v, representativeDay("summer")),
    december: directSunHours(heightmap, u, v, representativeDay("winter")),
  };
}
