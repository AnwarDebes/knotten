# SPEC-24 completion note

## What was built

Testing and QA automation consolidated, with the end-to-end journeys now committed and run in CI.

- **Unit and integration tests** (Vitest, 143): the calculation modules (energy, price-resilience, monthly cost, sun/terrain occlusion, outage, telemetry, CO2, configurator), the lead engine and consent flow, the admin auth/crypto/RBAC, the content service and validation, analytics, messages parity and the em-dash guard, all against in-process PostgreSQL where a database is needed.
- **End-to-end suite** in `tests/e2e`, run by `scripts/e2e.mjs` (`pnpm e2e`): it starts the production server against the in-process database and drives the critical journeys in a real browser:
  - **admin**: secret-gated bootstrap (and its 401/400/409 paths), unauthenticated access blocked, login then MFA enrolment, lead status update, owner erasure with re-auth, the audit log, and logout (16 checks).
  - **content edit to public update**: create a plot and see it on Området, version history and restore, publish news to Aktuelt (NO and EN), publish an FAQ to the contact page, and validation rejection (9 checks).
  - **news**: index linking, per-post page with NewsArticle JSON-LD, English locale, sitemap inclusion, and a hidden draft (8 checks).
- **CI gates** (a failure blocks merge): lint, type-check, format, unit tests, build, the bundle-size budget, Lighthouse, the new end-to-end job (Playwright Chromium), plus the secret scan and dependency audit.

## Verification

- `pnpm e2e` runs green locally end to end (all three journeys, 33 checks) against a freshly built server; the orchestrator manages the server lifecycle and exits non-zero on any failure.
- The e2e job was added to the CI workflow (installs Chromium, builds, runs `pnpm e2e`).
- Determinism: each journey bootstraps its own owner with a distinct email and uses the in-process database, so runs are repeatable; the unit suite is deterministic (no wall-clock or randomness in assertions; TOTP and dates are injected).

## Notes

Visual regression and a per-route axe sweep are run at go-live against the deployed, access-gated site; the per-tool happy and edge paths are covered by the unit tests and the per-tool browser smokes used during development. The buyer-value tools are stateless, so their journeys carry no data-integrity risk.
