# SPEC-13: Living community energy dashboard

## Purpose
A small groundwork contractor selling an energy-smart coastal development at Rødberg (Sniksfjorden, Lindesnes, price zone NO2) needs to make an abstract promise (shared local energy, storage, outage robustness) feel concrete to buyers, the kommune and partners. This module is the "imagine living here" moment: a calm, aspirational dashboard that shows the development behaving as one energy community. It turns the engineering pillars (local production, energy sharing, storage, resilience) into something a non-expert grasps at a glance, while staying scrupulously honest that no homes are built and no telemetry exists yet.

## Scope
A lightweight, server-rendered dashboard with four tiles: solar field production today, shared-battery state of charge, community self-sufficiency percent, and a narrated outage event where homes stayed powered. The whole view is labelled an illustrative simulation (NO: *illustrativ simulering*). All parameters are admin-editable via SPEC-09. The data layer is built against a clean `EnergyTelemetrySource` interface whose only implementation now is a deterministic `SimulatedSource` driven by the admin parameters; a future `LiveInverterSource` / `LiveBatterySource` can be dropped in without UI changes. Animated SVG/Lottie only, no heavy 3D.

## Dependencies
- SPEC-00 (engineering baseline, CI budget gate).
- SPEC-01 (brand and design system).
- SPEC-03 (energy concept: shared base, plusskunde/energy-sharing framing reused here).
- SPEC-05 (calculator: self-sufficiency and outage-hours logic reused, not duplicated).
- SPEC-09 (CMS-lite: admin-editable dashboard mode and parameter values).
- Cross-references SPEC-15 (outage-resilience demo) for the outage narrative model.

## Data
Data-driven against placeholders; unit/plot count is UNKNOWN (data-driven, defaults to a placeholder count flagged in INPUTS-NEEDED). Admin-tunable parameters: installed kWp, yield (default about 1000–1020 kWh/kWp/year, PVGIS, indicative), shared-battery capacity and SoC bounds (energy sharing at most 1 MW AC per property; feed-in at most 100 kW), per-household baseline (SSB about 14,700 kWh/year), self-sufficiency target, and a scripted outage scenario (start, duration, loads kept running). The `SimulatedSource` derives "today" from a daily/seasonal curve seeded for repeatability. No live values exist; every figure carries a source and an *indikativt estimat* label.

## Acceptance criteria
- [ ] Dashboard is unmistakably marked an illustrative simulation in NO and EN, on every tile.
- [ ] All parameters editable through SPEC-09 with validation; changes reflect on the public view.
- [ ] `EnergyTelemetrySource` interface is clean and documented; swapping to a live source needs no UI change.
- [ ] No simulated number is presented as live or real anywhere.
- [ ] Stateless, no personal data collected or stored.
- [ ] Lightweight (animated SVG/Lottie, no 3D) and within the §8 budget.
- [ ] WCAG 2.2 AA: keyboard, contrast, reduced-motion fallback, accessible names for tiles and charts.

## Task checklist
- [ ] Define `EnergyTelemetrySource` (production, batterySoc, selfSufficiency, outageEvent) and a deterministic `SimulatedSource`.
- [ ] Build the four tiles as server-rendered HTML with animated SVG/Lottie enhancement.
- [ ] Wire admin-editable parameters and dashboard mode through SPEC-09; validate inputs.
- [ ] Reuse SPEC-05 self-sufficiency and outage-hours logic; avoid divergent math.
- [ ] Add bilingual simulation labels, assumptions and source notes per tile.
- [ ] Provide reduced-motion and no-JS fallbacks; add unit and a11y tests.
- [ ] Record placeholders (plot count, telemetry endpoints) in INPUTS-NEEDED.

## Guardrails
- Buyer-value tool: stateless, collects and stores no personal data; any "share results" routes only through the consented SPEC-06 lead flow.
- Honesty: every value labelled *illustrativ simulering* / *indikativt estimat*, sourced (PVGIS, SSB, scheme rules) and disclaimed; simulated data is never shown as live telemetry.
- Privacy: EU/EEA only; cookieless Plausible, no extra cookies, no tracking pixels.
- Performance: within §8 (initial route JS at most about 120 KB gzip, no 3D in the initial bundle, LCP under 2.5 s, INP under 200 ms, CLS under 0.1, Lighthouse mobile at least 95, motion 60 fps on transform/opacity only).
- Accessibility: WCAG 2.2 AA, axe clean (zero serious/critical), full keyboard path, reduced-motion fallback.

## Out of scope
Real inverter/battery telemetry and live data ingestion (interface stubbed only); per-home metering or billing; storing or attributing any household's consumption; predictive forecasting; the standalone outage walkthrough owned by SPEC-15; any 3D scene.
