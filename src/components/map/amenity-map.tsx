"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { SITE, type Amenity } from "@/content/amenities";

/**
 * Interactive map over OpenStreetMap raster tiles. License-clean (OSM ODbL,
 * attributed), no third-party routing or trackers. Code-split and loaded on
 * demand, so it never enters the initial bundle. The server-rendered amenity
 * list is the accessible, crawlable fallback.
 */

const CATEGORY_COLOR: Record<string, string> = {
  dagligvare: "#1f6f43",
  barnehage: "#8a5a00",
  skole: "#8a5a00",
  by: "#0b6470",
  fyr: "#b3261e",
  sjo: "#0b6470",
  tur: "#1f6f43",
};

export default function AmenityMap({ amenities, en }: { amenities: Amenity[]; en: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const tileUrl =
      process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

    const map = new maplibregl.Map({
      container: ref.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [tileUrl],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [SITE.lng, SITE.lat],
      zoom: 10,
      attributionControl: { compact: false },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const bounds = new maplibregl.LngLatBounds([SITE.lng, SITE.lat], [SITE.lng, SITE.lat]);

    // The area marker.
    new maplibregl.Marker({ color: "#0b2236" })
      .setLngLat([SITE.lng, SITE.lat])
      .setPopup(new maplibregl.Popup({ offset: 24 }).setText(SITE.label))
      .addTo(map);

    for (const a of amenities) {
      bounds.extend([a.lng, a.lat]);
      const name = en ? a.nameEn : a.nameNo;
      const dist =
        a.distanceKm != null && a.driveMin != null
          ? `ca. ${a.distanceKm} km / ${a.driveMin} min`
          : en
            ? "in the area"
            : "i nærområdet";
      const flag = a.confirmed ? "" : en ? " (to be confirmed)" : " (bekreftes)";
      new maplibregl.Marker({ color: CATEGORY_COLOR[a.category] ?? "#0b6470" })
        .setLngLat([a.lng, a.lat])
        .setPopup(new maplibregl.Popup({ offset: 24 }).setText(`${name}: ${dist}${flag}`))
        .addTo(map);
    }

    map.once("load", () => map.fitBounds(bounds, { padding: 60, maxZoom: 11, duration: 0 }));
    return () => map.remove();
  }, [amenities, en]);

  return (
    <div ref={ref} className="border-border h-[28rem] w-full overflow-hidden rounded-lg border" />
  );
}
