# SPEC-24: Testing and QA automation

## Purpose
A small contractor (Sigve Simonsen AS) selling an energy-smart coastal development at Rødberg ships this platform alone, without a QA team, and a single visible defect on a buyer-value tool, the lead form or an estimate label damages credibility with buyers, partners and Lindesnes kommune. Automated testing is the safety net that lets one developer change calculators, content and admin code without silently breaking a critical journey or leaking personal data. This spec consolidates the testing that earlier specs added piecemeal into one enforced, green-or-block pipeline.

## Scope
- Unit tests for logic, especially the calculator engines (SPEC-05, SPEC-10, SPEC-11) and all server-side validation and sanitisation.
- Integration tests for API routes: lead capture and double opt-in (SPEC-06), admin auth and RBAC (SPEC-07), content read/write (SPEC-09).
- End-to-end tests in Playwright: the interest registration flow, admin login plus TOTP MFA, a content edit propagating to the public view, and each buyer-value tool through both a happy path and an edge path.
- Visual regression on key pages (forside, et tool page, Tomtene, admin shell).
- Accessibility automation: axe in CI on representative routes.
- Lighthouse CI enforcing the performance budget.

## Dependencies
- SPEC-00: engineering baseline, CI runner, EU test database, the existing quality gate this spec hardens.
- SPEC-05 / SPEC-10 / SPEC-11: calculator logic under unit test.
- SPEC-06 / SPEC-07 / SPEC-09: the lead, auth and content routes under integration and E2E test.
- SPEC-22 (SEO, performance, a11y) and SPEC-23 (security hardening): this spec enforces their budgets and checks as automated gates.

## Data
- Synthetic fixtures only: fake leads, test e-post addresses, seeded admin users with test TOTP secrets, placeholder plots from the SPEC-04 data-driven source. No client or real personal data in any fixture, snapshot or CI artifact.
- Calculator test vectors derived from the verified NO2 figures (stømstøtte 90% above 77 øre/kWh ex VAT, Norgespris 50 øre/kWh, ~1000–1020 kWh/kWp, SSB ~14 700 kWh baseline). Where client inputs are unknown (plot count, controller identity), tests assert behaviour against the marked placeholder, not a hardcoded value.

## Acceptance criteria
- [ ] All suites (unit, integration, E2E, visual, a11y, Lighthouse) run in CI and pass; a failure blocks merge.
- [ ] E2E covers the critical journeys: interest flow, admin login plus MFA, content edit to public update, and every tool's happy and edge path.
- [ ] Visual regression guards the key pages and fails on unreviewed UI change.
- [ ] axe (a11y) and Lighthouse gates are enforced, not advisory.
- [ ] No flaky tests: the suite is deterministic across repeated CI runs.

## Task checklist
1. Set up the test runner, Playwright, axe-core and Lighthouse CI in the pipeline with EU-hosted test data.
2. Add unit tests for calculator engines and all server-side validation, including edge and boundary inputs.
3. Add integration tests for lead capture and double opt-in, admin auth and RBAC, and content read/write routes.
4. Author Playwright E2E for each critical journey, with stable selectors and seeded synthetic state.
5. Configure visual regression with reviewed baselines on the key pages.
6. Wire axe checks and Lighthouse budgets as blocking CI gates.
7. Stabilise: remove timing races, retries-masking-bugs and order dependence; quarantine policy for genuinely external flake.
8. Document how to run, update baselines and read failures; update PROGRESS and the DONE note.

## Guardrails
- Honesty: tests assert that every public estimate is labelled (indikativt estimat), sourced and disclaimed, and carries ikke profesjonell rådgivning; no test fixture presents a figure as a promise.
- Privacy: buyer-value tools are verified stateless and personal-data-free; only the SPEC-06 consented flow handles PII; no real personal data, and no PII in CI logs, snapshots or artifacts.
- Performance: Lighthouse CI enforces the §8 budget (initial route JS ≤ ~120 KB gzip, LCP < 2.5 s, INP < 200 ms, CLS < 0.1) on a mid-range mobile profile.
- Accessibility: axe enforces WCAG 2.2 AA on representative routes; E2E exercises keyboard operability and reduced-motion paths.

## Out of scope
- Manual exploratory QA and usability testing sessions.
- Load, stress and penetration testing (security depth lives in SPEC-23).
- Production monitoring, error tracking and uptime alerting (SPEC-26).
- Writing the application features themselves; this spec tests them, it does not build them.
