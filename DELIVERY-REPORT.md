# Delivery report: Knotten, Sjøutsikt i Rødberg

A digital platform and concept deliverables for Sigve Simonsen AS: an energy-smart coastal housing development at Rødberg by Sniksfjorden in Lindesnes (price zone NO2). This report summarises what was built across the full programme (SPEC-00 to SPEC-26), how it was verified, what is deliberately a placeholder, and what remains for go-live.

## What was delivered

A production-grade Next.js platform plus a set of board-ready documents, all telling one consistent, honest story.

**Marketing site (NO default, EN parity).** Thirteen-plus pages with localised paths, per-page metadata, canonical and hreflang with x-default, Open Graph, a sitemap and indexability gated until go-live. A zero-JavaScript header, an accessible design system, and the energy-concept experience.

**3D terrain showpiece.** A real Kartverket elevation model of the site rendered in the browser (React Three Fiber), code-split and capability-gated, with a baked static fallback for mobile and reduced-motion, a sun-path toggle, and data-driven placeholder plots.

**Eight buyer-value tools**, all stateless and consistent with one shared, tested energy model: the energy and savings calculator; Din strømtrygghet (price resilience on real NO2 spot-price history); the monthly cost of ownership calculator; year-round sun and daylight per plot (from the real terrain); the community energy dashboard; the neighbourhood and amenities map (MapLibre over OpenStreetMap); the outage-resilience demo; the house and energy configurator; and the CO2 and environmental-gain estimate.

**The crown jewel: a consent-first lead engine.** Interest registration with a verbatim per-lead consent record, double opt-in, one-click withdrawal, atomic anti-abuse (honeypot, same-origin check, rate limiting, optional Turnstile, email-header-injection guard), salted IP hashing and enumeration-safe responses, on Drizzle over PostgreSQL (in-process PGlite for development and tests, the hosted EU database in production through the same schema and migrations).

**Admin control room.** Password plus mandatory TOTP MFA, lockout, short hashed sessions, server-side RBAC, lead search and management, CSV and per-subject DSAR export, one-click GDPR erasure with re-auth, and a PII-free audit log.

**Admin-editable content layer (CMS-lite).** Plots, timeline, FAQ, news, text blocks, dashboard parameters and image slots, with versioning and restore, validated server-side, reflected on the public site through ISR. Per-plot shareable pages, the Aktuelt news section with Article structured data, and the fremdrift timeline plus cited FAQ all consume this layer.

**Privacy-first analytics** (Plausible, EU, cookieless, no banner) with named goals.

**Concept deliverables and a stakeholder kit.** Ten board-ready documents in plain Norwegian (energy concept, feasibility briefs, an editable energy model, zoning recommendations, resilience rationale, market strategy, a non-technical overview, a privacy-policy draft, a kommune/partner deck and a one-pager), generated from the platform's figures and offered as a download kit on the For kommune og partnere page.

## How it was verified

- **CI gates on every change** (a failure blocks merge): lint, type-check, format, unit tests, build, the bundle-size budget, Lighthouse, end-to-end journeys (Playwright), a secret scan and a dependency audit.
- **Tests**: 143 unit and integration tests (the calculation modules, the lead and consent engine, admin auth and RBAC, the content layer), plus an end-to-end suite covering admin login and MFA, content edit to public update, and the news pages.
- **Honesty discipline**: every public estimate is labelled indicative, sourced and disclaimed; nothing is presented as final or guaranteed.

## Corrected and verified figures

Phase 0 research corrected the brief's starting figures and they are used consistently everywhere: the "8" from the original brief refers to advertised student-internship positions, not homes, so the unit/plot count is treated as unknown; solar yield is about 1000 to 1020 kWh/kWp per year (PVGIS); the household baseline is the SSB figure (about 14,700 kWh/year, 2024); the NO2 support schemes (strømstøtte, Norgespris) and energy-sharing rules are cited with dates. Sources are listed in `docs/research/` and in each deliverable.

## What is a placeholder (needs the client's data)

Recorded in `docs/INPUTS-NEEDED.md`: the exact number of plots and their survey data, prices and status; the data-controller identity for the privacy policy; real site photography (none exists, so honest placeholders are used with AI/illustration disclosure); real house types; the exact site coordinate and municipal confirmations (nærskole, sea access, trails); and the energy-engineering figures that move estimates toward verified values.

## What remains for go-live

The platform runs end to end on an in-process database and a no-send email path for development. Go-live (the steps and checklist are in `HANDOVER.md` and `docs/runbooks/deploy-and-secrets.md`) connects the real EU infrastructure: a hosted EU PostgreSQL, an EU/EEA email provider and Turnstile, each with a data processing agreement; provisions the admin owner; wires the retention cron and error tracking; and performs a tested database restore. Double opt-in, anti-abuse and erasure get one end-to-end verification against the real infrastructure during go-live review. The privacy policy and consent text need legal/DPO sign-off, and the energy figures need professional modelling before being presented as final.

## Security and privacy

Consent-first design, EU/EEA data only, cookieless analytics (no banner, with the legal basis documented), enforced security headers and Content-Security-Policy, mandatory MFA, least-privilege RBAC, a PII-free audit log, and a documented threat model, OWASP Top 10 review and GDPR Article 32 statement (`docs/security/`).

## Definition of done

All twenty-seven specifications (SPEC-00 to SPEC-26) are implemented and CI-green; each carries a completion note under `docs/specs/*.done.md`. The infrastructure-dependent acceptance items (production deploy, error-tracker DSN, uptime monitor, tested restore, and end-to-end verification against the real EU services) are documented and performed at go-live, consistent with the build-now, connect-infra-at-go-live approach agreed for the project.

## Where to look

- `HANDOVER.md`: operating the platform, provisioning and the go-live checklist.
- `docs/DEMO.md`: the five-minute demo walkthrough.
- `docs/runbooks/`: deploy and secrets, backup and restore, incident response, observability, DSAR and erasure, content editing, reading the analytics.
- `docs/specs/*.done.md`: per-specification completion notes.
- `docs/INPUTS-NEEDED.md`: the client data still required.
- `docs/security/` and `docs/privacy/`: the security and privacy documentation.
