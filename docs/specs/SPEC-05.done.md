# SPEC-05 completion note

## What was built

The energy and savings calculator, at /verktoy/energi (NO) and /tools/energy (EN), linked from the Verktøy hub.

- **Pure, tested model** (`src/lib/energy.ts`): inputs (home size, orientation, household, optional EV, optional battery) to indicative outputs (annual electricity demand, solar production, self-sufficiency, annual saving, outage reserve hours). Stateless, no personal data, no side effects.
- **Anchored to the research**, with every assumption exported and shown in the UI with its source: passivhus heating about 15 kWh/m2 per year via a heat pump, SSB-level household electricity, solar about 1010 kWh/kWp per year (PVGIS) with an orientation factor, the plusskunde avoided cost on self-consumed kWh, and a battery for self-consumption and outage reserve.
- **Interactive UI** (`src/components/tools/energy-calculator.tsx`) built from the design system, recomputing live. It uses native select and checkbox inputs (accessible and zero extra client JS), so the tool page stays at 148 KB, within the content budget.
- **Honest by construction**: every figure is labelled an indicative estimate, the disclaimer states it is not a guarantee and needs professional energy modelling, the assumptions and sources are shown, and no personal data is collected.

## Verification

- Local gate green: lint, type-check, format, tests (added 5 calculator-model tests), build, bundle budget.
- Rendered and exercised in the headless browser: toggling the battery makes the outage-reserve result appear and raises self-sufficiency; the figures are internally consistent (for example 140 m2 with an EV gives 9 700 kWh demand, 41% self-sufficiency, about 5 600 kr per year, 13 hours of reserve).
- The page is axe-clean; all inputs have labels.

## Notes

- The avoided-cost and self-consumption figures are indicative for NO2 after the current support schemes; they are labelled as such. An optional "email my results" action, if added later, would route only through the consented Meld interesse flow (no PII here).
- The other tools on the Verktøy hub remain "kommer snart" until their specs (SPEC-10, 11, 12, 14, 15, 16).
