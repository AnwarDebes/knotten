# SPEC-32 completion note

## What was built

The information layer that lets a visitor read the world, all tied to real data.

- **Plot labels**: a status-coloured label above each plot, scaled by distance, identifying the homesites.
- **Landmark markers**: Vigeland, Mandal, Kristiansand and Lindesnes lighthouse placed at their true geographic bearings from the site (computed from the real coordinates in `src/content/amenities.ts`), each with the real sourced distance, in both languages.

## Verification

- Production build driven headlessly: all six plot labels and all four landmark markers render in the DOM with their distances; no console errors; labels read in both locales.

## Deferred (documented)

A sequenced guided-tour mode with factual panels and a progress checklist, sea-view sightline cones, and a click-to-teleport minimap are tracked for later passes.
