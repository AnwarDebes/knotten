# SPEC-15: Outage-resilience demo (Når strømmen går)

## Purpose

For a small groundwork contractor selling an energy-smart coastal development in NO2, robustness during a power outage is one of the four concept pillars and a concrete buyer benefit. Rural coastal Agder sees weather-driven outages, so "your home keeps the lights, heat and freezer running when the grid goes down" is a tangible, emotionally resonant selling point that a buyer immediately understands. This demo turns the abstract "battery + solar" specification into a clear answer: based on the solar and battery choices a buyer made in SPEC-05, how many hours does the home stay powered, and what keeps running. It strengthens credibility without overpromising.

## Scope

An interactive, stateless demo reachable from the Verktøy hub and the Robusthet page. It takes the solar and battery configuration produced by SPEC-05 (PV size, battery usable kWh, household profile) and computes an indicative outage runtime: total backup hours and a prioritised list of loads that stay on (heating/varmepumpe, freezer/fridge, lighting, router, water/pump). An interactive timeline lets the buyer scrub through an outage event and see remaining battery state and what is still running at each hour, with and without daytime solar recharge. All assumptions are shown and sourced; the calculator logic is reused, not duplicated.

## Dependencies

- SPEC-01 (design system: components, tokens, motion signature, reduced-motion behaviour).
- SPEC-03 (energy concept: outage-operation and storage explainer it links back to).
- SPEC-05 (energy and savings calculator: the single source of battery resilience hours and the shared calc module; SPEC-15 reuses its inputs and outputs, never recomputes them differently).
- Optional cross-link to SPEC-13 (community dashboard) for the shared-battery outage view.

## Data

- Inputs: PV size (kWp), battery usable capacity (kWh), depth-of-discharge and round-trip-efficiency assumptions, household load profile, all sourced from SPEC-05's shared calc module.
- Load library: a data-driven table of typical appliance power draws (varmepumpe, kjøl/frys, belysning, ruter, pumpe), each a labelled estimate with its source, editable as data not hardcoded.
- Solar recharge during outage: indicative daytime contribution derived from PVGIS yield at the site (about 1000-1020 kWh/kWp per year, indicative), seasonally adjusted, clearly labelled.
- Placeholders: real house heating demand, real battery product specs and real appliance inventories are unknown; the demo runs against clearly marked placeholders and the gap is recorded in INPUTS-NEEDED.
- No personal data is read or written.

## Acceptance criteria

- [ ] Backup hours and runtime are consistent with SPEC-05 for the same configuration (no divergent numbers).
- [ ] Every assumption (loads, DoD, efficiency, solar recharge) is shown with its source.
- [ ] An indikativt estimat disclaimer is visible: not a guarantee, requires professional engineering verification.
- [ ] Interactive timeline works with mouse, touch and keyboard, including a reduced-motion fallback.
- [ ] Stateless; no PII collected or stored.
- [ ] WCAG 2.2 AA; within the §8 performance budget.

## Task checklist

- [ ] Build the outage-runtime function in the shared calc module (reuse SPEC-05 inputs; unit-test edge cases: zero battery, full sun, winter).
- [ ] Build the prioritised load model and data-driven appliance table with sourced draws.
- [ ] Build the interactive timeline UI (scrub by hour, battery-state curve, loads-on list, solar-recharge toggle) using SVG/Lottie, no heavy 3D.
- [ ] Wire it to a configuration passed from SPEC-05; handle empty/loading/error states.
- [ ] Render assumptions panel, sources and disclaimer.
- [ ] Add NO/EN copy, accessibility pass (keyboard, focus, contrast, alt, reduced-motion) and Lighthouse/bundle check.
- [ ] Record placeholder data gaps in INPUTS-NEEDED; write DONE.md.

## Guardrails

- Stateless buyer-value tool: collects no personal data; any "email my results" would route only through the consented SPEC-06 lead flow.
- Every number is labelled an indikativt estimat, shows its assumptions and source, and is disclaimed as not a guarantee and "krever profesjonell verifikasjon"; never financial or engineering advice. Runtime figures must match SPEC-05.
- Performance budget (§8): timeline and visuals lazy-loaded where heavy; initial route JS within budget; animate transform/opacity only (150-400 ms, 60 fps); LCP < 2.5 s, INP < 200 ms, CLS < 0.1; Lighthouse mobile ≥ 95.
- Accessibility: WCAG 2.2 AA, full keyboard operability, visible focus, sufficient contrast, text alternatives, and a functional `prefers-reduced-motion` fallback for the timeline.

## Out of scope

- Real telemetry or live battery state (SPEC-13 owns the simulated community view; this demo is configuration-driven).
- Sizing or recommending specific battery/inverter products.
- The savings or price-resilience economics (SPEC-05, SPEC-10, SPEC-11).
- Any personal-data capture, accounts or persistence.
