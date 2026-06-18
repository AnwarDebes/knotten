# SPEC-12: Year-round sun and daylight on your plot

## Purpose
This far north, daylight is a decisive quality-of-life factor and a real differentiator. A small contractor selling an energy-smart coastal development at Rødberg gains credibility by showing, honestly and per plot, how much sun each tomt actually gets across the year. The tool turns the abstract "optimal orientation to sun" pillar into something a buyer can see: December versus June, hours of direct sun, and how terrain casts shadow through the day. It reuses the SPEC-04 sun engine, so the marginal cost is low and the marketing value is high.

## Scope
For each plot: a December-versus-June comparison, estimated hours of direct sun, and where shadows fall through the day and across the seasons, computed from real latitude (~58°N) and Kartverket terrain. A daypart and season selector (morning / midday / evening, summer / winter). Per-plot summary cards usable standalone and from the plot pages. No new heavy 3D scene: the visualisation prefers the existing SPEC-04 terrain view, with a static fallback on mobile and low-end devices. Results are framed as daylight quality, never as a guaranteed outcome.

## Dependencies
- SPEC-04 (3D terrain and plot map): the sun-path engine, real Kartverket DTM/DOM terrain, and the data-driven plot source.
- SPEC-00 / SPEC-01: engineering baseline, design tokens and accessible components.
- SPEC-02: links from the Tomtene and Verktøy pages; SPEC-18 plot deep links.

## Data
- Sun position: solar-geometry library (e.g. suncalc) using each plot's real latitude/longitude.
- Terrain shading: Kartverket Høydedata DTM/DOM (CC BY 4.0, commercial OK; credit "© Kartverket"). Open data only; no graded near-shore bathymetry.
- Plot positions/orientation: data-driven from the SPEC-04 source. Exact coordinates, orientation and plot count are UNKNOWN: use clearly marked placeholders, recorded in `docs/INPUTS-NEEDED.md`, so real survey data drops in without code changes.
- No personal data of any kind.

## Acceptance criteria
- [ ] Per-plot results, fully data-driven (no hardcoded plot or count).
- [ ] December and June compared; estimated direct-sun hours shown; shadows shown through day and season.
- [ ] Computation uses real latitude and Kartverket terrain.
- [ ] Astronomically reasonable; method and data sources cited in-tool.
- [ ] Usable on mobile, with a verified high-quality static fallback where the live view cannot run.
- [ ] Within the §8 performance budget; 3D code not in the initial bundle.
- [ ] Honest framing: results labelled an *indikativt estimat*, with assumptions and a disclaimer; not professional advice.
- [ ] WCAG 2.2 AA: keyboard-operable controls, text alternatives for the visualisation, `prefers-reduced-motion` respected.

## Task checklist
1. Extract a shared sun/terrain module from the SPEC-04 engine (sun position + terrain-occlusion shadow test).
2. Compute per-plot direct-sun hours for representative December and June days, plus daypart shadow states.
3. Build the per-plot summary card (Dec vs Jun, sun hours, season/daypart selector) from design-system components.
4. Integrate the live terrain shadow view; lazy-load it; gate by device capability.
5. Produce the static fallback (baked terrain renders or static shadow images per plot, labelled).
6. Add method citation, source attribution, assumptions panel and the estimate disclaimer.
7. Wire the tool into the Verktøy hub, Tomtene page and SPEC-18 plot pages.
8. Accessibility pass (axe + manual keyboard), Lighthouse and bundle-budget check, NO/EN copy.
9. Tests: unit (sun-hour and occlusion logic), E2E (selector and fallback paths); update PROGRESS and DONE.

## Guardrails
- **Honesty:** every figure is labelled *indikativt estimat*, shows its assumptions (date, latitude, terrain model) and cites the method (solar-geometry library) and data source (© Kartverket, CC BY 4.0). Daylight is depicted honestly; no exaggeration. Carries *"ikke profesjonell rådgivning"*.
- **Privacy:** stateless, collects no personal data; any future "email my results" routes only through the consented SPEC-06 lead flow.
- **Performance:** initial route JS ≤ ~120 KB gzip; 3D never in the initial bundle; LCP < 2.5 s, INP < 200 ms, CLS < 0.1; Lighthouse (mobile) ≥ 95 (the heavy view may sit lower only if its static fallback still scores ≥ 95); motion 60 fps, transform/opacity only. The budget wins over the wow.
- **Accessibility:** WCAG 2.2 AA throughout: full keyboard operability, visible focus, sufficient contrast, text/data alternative to the visual, reduced-motion fallback.

## Out of scope
- Indoor daylight factor, room-level illuminance or window-by-window analysis.
- Solar PV yield estimates (SPEC-05) and CO₂ figures (SPEC-21).
- Cloud-cover, weather or real measured insolation; the model is clear-sky geometry plus terrain only.
- Vegetation, future buildings or neighbouring structures as shadow casters until such data exists.
