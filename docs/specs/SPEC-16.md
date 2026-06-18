# SPEC-16: House and energy configurator

## Purpose

A small contractor selling an energy-smart coastal development needs the buyer to feel the value, not just read about it. This configurator lets a prospective buyer assemble a concrete scenario: pick a house type, place it on a plot, and size the solar, battery and EV charging, then watch cost, energy demand and self-sufficiency move in real time. It turns the abstract passivhus and plusskunde story into a personal, decision-useful picture, deepens engagement (a strong lead magnet ahead of salgsstart), and demonstrates the seriousness of the energy thinking to the kommune and partners. Building the engine now against placeholders means dropping in real house types later requires no code change.

## Scope

- Choose a house type from a data-driven list (name, footprint, heated area m2, default orientation, indicative spec).
- Place the house on a plot in the SPEC-04 3D view, with the 2D fallback used on mobile, low-end devices and `prefers-reduced-motion`.
- Configure solar size (kWp), battery (kWh) and EV charger, with sane bounds per house type.
- Live recompute of indicative cost, annual energy demand and self-sufficiency, wired to the shared calculation modules.
- All states: loading, empty (no house types yet), error, and the static-fallback path.

## Dependencies

- SPEC-00, SPEC-01: engineering baseline and design system.
- SPEC-04: the 3D terrain and plot map (placement surface and 2D fallback).
- SPEC-05: energy demand, solar yield (PVGIS, about 1000-1020 kWh/kWp/year at the site) and self-sufficiency logic.
- SPEC-10: NO2 price-exposure framing (strømstøtte and Norgespris through 2026).
- SPEC-11: månedskostnad cost model.
- SPEC-09: admin-editable house-type and parameter data when the client provides real types.

## Data

- House types as a data-driven source (JSON/DB), never hardcoded: id, navn, heated area m2, footprint, default orientation, energy standard (passivhus baseline about 15 kWh/m2 per year for larger homes), allowed solar/battery/charger ranges. Shipped as clearly marked placeholders until the client supplies real types (recorded in INPUTS-NEEDED, item 4).
- Calculation inputs come from SPEC-05/10/11 modules; no figures duplicated here.
- No personal data of any kind is collected or stored.

## Acceptance criteria

- [ ] Fully working against placeholder house types, with zero hardcoding (a new type added in data appears with no code change).
- [ ] Live recompute is correct and matches SPEC-05/10/11 for the same inputs.
- [ ] Every output is labelled an *indikativt estimat*, with assumptions, source and the right disclaimer.
- [ ] Usable on mobile via the 2D fallback; keyboard operable; WCAG 2.2 AA.
- [ ] Within the performance budget; the 3D chunk stays out of the initial bundle.
- [ ] The house-type data gap is recorded in INPUTS-NEEDED.

## Task checklist

- [ ] Define the house-type data schema and seed honest placeholder types.
- [ ] Build the configurator UI (type picker, plot placement, solar/battery/charger controls) from the SPEC-01 system.
- [ ] Integrate the SPEC-04 3D placement plus the 2D fallback selector.
- [ ] Wire live recompute to the SPEC-05/10/11 modules; debounce updates.
- [ ] Add labelled-estimate, source and disclaimer chrome to every output.
- [ ] Cover loading, empty, error and reduced-motion states; add unit and E2E tests.
- [ ] Record the real-house-types gap in INPUTS-NEEDED.

## Guardrails

- Stateless buyer-value tool: collects and stores no personal data; any future "email my results" routes only through the consented SPEC-06 lead flow.
- Every estimate is labelled, sourced (PVGIS, SSB, passivhus standards, NO2 schemes) and disclaimed: *indikativt, ikke et tilbud, krever profesjonell energimodellering*. Placement and house views are illustrative, with standard *forbehold*.
- Performance: initial route JS within the SPEC-00 budget; 3D loads lazily and only on capable devices; motion is transform/opacity only.
- Accessibility: WCAG 2.2 AA, full keyboard path, focus management, and a non-3D route to every result.

## Out of scope

- Real house types, layouts, plantegninger and prices (client-supplied later).
- Binding quotes, financing offers or verified engineering numbers.
- A new 3D scene: this reuses SPEC-04 rather than adding heavy WebGL.
