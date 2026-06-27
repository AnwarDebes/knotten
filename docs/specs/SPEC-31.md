# SPEC-31: Indicative buildings and vegetation

## Purpose

No design exists yet (the project is pre-zoning), so the homes must be honest
indicative massing, generated from the placeholder house-type envelopes and the
real Norwegian small-house rules, clearly labelled, set in a real forest. This
keeps the world plausible and credible without ever presenting a design as fact.

## Scope

- Parametric house massing from `src/content/house-types.ts` envelopes: footprint to width and depth, one or two storeys from heated area, about 6 m eaves, a gable saltak kept under the 9 m ridge limit (pbl 29-4), white Sorlandet timber walls, dark roof.
- Placement at each `src/content/plots.ts` position, snapped to terrain and oriented toward the sea and sun.
- A real instanced forest (from SPEC-28's canopy data) in four draw calls, conifer and deciduous, kept clear of the plots.
- A persistent indicative badge and the real-vs-indicative narrative so the massing is never read as a design.

## Dependencies

- SPEC-28 (vegetation data), SPEC-29 (the world), and the building-rules research note `docs/research/3d-opplev-byggeregler-og-sorlandshus.md`.

## Data

- House-type envelopes and plot positions (placeholders), the pbl 29-4 height limits and the Sorlandet vernacular.

## Acceptance criteria

- [x] One indicative home per plot, generated from the envelopes and the real height and roof rules.
- [x] White-timber, gable-roofed massing in the regional idiom, oriented to terrain and sea.
- [x] A real instanced forest renders cheaply and stays off the plots.
- [x] The indicative nature is labelled persistently.

## Task checklist

- [x] Implement the parametric massing and roof generation.
- [x] Place and orient the homes on the terrain.
- [x] Render the instanced forest and keep clearings around the plots.

## Guardrails

- Honesty: count, placement, height and form are indicative and change with the zoning plan; the badge and narrative say so.
- Legal: respect the 100-metre sea belt (pbl 1-8); do not imply a right to build close to the fjord.
- Vernacular: white painted timber, saltak 38 to 45 degrees, vertically proportioned windows.

## Out of scope

- Final architecture, real footprints, cut-and-fill grading detail, and per-home material variation.
