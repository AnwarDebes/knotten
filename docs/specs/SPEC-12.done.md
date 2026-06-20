# SPEC-12 completion note

## What was built

A per-plot, year-round sun and daylight tool that turns the "optimal orientation to sun" pillar into something a buyer can see, computed from real latitude and Kartverket terrain.

- **Shared sun/terrain module** (`src/lib/sun-terrain.ts`): sun position via solar geometry (suncalc) at the site latitude (58°N), and a terrain-occlusion horizon test against the real Kartverket DTM (the same heightmap the SPEC-04 terrain uses). Direct-sun hours for a representative day, and a sun-or-shadow state per daypart.
- **Per-plot cards**: each plot shows estimated direct-sun hours in June versus December, and for the chosen season a morning/midday/evening sun-or-shadow strip with a screen-reader text alternative. A season toggle switches the daypart view. A link opens the immersive SPEC-04 3D terrain on Området.
- **No new 3D in this tool**: the visualisation is light SVG and text, so it is fast on mobile and the 3D engine never enters this route's bundle; the immersive shadow view remains the SPEC-04 terrain, linked from here.
- **Honesty and sources**: method and data are cited in-tool (suncalc, Høydedata © Kartverket CC BY 4.0), with a clear-sky-and-terrain-only note and an indikativt-estimat, not-professional-advice disclaimer. Plot positions are flagged as provisional placements.

## Verification

- Local gate green: lint, type-check, format, tests (110), build, bundle budget (the sun route is 150.1 KB, within the 152 KB content budget; no 3D in the initial bundle).
- Unit tests (6): flat terrain never occludes a sun above the horizon, a sun below the horizon counts as occluded, a tall wall toward the sun blocks a low sun but not a steep one, summer estimates more direct sun than winter on the real DTM, daypart states return morning/midday/evening, and the midsummer midday sun is higher than the midwinter one.
- Browser smoke test (headless Chromium) in NO and EN: the plot cards render with June and December hours and daypart chips, the season toggle works, and there are no page errors.

## Honesty and privacy

Stateless, no personal data. Clear-sky geometry plus terrain only: no cloud cover, vegetation or future buildings. Every figure is an indicative estimate with its assumptions (date, latitude, terrain model) and method cited. Exact plot coordinates, orientation and count are unknown and recorded in INPUTS-NEEDED; the placeholder positions drop out for survey data without code changes.
