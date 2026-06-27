# SPEC-28: Terrain and vegetation asset pipeline

## Purpose

The experience must stand on real ground, not invented landform. This spec builds
the offline pipeline that turns Kartverket open elevation data into the assets the
world renders: a high-resolution terrain heightmap and a real forest derived from
the canopy height model. Everything is open, commercially licensed and
self-hosted, so the build needs no orthophoto licence and the content security
policy stays clean.

## Scope

- `scripts/experience/fetch-terrain-hi.mjs`: fetch a 1024x1024 DTM tile for the site bbox from Kartverket NHM_DTM, assemble the tiled GeoTIFF by hand (geotiff.js cannot read the tiled layout), and write a minified `public/experience/terrain-hi.json`.
- `scripts/experience/fetch-vegetation.mjs`: fetch the matching NHM_DOM surface model, compute the canopy height model CHM = DOM minus DTM, and seed real instanced trees where canopy rises above about 2.5 m, writing `public/experience/trees.json` ([x, groundY, z, height, kind]).
- Keep clearings around each plot so the indicative homes are not buried in forest.
- Document the open-data sources, endpoints, licences and attribution in `docs/research/3d-opplev-geodata-og-bilder.md`.

## Dependencies

- SPEC-27 (the route and `public/experience/` location).
- Kartverket Hoydedata ImageServer (NHM_DTM, NHM_DOM), EPSG:25832, CC BY 4.0; geotiff.js for parsing.

## Data

- Only open public geodata. Attribution "Hoydedata (c) Kartverket" ships in the world HUD.
- The site bbox `7.250,58.034,7.296,58.060` and the elevation datum NN2000.

## Acceptance criteria

- [x] A high-resolution terrain heightmap is fetched and stored as a static asset.
- [x] A real forest is derived from the canopy height model and stored as instanced tree data.
- [x] Trees are kept clear of the plots.
- [x] Sources, licences and attribution are documented and re-verifiable.

## Task checklist

- [x] Write and run the high-resolution DTM fetch with manual tile assembly.
- [x] Write and run the DOM/CHM vegetation derivation with plot clearings.
- [x] Record the geodata research note with primary sources.

## Guardrails

- Licensing: terrain and canopy are CC BY 4.0 with exact attribution; no orthophoto licence is required.
- Honesty: vegetation placement is derived from real canopy data but is still indicative at the individual-tree level.
- Re-verify every endpoint and attribution string against the primary source before publishing.

## Out of scope

- An orthophoto or satellite imagery drape (documented as a future swap via a manifest; the current build uses procedural surface shading plus the instanced forest).
- KTX2/Draco compression and tile pyramids (not needed at the current asset sizes).
