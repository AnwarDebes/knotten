# Knotten: Sjøutsikt i Rødberg

The website, project portal and measured 3D digital twin for Knotten, a planned development of 30 very
energy-efficient homes on the Knotten knoll at Rødberg (Raudberg), Lindesnes in Agder, above the Audna's outlet
into Sniksfjorden. The project owner is Sigve Simonsen AS.

Reference point **58.068057 N, 7.278401 E** = local origin (0, 0). Everything in the model is derived from
measured data; where something is a working assumption it is labelled provisional in the data and on the site.

```
knotten/
  site/          the website and the project portal (Next.js); Vercel builds from here. See site/README.md
  pipeline/      every script that produces the data and the 3D model, re-runnable
  data/          pipeline outputs read by later steps: plots, road, clearing, trees, parcels, buildings, schemas/
  source/        the measured inputs the pipeline starts from; source/twin/ is the download cache (not in git)
  renders/       stills rendered from the live 3D model, turned into WebP by pipeline/optimise_images.py
  assets-src/    the project owner's original photographs and maps (the site serves optimised copies)
```

## Quick start

```bash
cd site
npm ci
npm run dev          # http://localhost:3000 : Klassisk at /, Moderne at /no and /en
npm run build && npm run start
```

Node.js 20.9 or newer. The first visit to the login page starts the first-time setup of the super administrator
(the setup code is printed in the server log, or set your own with `KNOTTEN_SETUP_CODE`). Deployment, storage and
every environment variable are described in `site/README.md`.

## Coordinate systems

| Frame | Definition |
|---|---|
| **local** (all JSON) | metres; `x` = east, `y` = north, `z` = height above sea level; origin at the reference point |
| **glTF / three.js** | Y-up: `three.x = local.x`, `three.y = local.z`, `three.z = -local.y` |
| **WGS84** | `lat = 58.068057 + y / 111132`, `lon = 7.278401 + x / 58927.4` (given per record) |
| **EPSG:25832** | UTM 32N, given per plot; grid convergence here is 1.461° |

Sea level is `y = 0` in three.js. The knoll top is at 87.4 m, the reference point at 51.6 m.

## Per-plot evidence (`data/plots.json`)

For every plot: ground and floor level, slope and aspect, level-pad cut and fill, **sun hours on 21 Dec, 21 Mar
and 21 Jun** (terrain-shaded, first and last sun), **sea view** (degrees of bearing with water visible, whether
open sea is visible) and a 360° terrain horizon profile, the input the energy simulation uses for real ridge shading.

Layout v6 (30 September 2026, provisional): 30 plots in rows A to D (9, 10, 7 and 4), all 30 with water and
open sea in view with the neighbouring houses standing.

## Assumptions (replace when the real inputs arrive)

1. **The house layout is provisional.** `pipeline/plan_layout_v6.py` lays the plan's four rows along the measured
   terrain inside parcel 355/10: A (plots 1 to 9) along the rim under Løkkeheia, B (10 to 19) across the slope and
   on the east shoulder, C (20 to 26) above the steep band, D (27 to 30) on the south face of the Knotten knoll.
   The houses are the model's example house (11 x 8.5 m), at least 14 m apart and 10.5 m inside the boundary.
   Replace with the zoning plan when it exists and re-run; every number regenerates.
2. **The road is drawn on today's ground.** `road.json` states, per link, how far it climbs and the length a 6 %
   road needs; the zoning plan sets the real loops and earthworks.
3. **Clearing** is 14 m around each house, 6.5 m along the road, 2.5 m along the footpath, and the trees in each
   living room's line of sight to the water.
4. **Sun hours** are terrain shading only: no shading between houses and no trees (field cleared).
5. **Site boundary** is the legal parcel 355/10 (and the yard, 355/368) from the cadastre, `data/parcels.json`.

## Rebuilding the data

1. `pipeline/plan_layout_v6.py` writes `data/plots.json`, `road.json`, `clearing.json` and `trees.json`, and copies
   them to `site/public/data`.
2. `pipeline/build_klassisk_plan.py` draws the Klassisk site plan from the same data
   (`site/src/lib/klassisk/siteplan.ts`).
3. The `pipeline/twin_*.py` steps below build the 3D model in `site/public/twin`.
4. Stills and the fly-in film are rendered from the live model in the browser with `?twindebug`
   (`pipeline/twin_flyin.js`); `pipeline/optimise_images.py` writes the WebP copies the pages load.

