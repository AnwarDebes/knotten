# SPEC-31 completion note

## What was built

Honest indicative homes, generated from real rules, set in a real forest.

- **Massing**: parametric homes from `src/content/house-types.ts` envelopes, footprint to width and depth, one or two storeys from heated area, about 6 m eaves, a gable saltak kept under the 9 m ridge limit (pbl 29-4), white Sorlandet timber walls, dark roof.
- **Placement**: one home per `src/content/plots.ts` position, snapped to terrain and oriented toward sea and sun.
- **Forest**: a real instanced forest from the canopy data, conifer and deciduous, in four draw calls, kept clear of the plots.
- **Honesty**: a persistent indicative badge and the real-vs-indicative narrative, so the massing is never read as a design.
- **Rules note**: `docs/research/3d-opplev-byggeregler-og-sorlandshus.md` records the Norwegian small-house rules and the Sorlandet vernacular the massing follows.

## Verification

- Local gate green: typecheck, lint, build.
- Production build driven headlessly: white-timber gable homes render on the terrain in forest clearings; the indicative badge is present; no console errors.

## Deferred (documented)

Final architecture, real footprints, detailed cut-and-fill grading and per-home material variation are out of scope until the design and zoning exist.
