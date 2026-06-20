# SPEC-16 completion note

## What was built

A house and energy configurator that lets a buyer assemble a concrete scenario and watch the numbers move, turning the passivhus and plusskunde story into a personal, decision-useful picture.

- **Data-driven house types** (placeholder until the developer supplies real ones, INPUTS-NEEDED item 4): each carries heated area, footprint, default orientation and sane solar and battery ranges. Adding a real type in data needs no code change; an empty list renders an honest empty state.
- **Configure and recompute live**: pick a house type and a plot, set orientation, household, solar (kWp), battery (kWh) and EV charging, and the self-sufficiency, annual demand and production, outage backup hours and annual energy cost update in real time.
- **Consistent maths**: a new `computeEnergyConfig` reuses the SPEC-05 assumptions for an explicit solar and battery size, and the energy cost reuses the SPEC-10/SPEC-11 scheme pricing, so the configurator never diverges from the other tools. A link points to the monthly-cost tool for the full economics.
- **Placement**: the plot is chosen here and viewed in the existing SPEC-04 3D terrain via a link, so the configurator stays 2D-first and the 3D engine never enters this route's bundle (the mobile and reduced-motion path is the default).

## Verification

- Local gate green: lint, type-check, format, tests (134), build, bundle budget (the route is 150.7 KB, within the 152 KB content budget; no 3D in the bundle).
- Unit tests (5): `computeEnergyConfig` matches `computeEnergy` for the same auto-sized solar, more solar lifts self-sufficiency, a battery enables backup hours while none gives zero, the energy cost is positive for the remaining grid draw, and the house types have unique ids and valid ranges.
- Browser smoke test (headless Chromium) in NO and EN: the configurator renders, recomputes when the house type and solar change, appears in the Verktøy hub, and has no page errors.

## Honesty and privacy

Stateless, no personal data. Every output is labelled an indicative estimate with assumptions and sources (PVGIS, SSB, passivhus standards, the NO2 schemes) and the not-an-offer, requires-professional-energy-modelling disclaimer. House types, areas and ranges are clearly marked placeholders; placement and house views are illustrative.
