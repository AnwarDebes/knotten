# SPEC-33: Show-home interior

## Purpose

Walking past indicative massing shows scale and setting; stepping inside one home
shows what living there could feel like. This spec makes one home at the start
plot an enterable show-home with a sea-facing picture window, so the visitor
experiences the space and the view from within, clearly framed as indicative.

## Scope

- One enterable show-home at the start plot, replacing the solid massing there: a floor, double-sided walls so the interior reads, a doorway gap on the approach side, a flat ceiling, and a large glass picture window on the sea-facing wall.
- The visitor walks in (no collision; the doorway is the natural entry) and looks out to the fjord through the window.
- The remaining plots keep the solid indicative massing.

## Dependencies

- SPEC-29 (walking, the world) and SPEC-31 (the massing the show-home is derived from).

## Data

- The start plot position and orientation toward the sea (the same bearing the massing uses).

## Acceptance criteria

- [x] The start plot is an enterable show-home with floor, walls, doorway, ceiling and a sea-facing window.
- [x] The visitor can step inside and look out to the fjord.
- [x] It renders in a clearing with no console errors and stays clearly indicative.

## Task checklist

- [x] Build the show-home shell (floor, walls, doorway, ceiling, glass window).
- [x] Skip the start plot in the solid-massing pass so the show-home replaces it.
- [x] Verify it renders in its clearing without errors.

## Guardrails

- Honesty: the show-home is indicative; the global indicative badge and narrative apply. A leveransebeskrivelse, not an illustration, governs the real specification.

## Update: the show-home is now a building

When the massing became multi-storey blocks (SPEC-31 update), the show-home was
rebuilt to match: a building of the same form whose ground floor stays open and
enterable behind the sea-facing picture window, with storeys above. The
enterable ground floor and the fjord view are unchanged.

## Out of scope (tracked for later)

- Interior furnishing, a measured floor-plan overlay, and honest passivhus feature call-outs (balanced ventilation, heat pump, triple glazing, battery) inside the show-home.
