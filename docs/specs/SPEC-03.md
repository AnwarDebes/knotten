# SPEC-03: Energy concept experience

## Purpose

Knotten's market advantage is its energy concept, not glossy photos that do not yet exist. A small contractor selling an energy-smart coastal development at Rødberg needs a single page that makes the concept legible to ordinary buyers and credible to the kommune and partners. This module turns abstract systems (plusskunde, energidelinng, a shared thermal base) into something a non-expert grasps in one pass, without overstating what is proven. Honest, well-labelled explanation is itself a selling point: it signals competence and protects the developer's credibility.

## Scope

An interactive, plain-language NO/EN module covering each concept element, each with its own visual, short explainer, a "slik fungerer det her" note, and a maturity/assumption tag:

- Solar (roof, façade, communal), indicative yield about 1000-1020 kWh/kWp/year (PVGIS, estimate).
- Small-scale wind.
- Ground-source/geothermal heating.
- Battery storage.
- The shared energy base (thermal/sand battery, after Polar Night Energy), tagged as a concept requiring a feasibility study, not a delivered product.
- The energy hub and internal distribution.
- V2G/V2H, tagged emerging (ref ISO 15118-20), forward-looking.
- Outage resilience.
  All elements tie back to the plusskunde and energidelinng framework (self-consumed kWh free of nettleie/avgifter; sharing on the same gnr/bnr, at most 1 MW AC). Lightest technique: animated SVG/Lottie preferred; no second heavy 3D scene.

## Dependencies

- SPEC-00 (engineering baseline, CI, budget gate).
- SPEC-01 (design tokens, components, motion signature, imagery honesty guide).
- SPEC-02 (site IA, NO/EN content scaffolding, placeholder strategy).

## Data

- Energy elements as a structured, data-driven list (id, title NO/EN, explainer, "her"-note, maturity tag, source refs), editable later via the CMS-lite layer (SPEC-09).
- Indicative figures sourced from docs/research (PVGIS yield, SSB baseline about 14,700 kWh/year). No site telemetry, no real photography: use honest illustrated placeholders.
- Unit/plot count is UNKNOWN; copy avoids any home count.

## Acceptance criteria

- [ ] A non-expert understands the concept in one pass.
- [ ] Every claim accurate; each element carries a maturity/assumption tag.
- [ ] Every figure labelled indikativt estimat with source and disclaimer.
- [ ] Original visuals only (no third-party IP).
- [ ] Full prefers-reduced-motion fallback (static, equivalent content).
- [ ] Within the performance budget; passes the quality gate.

## Task checklist

- [ ] Define the energy-element data model and seed it from docs/research.
- [ ] Build the section layout and per-element card/panel from SPEC-01 components.
- [ ] Author NO/EN copy: explainer, "her"-note, tag, source per element.
- [ ] Produce original animated SVG/Lottie energy-flow visuals; lazy-load.
- [ ] Wire the plusskunde/energidelinng framing band linking elements.
- [ ] Add maturity tags (proven / emerging / concept) with tooltips.
- [ ] Implement reduced-motion and low-end static fallbacks.
- [ ] Add estimate labels, sources and disclaimers throughout.
- [ ] Tests (unit + a11y), Lighthouse and bundle checks in CI.

## Guardrails

- Buyer-value framing is stateless and collects no personal data; any "email this" routes only through the consented lead flow.
- Every estimate is labelled indikativt estimat, sourced, and disclaimed (ikke et tilbud; krever profesjonell verifikasjon where relevant); simulations are marked illustrations.
- Performance budget: initial route JS at most about 120 KB gzip (3D never in the initial bundle), LCP under 2.5 s, INP under 200 ms, CLS under 0.1, Lighthouse mobile at least 95; motion on transform/opacity only, 150-400 ms, 60 fps.
- WCAG 2.2 AA: keyboard operable, visible focus, AA contrast, text alternatives for every visual, prefers-reduced-motion honoured. Plausible (EU, cookieless); data in the EU/EEA only.

## Out of scope

- The energy/savings calculator and per-plot numbers (SPEC-05).
- The 3D terrain showpiece (SPEC-04).
- The community energy dashboard and live telemetry (SPEC-13).
- The standalone outage demo (SPEC-15) beyond a conceptual explainer here.
- Procurement, sizing, or any engineering sign-off of the systems.
