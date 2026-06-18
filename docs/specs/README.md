# Specifications

The platform is built one specification at a time, to completion, before the next. A spec is done only when its acceptance criteria, the quality gate (lint, type-check, build, tests, accessibility, Lighthouse, bundle budget, security checks) and the performance budget all pass. Each spec file states its scope, dependencies, acceptance criteria and task checklist; a short completion note is added under the spec when it ships.

Specs are ordered so each builds only on earlier ones. Where a feature needs client data that is not yet available, it is built data-driven against a clearly marked placeholder and the gap is recorded in INPUTS-NEEDED.

## Group A: Foundation

- [SPEC-00](SPEC-00.md): Foundation and engineering baseline
- [SPEC-01](SPEC-01.md): Brand and design system

## Group B: Core site and content

- [SPEC-02](SPEC-02.md): Marketing site information architecture and content (NO/EN)
- [SPEC-03](SPEC-03.md): Energy concept experience

## Group C: The 3D showpiece and calculators

- [SPEC-04](SPEC-04.md): Interactive 3D terrain and plot map (the showpiece)
- [SPEC-05](SPEC-05.md): Energy and savings calculator

## Group D: Lead, admin, analytics and content management

- [SPEC-06](SPEC-06.md): Interest registration and GDPR consent engine
- [SPEC-07](SPEC-07.md): Admin dashboard and lead management
- [SPEC-08](SPEC-08.md): Privacy-first analytics and interest measurement
- [SPEC-09](SPEC-09.md): Admin-editable content layer (CMS-lite)

## Group E: Buyer-value feature modules

- [SPEC-10](SPEC-10.md): Price-resilience tool (Din strømtrygghet, NO2-specific)
- [SPEC-11](SPEC-11.md): Total monthly cost of ownership calculator (månedskostnad)
- [SPEC-12](SPEC-12.md): Year-round sun and daylight on your plot
- [SPEC-13](SPEC-13.md): Living community energy dashboard
- [SPEC-14](SPEC-14.md): Neighbourhood and amenities map (Livet her)
- [SPEC-15](SPEC-15.md): Outage-resilience demo (Når strømmen går)
- [SPEC-16](SPEC-16.md): House and energy configurator
- [SPEC-17](SPEC-17.md): Fremdrift timeline and FAQ
- [SPEC-18](SPEC-18.md): Shareable per-plot deep-link pages
- [SPEC-19](SPEC-19.md): Aktuelt news and updates
- [SPEC-20](SPEC-20.md): For kommunen og partnere plus downloadable kit
- [SPEC-21](SPEC-21.md): CO2 and environmental gain (optional, honest estimate)

## Group F: Cross-cutting quality (applied continuously, finalised here)

- [SPEC-22](SPEC-22.md): SEO, performance and accessibility (WCAG 2.2 AA)
- [SPEC-23](SPEC-23.md): Security hardening and threat model
- [SPEC-24](SPEC-24.md): Testing and QA automation
- [SPEC-25](SPEC-25.md): Concept deliverables
- [SPEC-26](SPEC-26.md): Deployment, observability, handover and demo
