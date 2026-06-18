# SPEC-11: Total monthly cost of ownership calculator (månedskostnad)

## Purpose

Norwegian buyers decide on monthly cost, not list price. A small contractor selling an energy-smart coastal development at Rødberg cannot compete on square-metre price alone, but it can show that low energy demand (passivhus envelope) plus local production (plusskunde, energidleling) turns into a lower, more predictable månedskostnad. This tool monetises the energy advantage in the one number a buyer actually compares: kroner per month. It does this honestly, as an indicative estimate, not a loan offer or financial advice.

## Scope

A stateless calculator that estimates total monthly cost of ownership and sets it side by side with a comparable conventional new home.

- Inputs: indicative kjøpesum, egenkapital, nominell rente, løpetid (years), and felleskostnader.
- Components: indicative boliglån cost (annuity), felleskostnader, and the (low) monthly energistrøm cost pulled from the SPEC-05/SPEC-10 logic for the Knotten home, versus a higher energy cost for a conventional home.
- Output: month-by-month and a 10-20 year cumulative comparison, with the energy delta isolated and labelled.
- Optional: surface relevant Enova-tilskudd (verify current schemes before publishing amounts).

## Dependencies

- SPEC-00 (engineering baseline), SPEC-01 (design system).
- SPEC-05 (energy and savings calculator): supplies the indicative annual energy demand and self-sufficiency that drive the Knotten energy cost.
- SPEC-10 (Din strømtrygghet): supplies the NO2 price and støtteordning model (strømstøtte and Norgespris) so the energy cost line is consistent across tools.
- SPEC-09 (CMS-lite): admin-editable default assumptions (indicative rate, conventional-home baseline, Enova amounts).

## Data

- Loan maths: standard annuity formula in a tested TS module. No PII stored; nothing persisted server-side.
- Energy cost: derived from SPEC-05 demand and SPEC-10 NO2 spot model, accounting for strømstøtte (90% of spot above 77 øre/kWh ex VAT, 96.25 incl., up to 5000 kWh/month, scheme decided through 31 Dec 2029) or Norgespris (50 øre/kWh incl. VAT), and the plusskunde benefit (self-consumed kWh avoid spot, nettleie and avgifter).
- Conventional baseline: SSB household baseline (about 14,700 kWh/year, 2024, labelled with year) as a placeholder until a defensible comparator is agreed.
- Enova (verified June 2026, re-verify before publishing): solar 25% capped 2,500 kr/kW; energilagring 25% max 10,000 kr; smart varmtvannsbereder 25% max 4,000 kr.
- Placeholders (record in INPUTS-NEEDED): indicative kjøpesum, felleskostnader, and the unit count (unknown). Default rente is admin-editable, never presented as a quote.

## Acceptance criteria

- [ ] Every assumption (rente, løpetid, energy demand, price model, Enova amount) is shown with its source.
- [ ] Indicative rates are clearly labelled as indicative, with date, and are not a lånetilbud.
- [ ] Prominent disclaimer: "indikativt, ikke et lånetilbud, snakk med banken/rådgiver."
- [ ] The Knotten-vs-conventional comparison is fair: same loan terms, only the energy line differs, no stacked-deck inputs.
- [ ] Energy cost is consistent with SPEC-05/SPEC-10 (no divergent numbers).
- [ ] No personal data collected or stored; calculation is fully client-side.
- [ ] Lighthouse, axe and the bundle budget all pass.

## Task checklist

- [ ] Annuity and total-cost TS module with unit tests (edge cases: 0% rente, short/long term).
- [ ] Wire energy cost to the shared SPEC-05/SPEC-10 model; do not duplicate the price logic.
- [ ] Inputs UI (rente, løpetid, kjøpesum, egenkapital, felleskostnader) with validation and sane defaults from CMS-lite.
- [ ] Side-by-side monthly view plus a 10-20 year cumulative chart isolating the energy delta.
- [ ] Optional Enova panel, data-driven, with verify-before-publish note and source links.
- [ ] Assumptions/sources panel and the not-financial-advice disclaimer.
- [ ] Loading, empty and error states; reduced-motion fallback; full keyboard operability.
- [ ] Tests (unit, component, axe) and Lighthouse pass.

## Guardrails

- Stateless and no personal data: a buyer-value tool collects no PII; any "email my results" routes only through the consented SPEC-06 lead flow.
- Honesty: every figure is labelled an indikativt estimat, shows its assumptions and source, and is explicitly not financial advice; rates are indicative, dated, and never a loan offer; the comparison must be fair (identical loan terms, only the energy line differs). Enova amounts re-verified before publishing.
- Performance: within the §8 budget (initial route JS at most about 120 KB gzip, no 3D, LCP under 2.5 s, INP under 200 ms, CLS under 0.1, Lighthouse mobile at least 95).
- Accessibility: WCAG 2.2 AA (keyboard, focus, contrast, labelled inputs, chart text alternatives).
- Privacy: analytics via Plausible (EU, cookieless); no cookie banner.

## Out of scope

- Real loan offers, credit checks, bank integrations, or amortisation tax effects (rentefradrag).
- Stamp duty (dokumentavgift on new builds is typically not applicable here) and conveyancing costs beyond a clearly-labelled optional note.
- Final prices, felleskostnader or unit count (placeholders until the client supplies them).
- Investment-return or property-appreciation projections.