Python 3 with numpy, scipy, Pillow and matplotlib (`pipeline/requirements.txt`).

### The digital twin (`site/public/twin`)

Downloads are cached in `source/twin/`, which git ignores.

1. `twin_fetch.py`: Kartverket NHM terrain and surface models (1 m and 5 m round the site, 20 m out to 20 km,
   200 m out to 105 km), aerial imagery for every ring, NIBIO SR16 tree species and AR5 land cover, Kartverket
   place names, EU PVGIS weather and yields, NO2 prices, Elhub load profiles. OpenStreetMap is fetched only with
   `--osm` (the outlines of the buildings within 1.3 km come from `source/osm_raw.json`).
2. `twin_geonorge.py` and `twin_matrikkel.py`: Kartverket's building register (Matrikkelen, Bygningspunkt) and the
   nautical chart's depth data (Sjøkart, Dybdedata) for Lindesnes and Lyngdal, from Geonorge's download API.
3. `twin_terrain.py`: the five terrain rings (`ring_r0` to `ring_r4`, out to 105 km: heights, aerial photos, masks
   for water and forest) and `twin.json`. Beyond 1.3 km the rings are laid out by true distance and direction and
   bend down with the earth's curvature less refraction.
4. `twin_buildings.py`: the buildings within 1.3 km with a surveyed outline, each roof fitted to the laser data.
5. `twin_world_buildings.py`: every other registered building out to 5.1 km that the laser data shows.
6. `twin_trees.py`: the trees (`trees.bin`, `trees.json`) from treetops in the laser data, species from SR16, AR5
   and the aerial photo.
7. `twin_broadleaf.py`: the broadleaf share of the trees (the winter look of the woods).
8. `twin_nvdb.py` and `twin_roads.py`: the roads in Statens vegvesen's road database (NVDB) out to 5.3 km, the
   bridges in 3D, guardrails, guard stones and street lights.
9. `twin_nve.py` and `twin_power.py`: NVE's overhead power lines and their masts out to 5.3 km.
10. `twin_sjokart.py`: the sea's depth from the nautical chart.
11. `twin_houses.py`: the example house fitted to each plot (`houses.json`), with a lower floor under the view side
    where the ground in front lies low enough (18 of the 30 plots).
12. `twin_grading.py`: the plan's pads, roads and gardens graded into the inner ring (`ring_r0b_*`).
13. `twin_energy.py` and `twin_names.py`: the energy simulation's inputs (`energy.json`) and the place names.

A step rewrites only its own files. After `twin_terrain.py`, run `twin_broadleaf.py`, `twin_sjokart.py` and
`twin_names.py` again (they read the masks).

## Data sources and licences

| Layer | Source | Licence |
|---|---|---|
| Terrain; canopy and roofs (surface model) | Kartverket, Nasjonal detaljert høydemodell (NHM), via hoydedata.no | CC BY 4.0 |
| Registered buildings | Kartverket, Matrikkelen Bygningspunkt (Geonorge) | CC BY 4.0 |
| Building outlines within 1.3 km | OpenStreetMap (`source/osm_raw.json`) | ODbL |
| Place names | Kartverket, Sentralt stedsnavnregister | CC BY 4.0 |
| Sea depth | Kartverket, Sjøkart Dybdedata (Geonorge) | CC BY 4.0 |
| Roads, bridges, guardrails, street lights | Statens vegvesen, NVDB | NLOD 2.0 |
| Power lines and masts | NVE, Nettanlegg 4 | NLOD |
| Tree species | NIBIO, SR16 | NLOD |
| Land cover: water, forest, fields | NIBIO, AR5 | terms to confirm with NIBIO |
| Aerial photo | Esri World Imagery | Esri terms of use |
| Weather, solar yield | EU PVGIS | free reuse with attribution |
| Photographs in the area | Wikimedia Commons (credited on the site) | CC BY-SA |

Before a commercial launch, confirm the AR5 terms with NIBIO (or move the masks to AR50, NLOD) and the Esri
imagery terms (or replace the aerial photos with Norge i bilder or the project's own orthophoto and re-run
`twin_fetch.py` and the steps after it). The project's own photographs and documents belong to Sigve Simonsen AS.
