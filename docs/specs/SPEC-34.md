# SPEC-34: Energy system in motion

## Purpose

The energy-smart story is the development's differentiator, so in the experience
it should be a living thing, not a static diagram. This spec animates the energy
concept across the site and ties it to the real solar figures, so the visitor
sees energy moving and reads the real numbers.

## Scope

- An animated microgrid in `experience-world.tsx`: glowing particles flow from each home up to a shared hub, looping continuously, an indicative picture of rooftop solar feeding the local energy sharing.
- A HUD note carrying the real figures: about 1010 kWh/kWp at 58 degrees north, shared across the homes up to 1 MW per property, labelled indicative.
- Bilingual copy for the energy note.

## Dependencies

- SPEC-29 (the world and the continuous frame loop) and the energy figures from the project's energy model and research.

## Data

- The real solar yield (PVGIS about 1010 kWh/kWp at the latitude) and the plusskunde / energy-sharing limits (up to 100 kW per plusskunde, shared up to 1 MW on the same matrikkel).

## Acceptance criteria

- [x] Energy visibly moves: particles flow from each home to a shared hub, looping.
- [x] A HUD note carries the real, sourced solar and sharing figures, labelled indicative.
- [x] It renders with no console errors in both languages.

## Task checklist

- [x] Build the animated flow particles and the shared hub.
- [x] Add the real-figures energy note to the HUD in both locales.
- [x] Verify the animation and note render cleanly.

## Guardrails

- Honesty: the layout of the flows is indicative; the figures are the real, sourced numbers and are labelled as such.

## Out of scope (tracked for later)

- Roof PV that brightens and generates with the moving sun, a battery that visibly charges and discharges, a grid import/export flip on feed-in, and a live ticking production/consumption HUD driven by the energy model over a day-night clock.
