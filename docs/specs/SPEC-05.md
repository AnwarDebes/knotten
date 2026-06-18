# SPEC-05: Energy and savings calculator

## Purpose
A small groundwork contractor cannot out-spend a national developer on marketing, but it can out-explain one. The energy-smart concept at Knotten is the headline asset, and a buyer only believes it when they can put their own numbers in and see a defensible result. This calculator turns the abstract "energieffektiv bolig" promise into a concrete, indicative figure: roughly how much energy a home here needs, how much it can produce on its own roof, how independent that makes it, and what that means in kroner. It gives Sigve Simonsen AS a credible, self-service lead magnet (§4) that makes a serious technical story tangible to buyers, the municipality and partners, without overstating anything.

## Scope
A stateless, client-side calculator with server-side calc modules (tested TS).
- Inputs: home size (m²), orientation (compass aspect), household profile (e.g. 1-2, 3-4, 5+ persons), optional EV, optional battery (kWh).
- Outputs: indicative annual energy demand (anchored to passivhus / TEK17), local solar production potential (PVGIS-sourced for the site), self-sufficiency percent, indicative annual savings versus a conventional home, and battery resilience hours in an outage.
- Each output shows its assumptions, the source, and the *indikativt estimat* disclaimer. Results are deterministic and reproducible from the inputs alone.

## Dependencies
- SPEC-00 (engineering baseline, CI, budget gate).
- SPEC-01 (design system, accessible components).
- SPEC-02 (sits in the Verktøy hub, NO/EN parity).
- Reuses no PII path; an optional "email my results" (if added) routes only through SPEC-06.

## Data
Pure functions over a small, documented constants file. No database, no stored input.
- Demand: passivhus net heating about 15 kWh/m²·år (NS 3700, larger homes); TEK17 §14-2 energiramme (småhus 100 + 1600/m²) as the conventional comparator. SSB baseline about 14 700 kWh el / 17 200 kWh total per household per year (2024), cited with year.
- Production: site solar about 1000-1020 kWh/kWp·år (PVGIS 5.3, 58.02°N 7.05°E), cited; modelled assumed kWp from roof area and orientation.
- Savings: self-consumed kWh avoid spotpris + nettleie + avgifter (plusskunde); honour strømstøtte (90% above 77 øre/kWh ex VAT) and Norgespris (50 øre/kWh incl.) as selectable price assumptions, through 2029.
- Placeholders: real roof areas, house types, and plot orientations are UNKNOWN; defaults are clearly marked and recorded in `docs/INPUTS-NEEDED.md`.

## Acceptance criteria
- [ ] Every number is defensible and shows a cited source.
- [ ] All assumptions are visible to the user, not hidden in code.
- [ ] The *"indikativt estimat, ikke en garanti, endelige tall krever profesjonell energimodellering"* disclaimer is present.
- [ ] No personal data is collected or stored; the tool is stateless.
- [ ] Results are stable, deterministic and explainable from inputs alone.
- [ ] Full NO/EN parity; WCAG 2.2 AA; within the §8 budget; QA gate green.

## Task checklist
- [ ] Write tested TS calc modules: demand, solar production, self-sufficiency, savings, resilience hours.
- [ ] Encode all constants and sources in one documented, swappable file.
- [ ] Build the accessible input form (size, orientation, profile, optional EV, optional battery) with sensible defaults and validation.
- [ ] Render outputs with per-figure assumptions, sources and disclaimer.
- [ ] NO/EN copy in message catalogues; keyboard and screen-reader pass.
- [ ] Unit tests on every formula and edge case; Lighthouse and bundle check.

## Guardrails
- Stateless, no personal data (buyer-value honesty rule, §10): the calculator never collects PII; any "email my results" goes only through the consented SPEC-06 flow.
- Every estimate is labelled *indikativt estimat*, sourced (PVGIS, NS 3700, TEK17, SSB), and disclaimed as not financial or engineering advice.
- Performance: initial route JS within the §8 budget (no heavy 3D), LCP < 2.5 s, CLS < 0.1, 60 fps interactions.
- Accessibility: WCAG 2.2 AA (keyboard operable, labelled fields, sufficient contrast, reduced-motion safe).

## Out of scope
- Real house types, exact roof areas and per-plot orientation (SPEC-16, awaiting client data).
- Live NO2 spot-price exposure modelling and price-spike comparison (SPEC-10).
- Total monthly cost of ownership including loan and felleskostnader (SPEC-11).
- The interactive outage-resilience timeline experience (SPEC-15).
- CO₂ / miljøgevinst accounting (SPEC-21).
