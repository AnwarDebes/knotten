# SPEC-10 completion note

## What was built

"Din strømtrygghet", a stateless public tool that shows, against real NO2 historical spot prices, how an energy-smart home reduces exposure to price spikes. The frame is independence and reduced exposure, never a guaranteed saving.

- **Real NO2 data**: hourly spot prices (NOK/kWh ex VAT) for three representative periods (an expensive volatile winter 2022, winter 2024, calm summer 2024) fetched from hvakosterstrommen.no and cached as compact JSON under `public/data/no2` (loaded at runtime, not bundled). The fetch is reproducible via `scripts/fetch-no2-prices.mjs`.
- **Scheme logic** as tested pure functions: ordinær strømstøtte (state covers 90% of spot above 77 øre/kWh ex VAT) and Norgespris (fixed 50 øre/kWh incl VAT). The household is shown the cheaper of the two.
- **Exposure model**: self-consumed solar behind the meter avoids spot, nettleie and avgifter entirely; a battery shifts up to its daily capacity from the most expensive hours to the cheapest; the energy-smart home is compared to a grid-dependent one across the chosen period, including cost during the most expensive tenth of hours.
- **Tool UI**: period, household, solar-share and battery inputs; a self-covered share, an exposure comparison, an hourly price strip (light SVG, no 3D, no motion), a scheme note, and a full numeric table alternative. Assumptions, the data source attribution and an indikativt-estimat disclaimer are inline. A Plausible goal fires on first use.

## Verification

- Local gate green: lint, type-check, format, tests (94), build, bundle budget. The tool fetches its data at runtime, so the price series stays out of the bundle and the route is within budget.
- Unit tests (11): the strømstøtte threshold and Norgespris fixed price, the consumer price build-up, self-cover removing grid draw, a fully self-covered home costing nothing, the battery lowering cost by shifting load, the energy-smart home being less exposed than a grid-dependent one, spike-cost accounting, and scheme selection.
- Browser smoke test (headless Chromium) in NO and EN: the tool loads the real data, computes the self-covered share, the reduction and the price strip, and keeps working when toggling the battery and switching periods, with no page errors.

## Honesty and privacy

Stateless, no personal data. Every figure is labelled an indicative estimate with assumptions and source shown; the disclaimer states it is not a guarantee of savings and requires professional verification. Per-plot metered consumption does not exist and is recorded in INPUTS-NEEDED; the demand figures are indicative. Data source and support-scheme references: `docs/research/no2-spotpris-datakilder.md` and `docs/research/strompris-og-stotteordninger.md` (checked June 2026).
