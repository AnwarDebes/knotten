# SPEC-28 completion note

## What was built

The offline pipeline that turns Kartverket open elevation data into the assets
the world renders, all open, commercially licensed and self-hosted.

- **Terrain**: `scripts/experience/fetch-terrain-hi.mjs` fetches a 1024x1024 DTM tile from Kartverket NHM_DTM and assembles the tiled GeoTIFF by hand (geotiff.js cannot read the tiled layout), writing a minified `public/experience/terrain-hi.json`.
- **Vegetation**: `scripts/experience/fetch-vegetation.mjs` fetches the matching NHM_DOM surface model, computes the canopy height model CHM = DOM minus DTM, and seeds about 16,000 real instanced trees where canopy exceeds about 2.5 m, writing `public/experience/trees.json`; clearings are kept around each plot.
- **Documentation**: `docs/research/3d-opplev-geodata-og-bilder.md` records every source, endpoint, licence and attribution, with a re-verify caveat.

## Verification

- Both scripts run and write the expected assets; the DOM raster matches the DTM extent.
- The world loads the assets and renders the real landform and forest with no console errors.

## Deferred (documented, not blocking)

An orthophoto or Sentinel-2 imagery drape (with KTX2/Draco tiles and a manifest) is documented as a future swap; the current build uses procedural surface shading plus the instanced forest, which needs no imagery licence.
