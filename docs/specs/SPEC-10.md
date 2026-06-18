# SPEC-10: Price-resilience tool (Din strømtrygghet, NO2-specific)

## Purpose
Rødberg sits in price zone NO2 (Sørvest-Norge), historically among Norway's highest and most volatile, because Sørlandet is the hub for power trade with Europe. For a small groundwork contractor selling an energy-smart coastal development, the energy story is the financial story: it must be made concrete without overpromising. This tool shows, with real NO2 spot-price history, how a low-energy, self-producing, battery-backed home reduces exposure to price spikes and to the uncertainty around temporary support schemes. The frame is independence and reduced exposure, not guaranteed kroner saved, which is both honest and more durable as rates and rules change.

## Scope
A stateless, public tool ("Din strømtrygghet") that, against real NO2 historical hourly spot prices:
- shows the share of consumption that is self-covered, where self-consumed kWh avoid spot price, nettleie and avgifter entirely (the plusskunde benefit behind the meter);
- illustrates how battery storage shifts load from expensive to cheap hours;
- compares an energy-smart home to a grid-dependent home across recent volatile periods;
- accounts for both current household schemes (ordinær strømstøtte and the optional Norgespris) when computing the grid-exposed portion.

## Dependencies
- SPEC-00 (engineering baseline, CI, budget gate).
- SPEC-01 (design system, accessible components, motion signature).
- SPEC-02 (Verktøy hub linking and page shell, NO/EN).
- SPEC-05 (shared, tested energy/calc TS modules: demand, solar yield, self-sufficiency); reuse, do not duplicate.
- SPEC-08 (Plausible goal for tool use).

## Data
- Spot prices: hvakosterstrommen.no public API (hourly NOK/kWh per zone, ex VAT, history from 1 Dec 2021), with ENTSO-E as documented fallback and cross-check. Cite both; cache daily files. See docs/research/no2-spotpris-datakilder.md.
- Support schemes: strømstøtte (state covers 90% of spot above 77 øre/kWh ex VAT, 96.25 incl., hourly per zone, up to 5000 kWh/month) and Norgespris (50 øre/kWh incl. VAT, 40 in the north), schemes decided through 31 Dec 2029; Norgespris binding through the current period (31 Dec 2026). See docs/research/strompris-og-stotteordninger.md.
- Consumption profile, solar yield (about 1000-1020 kWh/kWp/yr, PVGIS), and battery size are illustrative, editable inputs anchored to SSB baselines (about 14,700 kWh/yr) and passivhus demand. Placeholder: no per-plot metered consumption exists; record in docs/INPUTS-NEEDED.md. No personal data is collected.

## Acceptance criteria
- [ ] Uses real NO2 historical spot-price data with a cited, license-clean source.
- [ ] Framing is honest: independence and reduced exposure, never a guaranteed-savings promise.
- [ ] Accounts for current strømstøtte and Norgespris when computing grid exposure.
- [ ] All assumptions, sources and an indikativt-estimat disclaimer are visible.
- [ ] Stateless and collects no personal data.
- [ ] Within the SPEC-8 performance budget; WCAG 2.2 AA; reduced-motion fallback.

## Task checklist
- [ ] Add a typed NO2 price client (primary + ENTSO-E fallback) with daily caching and graceful degradation.
- [ ] Select and document representative volatile periods from real history.
- [ ] Implement scheme logic (strømstøtte threshold/cap; Norgespris fixed price) as tested pure functions.
- [ ] Model self-consumption vs grid draw and battery hour-shifting, reusing SPEC-05 modules.
- [ ] Build the exposure comparison view (energy-smart vs grid-dependent) with light animated SVG, not 3D.
- [ ] Surface assumptions, sources and disclaimer inline; add NO/EN copy.
- [ ] Wire the Plausible usage goal; unit-test calc and scheme logic; verify budget and a11y.

## Guardrails
- Privacy: stateless; no personal data; any "email my results" routes only through the consented SPEC-06 lead flow.
- Honesty: every figure labelled an indikativt estimat with assumptions and source shown; disclaimer "ikke en garanti for besparelse, krever profesjonell verifikasjon"; framed as exposure, not promised savings.
- Performance: within the SPEC-8 budget (initial route JS at most about 120 KB gzip; LCP under 2.5 s, INP under 200 ms, CLS under 0.1; Lighthouse mobile at least 95; no 3D).
- Accessibility: WCAG 2.2 AA, full keyboard operability, sufficient contrast, charts with text/table alternatives, prefers-reduced-motion respected.

## Out of scope
- Live or real-time pricing, alerts, or a price forecast.
- Per-household billing, real metered consumption, or any account/login.
- Tariff modelling beyond the indicative nettleie and avgifter components used for the exposure comparison.
- The full monthly cost of ownership view (SPEC-11) and outage-duration modelling (SPEC-15).
