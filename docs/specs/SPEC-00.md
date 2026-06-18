# SPEC-00: Foundation and engineering baseline

## Purpose

Knotten is a one-person site for marketing an energy-smart coastal development at Rødberg, Sniksfjorden, Lindesnes kommune (Agder), at the outlet of the Audna river (price zone NO2). A solo contractor cannot afford regressions, leaked secrets, or buyer-facing copy that overstates savings and invites complaints. This spec establishes the engineering baseline every later spec depends on: a clone that builds, a CI gate that blocks bad merges, and conventions that keep honesty, privacy, and performance enforceable rather than aspirational.

## Scope

- TypeScript in strict mode; ESLint and Prettier with a shared config.
- Pre-commit hooks (lint, format, type-check on staged files) and Conventional Commits enforcement.
- CI pipeline: install, lint, type-check, test, build, Lighthouse CI, bundle-size budget, dependency audit, and secret scan.
- `.env.example`, `README`, `CONTRIBUTING`, `SECURITY`, a license, and the `docs/` tree (specs, decisions, data placeholders).

## Dependencies

None. SPEC-00 is the root; all later specs (A Foundation onward) build on it.

## Data

No application data model here. CI thresholds and the energy/site reference figures live as committed configuration and a single `docs/data/placeholders.md` source of truth: unit/plot count UNKNOWN (the "8" was internship positions, not homes), no real site photography yet, solar about 1000-1020 kWh/kWp/yr (PVGIS), SSB baseline about 14,700 kWh/yr. Every figure is marked indicative and an estimate. Real client data replaces placeholders without code changes.

## Acceptance criteria

- [ ] Fresh clone runs from documented commands only.
- [ ] CI is green, including Lighthouse CI and the bundle-size budget.
- [ ] Secret scan passes; no secrets committed.
- [ ] Zero lint errors and zero type errors.

## Task checklist

- [ ] Initialise repo, `package.json`, strict `tsconfig.json`.
- [ ] Add ESLint, Prettier, and shared editor config.
- [ ] Wire Husky and lint-staged; add commitlint for Conventional Commits.
- [ ] Author CI workflow with all gates above; set bundle and Lighthouse budgets.
- [ ] Add `.env.example`, `README`, `CONTRIBUTING`, `SECURITY`, license, `docs/` tree.
- [ ] Add `docs/data/placeholders.md` with sourced, labelled estimates.

## Guardrails

- Buyer-value tools (savings, solar, energy) must be stateless and store no personal data.
- Every estimate is labelled, sourced (PVGIS, SSB, Stroemstoette, Norgespris, NS 3700/3701), and disclaimed in public copy.
- Performance budget enforced in CI: Lighthouse and a bundle-size ceiling.
- WCAG 2.2 AA across all UI.
- Analytics via Plausible (EU, cookieless): no cookie banner; email and database in the EU/EEA only.

## Out of scope

Marketing pages, calculators, maps, terrain/orthophoto integration, CMS, and deployment. Those are addressed in later specs.
