import { MAP, mapIn, type MapKey } from "@/lib/content/maps";

/**
 * Maps and drawings from the project owner. Shown at native size, never upscaled. The maps themselves, in both
 * languages, are src/lib/content/maps.ts (mapIn(key, "en") for English); MAPS here is the Norwegian list in the
 * shape the Klassisk pages have always read.
 */
export type MapImg = { src: string; w: number; h: number; alt: string; title: string; text: string; credit: string };

export const MAPS: Record<MapKey, MapImg> = Object.fromEntries((Object.keys(MAP) as MapKey[]).map((k) => [k, mapIn(k, "no")])) as Record<MapKey, MapImg>;
