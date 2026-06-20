# SPEC-15 completion note

## What was built

"Når strømmen går", an interactive outage-resilience demo that turns the battery-plus-solar specification into a clear answer: how long the home stays powered, and what keeps running.

- **Backup-hours headline** uses the same critical-load assumption as the SPEC-05 calculator (usable battery divided by the critical load), so the two tools never show divergent numbers.
- **Hour-by-hour simulation** for the interactive timeline: a prioritised, data-driven load model (heat pump, fridge/freezer, lighting, water pump, router, each a sourced estimate), with the heaviest loads shed first as the battery empties and an optional, seasonally adjusted daytime solar recharge.
- **Interactive timeline**: a battery state-of-charge curve (SVG) and an hour slider, both keyboard-operable, showing the remaining charge and which loads are still on at each hour, with and without solar recharge. No 3D, no essential motion.
- **Inputs** for battery size, solar size, season and the solar-recharge toggle, with a Plausible goal on first use. Assumptions and sources are shown, with an indikativt-estimat, requires-professional-verification disclaimer.

## Verification

- Local gate green: lint, type-check, format, tests (129), build, bundle budget (the route is 150.7 KB, within the 152 KB content budget; no 3D).
- Unit tests (6): the critical backup hours match the SPEC-05 formula and scale with battery size; the simulation drains the battery over time; a zero battery powers nothing; daytime solar keeps the battery fuller, more so in summer; and a full battery runs the critical heat-pump load while the heaviest load is shed first as the battery empties.
- Browser smoke test (headless Chromium) in NO and EN: the backup headline, the load list and the SVG curve render, the hour and battery sliders recompute without error, and the English locale works.

## Honesty and privacy

Stateless, no personal data. The backup figure matches the energy calculator; loads are typical averaged draws labelled with their source; solar recharge is derived from indicative PVGIS yield. Every figure is an indicative estimate, not a guarantee, and requires professional verification. Real heating demand, battery product and appliance inventory are unknown placeholders recorded in INPUTS-NEEDED.
