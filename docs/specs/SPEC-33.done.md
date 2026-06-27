# SPEC-33 completion note

## What was built

One enterable show-home at the start plot, so a visitor can step inside and look
out to the fjord.

- **Show-home**: the start plot is rendered as an enterable home (replacing the solid massing there) with a floor, double-sided walls so the interior reads, a doorway gap on the approach side, a flat ceiling, and a large glass picture window on the sea-facing wall.
- **Entry**: there is no collision, so the visitor walks in through the doorway and sees the fjord through the window.
- **Clearing**: the surrounding trees are cleared around the plot so the show-home stands in a clearing.
- The other plots keep the solid indicative massing.

## Verification

- Local gate green: typecheck, lint, build.
- Production build driven headlessly: the show-home renders in its clearing, a white house with a gable roof and a sea-facing window; no console errors.

## Deferred (documented)

Interior furnishing, a measured floor-plan overlay, and honest passivhus feature call-outs inside the show-home are tracked for a later pass; the leveransebeskrivelse, not an illustration, governs the real specification.
