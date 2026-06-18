# SPEC-21: CO2 and environmental gain (optional, honest estimate)

## Purpose
For a small groundwork contractor selling an energy-smart coastal development at Rødberg, the environmental story is part of the value, but only if it is told honestly. A passivhus that produces and shares its own solar power draws far less from the grid than a standard home, and that lower consumption maps to a lower climate footprint. This tool puts a single, careful number on it: living here versus a standard home saves about X tonnes CO2 per year. The figure is tied to a recognised method (NS 3720) and to the same energy model used elsewhere on the site, so it strengthens the pitch without overpromising and survives scrutiny from a buyer, a bank or the kommune.

## Scope
A stateless, public tool that estimates the annual CO2 difference between an energy-smart home here and a standard reference home, expressed in tonnes CO2-ekvivalenter per year, with a short breakdown (lower energy demand, self-produced and shared solar, the grid emission factor applied). It reuses the SPEC-05 energy model for demand, solar yield and self-sufficiency rather than recomputing them, so the climate number is by construction consistent with the savings shown elsewhere. Every input, factor and assumption is shown; the result is labelled an estimate. Reachable from the Verktøy hub and the energy concept page (SPEC-02, SPEC-03).

## Dependencies
- SPEC-00 (engineering baseline, CI, budget gate); SPEC-01 (design system, accessible components).
- SPEC-02 (Verktøy hub, page shell, NO/EN); SPEC-03 (energy concept context).
- SPEC-05 (shared, tested energy/calc TS modules: demand, solar yield, self-sufficiency); reuse, do not duplicate.
- SPEC-08 (Plausible goal for tool use).

## Data
- Method: NS 3720 (klimagassberegninger for bygninger), driften phase only for v1; cited in-tool. Recorded under docs/research/.
- Energy figures from the SPEC-05 model: passivhus demand (net heating about 15 kWh/m2 per year), solar yield (about 1000-1020 kWh/kWp per year, PVGIS), self-consumption and energidelt solar. Reference home anchored to the SSB household baseline (about 14,700 kWh electricity per year).
- Grid emission factor: a single, cited, editable factor (NO/Nordic electricity), shown with its source and year; the choice of factor and its sensitivity are stated openly.
- PLACEHOLDER: per-plot floor area, system size and real metered consumption are UNKNOWN; the tool runs data-driven against the SPEC-05 placeholders, recorded in docs/INPUTS-NEEDED.md. No personal data is collected.

## Acceptance criteria
- [ ] Method (NS 3720) and the emission factor are cited in-tool with source and year.
- [ ] The result is labelled an indikativt estimat with all assumptions visible.
- [ ] Numbers are consistent with the SPEC-05 energy model (no parallel, divergent calc).
- [ ] Framing is honest: an estimate of avoided emissions, not a guarantee or a certification.
- [ ] Stateless; collects no personal data.
- [ ] Within the §8 performance budget; WCAG 2.2 AA; reduced-motion fallback.

## Task checklist
- [ ] Add a tested pure function converting SPEC-05 energy outputs to CO2 via a configurable, cited factor.
- [ ] Build the result view: headline tonnes/year, a short driver breakdown, and a sensitivity note on the factor.
- [ ] Surface the NS 3720 method citation, factor source/year, assumptions panel and disclaimer inline.
- [ ] Wire it into the Verktøy hub and the SPEC-03 energy page; add NO/EN copy.
- [ ] Add the Plausible usage goal; unit-test the conversion; verify bundle, Lighthouse and axe gates.

## Guardrails
- Honesty: every estimate is labelled indikativt estimat, shows its assumptions, and cites both the method (NS 3720) and the emission factor (source and year); disclaimer "ikke en sertifisering eller garantert klimaeffekt". No greenwashing; the dependence on the chosen factor is stated.
- Privacy: stateless, no personal data; any "email my results" routes only through the consented SPEC-06 lead flow.
- Performance: within the §8 budget (initial route JS at most about 120 KB gzip; LCP under 2.5 s, INP under 200 ms, CLS under 0.1; Lighthouse mobile at least 95; no 3D).
- Accessibility: WCAG 2.2 AA, full keyboard operability, visible focus, sufficient contrast, a text/table alternative to any chart, prefers-reduced-motion respected.

## Out of scope
- Embodied emissions, materials, construction and end-of-life phases (driften phase only for v1).
- A formal NS 3720 report, BREEAM or any third-party certification.
- Per-household measured footprints, carbon offsetting or accounts/login.
- Solar PV yield UI (SPEC-05), price exposure (SPEC-10) and monthly cost (SPEC-11), which this tool only draws figures from.
