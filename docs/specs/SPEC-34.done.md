# SPEC-34 completion note

## What was built

The energy concept as a living thing, tied to the real solar figures.

- **Animated microgrid**: in `experience-world.tsx`, glowing particles flow from each home up to a shared hub and loop continuously, an indicative picture of rooftop solar feeding the local energy sharing.
- **Real figures**: a HUD note carries the real, sourced numbers (about 1010 kWh/kWp at 58 degrees north, shared across the homes up to 1 MW per property), labelled indicative, in both languages.

## Verification

- Local gate green: typecheck, lint, build.
- Production build driven headlessly: the energy particles and hub render and animate (under the continuous frame loop from SPEC-29), the energy note is present in both locales; no console errors.

## Deferred (documented)

Roof PV that brightens with the moving sun, a battery that visibly charges and discharges, a grid import/export flip on feed-in, and a live production/consumption HUD driven by the energy model over a day-night clock are tracked for a later pass.
