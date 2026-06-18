## Terrain and geodata sources

This note documents verified terrain and map data for two artefacts: a 3D terrain/plot showpiece and an interactive neighbourhood map.

### Elevation: Kartverket Hoydedata (DTM and DOM)

The Nasjonal detaljert hoydemodell (NDH, 2016-2022) provides LiDAR-derived terrain (DTM) and surface (DOM) models in 1 m grid (also 10 m and 50 m) on land. Data is free for both commercial and non-commercial use under Creative Commons Attribution 4.0 International (CC BY 4.0). The requested credit is "(c) Kartverket" with a link where possible; a single collective credit page is acceptable.

Access paths:

- REST elevation lookup: `https://ws.geonorge.no/hoydedata/v1/` (use `/punkt`), no login required.
- ArcGIS REST ImageServer (DTM, DOM, NHM per EPSG 25832/25833/25835): `https://hoydedata.no/arcgis/rest/services`.
- WCS (raster cell values for meshing): `https://wcs.geonorge.no/` (GetCapabilities then GetCoverage).
- WMS (hillshade backdrop): `https://wms.geonorge.no/`.
- GeoTIFF and LAZ/zLAS download: `https://hoydedata.no/` and Geonorge Kartkatalog.

### Orthophotos: Norge i bilder (NOT open)

Norge i bilder imagery is Geovekst-licensed, not open data. All commercial use requires permission from the rights holders (Kartverket distribution service, Geovekst, municipalities). Required attribution: "Statens kartverk, Geovekst og kommunene, <Prosjektnavn og arstall>". Treat orthophotos as licensed assets, separate from the open elevation data.

### Graded near-shore data (sikkerhetsloven)

Under the depth-data regulation in force from 1 January 2024 (legal basis in sikkerhetsloven): 0-30 m depth is ungraded (with exceptions); deeper than 30 m is classified. By resolution, 25x25 m or finer is KONFIDENSIELT, 25x25 to 50x50 m is BEGRENSET, and 50x50 m or coarser is ungraded. Any finer near-shore bathymetry must be avoided unless cleared through Kartverket's application process. Terrestrial elevation data above the shoreline is unaffected.

### Neighbourhood map: OpenStreetMap via MapLibre

OSM data is licensed ODbL and requires attribution "(c) OpenStreetMap contributors", with the word OpenStreetMap linking to `https://www.openstreetmap.org/copyright`. In MapLibre GL the AttributionControl shows this by default; confirm it is not hidden by CSS, and choose a tile provider whose terms permit the expected traffic.

## Kilder / Sources

Checked June 2026:

- https://www.kartverket.no/en/api-and-data/terms-of-use
- https://www.kartverket.no/en/api-and-data/terrengdata
- https://www.geonorge.no/kartdata/datasett-i-geonorge/hoydedata/
- https://register.geonorge.no/inspire-statusregister/%C3%A5pent-api-for-h%C3%B8yde-og-dybdedata/71ad2bf9-06e8-469f-9ffa-296182274154
- https://hoydedata.no/arcgis/rest/services
- https://www.norgeibilder.no/help/topics/idh-topic100.htm
- https://www.kartverket.no/en/about-kartverket/nyheter/til-sjos/2024/januar/forskrift-opptak-og-bruk-av-dybdedata
- https://osmfoundation.org/wiki/Licence/Attribution_Guidelines

Note: rules, licences and rates change and must be re-verified against these primary sources before public use.
