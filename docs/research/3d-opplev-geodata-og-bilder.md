# Open geodata and imagery for the 3D experience (no orthophoto licence)

The owner has no Geovekst / Norge i bilder orthophoto licence, so the immersive
experience is built entirely from real, open, commercially-usable geodata. This
note records the verified sources, endpoints, licences and attribution.
Compiled 2026-06-27. Re-verify every endpoint, layer name and attribution string
before publishing; Kartverket reorganised orthophoto access as recently as
Feb 2026.

## Terrain and canopy (in use)

- Elevation (terrain), Kartverket NHM_DTM, 1 m national model, CC BY 4.0,
  commercial use allowed. ArcGIS ImageServer exportImage:
  https://hoydedata.no/arcgis/rest/services/NHM_DTM_25832/ImageServer/exportImage
  (pixelType F32, format tiff, bboxSR 4326 returns a clean striped TIFF; large
  requests return a tiled TIFF that geotiff.js cannot read, so the fetch script
  assembles the 128 px tiles by hand, see scripts/experience/fetch-terrain-hi.mjs).
- Surface model, Kartverket NHM_DOM (same service family, NHM_DOM_25832). The
  canopy height model CHM = DOM minus DTM gives real tree positions and heights
  (scripts/experience/fetch-vegetation.mjs). CC BY 4.0.
- Attribution: "Hoydedata (c) Kartverket". Both are also available via WCS
  (wcs.geonorge.no/skwms1/wcs.hoyde-dtm-nhm-25832, coverage nhm_dtm_topo_25832).
- WCS returns the same tiled TIFF, so the manual tile assembler is the path.

## Imagery options (for a future texture drape)

- Orthophoto (Norge i bilder / Geovekst) is NOT open: free viewing only, the
  open WMTS tile services were closed Feb 2026, commercial use requires a licence
  via Kartverket (post@kartverket.no) or a reseller. Not used.
- Best no-auth, commercial recent imagery: AWS Sentinel-2 L2A COGs (Element 84
  earth-search STAC at https://earth-search.aws.element84.com/v1, collection
  sentinel-2-l2a; public bucket s3://sentinel-cogs). Window-read bands B04/B03/B02
  to a true-colour drape. Licence: Copernicus, commercial OK. Attribution:
  "Contains modified Copernicus Sentinel data [year]".
- EOX s2cloudless: only the 2016 layer is CC BY 4.0 (commercial); the 2017 to
  2025 layers are CC BY-NC-SA (non-commercial), so avoid those.
- ESA WorldCover (CC BY 4.0) and Kartverket open topo raster (CC BY 4.0,
  cache.kartverket.no) are commercial-clean for a land-cover tint / fallback.
- Esri World Imagery and Mapbox/MapTiler satellite are paid/metered for
  commercial use; excluded.

Current build uses a procedural surface (slope + elevation shading) plus the
instanced forest, all from the open DTM/DOM. A Sentinel-2 or licensed-orthophoto
drape can swap in later via the imagery manifest pattern.

## Vegetation and tree models

- Land cover (where finer placement is wanted): NIBIO AR50, NLOD 1.0, commercial
  OK. WMS https://wms.nibio.no/cgi-bin/ar50_2 , arealtype codes (30 = forest),
  treslag (31 conifer, 32 deciduous, 33 mixed; verify codes in the SOSI spec).
  Attribution "(c) NIBIO". The current build seeds trees directly from the CHM,
  which is simpler and fully real.
- Commercial-clean 3D tree models if richer foliage is wanted: CC0 packs from
  Quaternius (quaternius.com), Kenney (kenney.nl/assets/nature-kit), Poly Haven
  (polyhaven.com, CC0 ground textures and HDRI). The current build uses
  procedural low-poly trees (no external assets) via InstancedMesh.

## Sea level and tides

- Datum NN2000 (the elevation models reference it); along this coast NN2000 is
  within a few cm to about 0.2 m of mean sea level. Nearest tide gauge: Tregde
  (Lindesnes), Se havniva station 1082303. Tidal range is very small (mean spring
  about 0.23 m); weather/surge dominates. For the simulation the sea is treated
  as effectively flat at NN2000. Source: kartverket.no/en/at-sea/se-havniva .

## Attribution block to ship in the experience

"(c) Kartverket (CC BY 4.0)" for terrain and canopy. Add the relevant strings if
a Sentinel-2 drape ("Contains modified Copernicus Sentinel data [year]"), ESA
WorldCover, NIBIO land cover, or CC0 models are later introduced.
