# SPEC-21 completion note

## What was built

A careful, honest CO2 tool: living in an energy-smart home here versus a standard reference home, in tonnes CO2-equivalents per year, tied to NS 3720 and the same energy model used across the site.

- **One consistent number**: the climate figure reuses the SPEC-05 energy model (demand, solar yield, self-sufficiency), so it cannot diverge from the savings shown elsewhere. The smart home's grid draw is its demand minus the self-consumed share; the reference home draws the SSB baseline.
- **Honest factor handling**: the grid emission factor is selectable and shown with its basis (Norwegian production, Nordic mix, European residual mix), and the headline result is accompanied by a sensitivity range across the low and high factors. The dependence on the factor is stated openly, with no greenwashing.
- **Result view**: headline tonnes saved per year, a per-home breakdown (grid draw and tonnes), the sensitivity range, the NS 3720 method citation, the factor source, assumptions and an estimate disclaimer.
- Reachable from the Verktøy hub (the eighth tool), with a Plausible usage goal.

## Verification

- Local gate green: lint, type-check, format, tests (143), build, bundle budget (the route is 150.7 KB, no 3D).
- Unit tests (5): the smart home avoids emissions versus the reference, the result scales linearly with the factor, the sensitivity range spans the factor span, the SSB reference baseline is used by default, and full self-sufficiency drives the smart home's grid emissions to zero.
- Browser smoke test in NO and EN: the headline, tonnes and breakdown render, the result recomputes when the factor changes, and there are no page errors.

## Honesty and privacy

Stateless, no personal data. Every figure is an indicative estimate with assumptions visible; the method (NS 3720, operational phase only for v1) and the emission factor (source and year) are cited; the disclaimer states it is not a certification or guaranteed climate effect. The result's dependence on the chosen factor is shown explicitly.
