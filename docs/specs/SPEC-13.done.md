# SPEC-13 completion note

## What was built

A calm, aspirational community energy dashboard that makes the shared-energy promise concrete, while staying scrupulously honest that no homes are built and no telemetry exists yet.

- **Clean telemetry interface**: `EnergyTelemetrySource` (production, battery state of charge, community self-sufficiency, outage event). The only implementation today is a deterministic `SimulatedSource` driven by admin parameters; a live inverter or battery feed can replace it with no UI change.
- **Four tiles** on the resilience page: solar production today, shared-battery state of charge, community self-sufficiency, and a narrated outage event where homes stayed powered. Each tile is server-rendered with a small reduced-motion-safe SVG and is marked an illustrative simulation; the section header carries the same badge.
- **Admin-tunable via SPEC-09**: the dashboard parameters (installed kWp, yield, battery, state-of-charge bounds, household baseline, plot count, outage scenario) come from the CMS-lite dashboard editor; editing them revalidates the public page. Bad or empty input falls back to documented defaults.
- **Consistent maths**: production follows a seasonal curve, and self-sufficiency and outage coverage reuse the SPEC-05 energy assumptions (self-consumption rate, usable battery, critical load), so the numbers do not diverge from the other tools.

## Verification

- Local gate green: lint, type-check, format, tests (118), build, bundle budget. The dashboard is server-rendered SVG with no client JavaScript, so the resilience route stays at 146 KB, well within budget and with no 3D.
- Unit tests (8): determinism for a given day, summer production above winter, state of charge within its bounds, self-sufficiency within 0 to the 95% cap, all homes powered when the battery covers the outage and fewer when it cannot, and parameter parsing that merges admin values over defaults and ignores bad JSON.
- Server-rendered output verified in NO (`/no/robusthet`) and EN (`/en/resilience`): all four tiles and the illustrative-simulation label render without JavaScript.

## Honesty and privacy

Stateless, no personal data. Every value is labelled an illustrative simulation and is never presented as live telemetry; assumptions (PVGIS, SSB, the adopted schemes) are cited. Real inverter and battery feeds are interface-only; the plot count is a flagged placeholder recorded in INPUTS-NEEDED.
