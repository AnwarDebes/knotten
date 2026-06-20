/**
 * Neighbourhood amenities for the "Livet her" map. Real places only, from the
 * verified location note (docs/research/beliggenhet-rodberg-lindesnes.md).
 *
 * Distances and times are indicative router values anchored to Vigeland (the
 * nearest service centre, about 4 km north of the area), so they are labelled
 * "ca." and rounded; add a few minutes from the area itself. Coordinates are
 * approximate for real places. The exact area coordinate and which school is
 * the nærskole are not yet confirmed, flagged here and in INPUTS-NEEDED.
 */

export type AmenityCategory = "dagligvare" | "barnehage" | "skole" | "by" | "fyr" | "sjo" | "tur";

export type Amenity = {
  id: string;
  category: AmenityCategory;
  nameNo: string;
  nameEn: string;
  lat: number;
  lng: number;
  distanceKm: number | null;
  driveMin: number | null;
  source: string;
  verified: string; // ISO month
  confirmed: boolean; // false renders a "bekreftes" marker
};

// Approximate area centre (placeholder until survey; same point the terrain uses).
export const SITE = { lat: 58.047, lng: 7.273, label: "Knotten" } as const;

export const AMENITIES: Amenity[] = [
  {
    id: "spar-vigeland",
    category: "dagligvare",
    nameNo: "Dagligvare (SPAR Vigeland)",
    nameEn: "Groceries (SPAR Vigeland)",
    lat: 58.0835,
    lng: 7.3015,
    distanceKm: 5,
    driveMin: 7,
    source: "spar.no",
    verified: "2026-06",
    confirmed: true,
  },
  {
    id: "espira-barnehage",
    category: "barnehage",
    nameNo: "Barnehage (Espira Lindesnes)",
    nameEn: "Kindergarten (Espira Lindesnes)",
    lat: 58.081,
    lng: 7.303,
    distanceKm: 5,
    driveMin: 7,
    source: "Lindesnes kommune",
    verified: "2026-06",
    confirmed: true,
  },
  {
    id: "nyplass-skole",
    category: "skole",
    nameNo: "Barneskole (Nyplass)",
    nameEn: "Primary school (Nyplass)",
    lat: 58.082,
    lng: 7.298,
    distanceKm: 5,
    driveMin: 7,
    source: "nyplass-skole.no",
    verified: "2026-06",
    confirmed: false,
  },
  {
    id: "mandal",
    category: "by",
    nameNo: "Mandal sentrum",
    nameEn: "Mandal town centre",
    lat: 58.027,
    lng: 7.456,
    distanceKm: 13,
    driveMin: 14,
    source: "rome2rio (fra Vigeland)",
    verified: "2026-06",
    confirmed: true,
  },
  {
    id: "kristiansand",
    category: "by",
    nameNo: "Kristiansand",
    nameEn: "Kristiansand",
    lat: 58.146,
    lng: 7.9956,
    distanceKm: 49,
    driveMin: 41,
    source: "rome2rio (fra Vigeland)",
    verified: "2026-06",
    confirmed: true,
  },
  {
    id: "lindesnes-fyr",
    category: "fyr",
    nameNo: "Lindesnes fyr",
    nameEn: "Lindesnes lighthouse",
    lat: 57.984,
    lng: 7.0476,
    distanceKm: 27,
    driveMin: 28,
    source: "rome2rio (fra Vigeland)",
    verified: "2026-06",
    confirmed: true,
  },
  {
    id: "sjoetilgang",
    category: "sjo",
    nameNo: "Sjøtilgang ved Sniksfjorden",
    nameEn: "Sea access at Sniksfjorden",
    lat: 58.052,
    lng: 7.27,
    distanceKm: 1,
    driveMin: 3,
    source: "Kartverket (område)",
    verified: "2026-06",
    confirmed: false,
  },
  {
    id: "turstier",
    category: "tur",
    nameNo: "Turstier i nærområdet",
    nameEn: "Walking trails nearby",
    lat: 58.048,
    lng: 7.265,
    distanceKm: null,
    driveMin: null,
    source: "Lindesnes kommune",
    verified: "2026-06",
    confirmed: false,
  },
];
