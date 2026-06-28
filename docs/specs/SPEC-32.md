# SPEC-32: Points of interest and the real-orientation info layer

## Purpose

A walkable world is more useful when the visitor can read it: which homesite is
which, and where the real places are. This spec adds the information layer, all of
it tied to real data, so an investor can orient in the landscape and connect the
site to the surrounding region.

## Scope

- Floating plot labels: a status-coloured label above each plot, scaled by distance, identifying the homesites.
- Real landmark direction markers: Vigeland, Mandal, Kristiansand and Lindesnes lighthouse placed at their true geographic bearings from the site, each with the real sourced distance, in both languages.

## Dependencies

- SPEC-29 (the world) and the `src/content/{plots,amenities}.ts` data with the real coordinates.

## Data

- Plot positions and statuses; amenity coordinates and distances; the site origin (58.047, 7.273) for the bearing computation.

## Acceptance criteria

- [x] Each plot carries a distance-scaled, status-coloured label.
- [x] Real landmarks appear at their true bearings with the real distances.
- [x] Labels render with no console errors and read in both languages.

## Task checklist

- [x] Add the plot labels (drei Html), scaled by distance.
- [x] Compute geographic bearings from the site to each landmark and place direction markers.

## Guardrails

- Honesty: distances are the real sourced figures; bearings are computed from real coordinates; plot positions remain indicative placeholders.

## Update

An orientation minimap was added (north-up, the plots as status dots and the
investor's live position). The richer info layer below remains for later.

## Out of scope (tracked for later)

- A sequenced guided-tour mode with factual panels and a progress checklist, sea-view sightline cones, and click-to-teleport on the minimap.
