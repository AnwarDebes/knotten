# SPEC-00 completion note

## What was built

- Next.js 16 (App Router, TypeScript strict, plus `noUncheckedIndexedAccess`), React 19, Tailwind CSS v4.
- ESLint 9 (flat config from eslint-config-next) and Prettier, with a Tailwind class-sorting plugin.
- Git hooks via husky: pre-commit runs lint-staged (eslint and prettier on staged files), commit-msg runs commitlint (Conventional Commits).
- Vitest with Testing Library and jsdom; a first tested library module (`src/lib/format.ts`, Norwegian number and currency formatting) with unit tests.
- `.env.example` documenting every planned environment variable (site, database, auth, email, analytics, captcha, maps).
- A GitHub Actions CI pipeline: install, lint, type-check, format check, unit tests, build, the bundle-size budget, and Lighthouse; plus a secret scan (gitleaks) and a dependency audit.
- The performance budget gate (`scripts/check-bundle-size.mjs`) measuring real first-load JS from prerendered HTML.
- The home page is a clean, accessible Norwegian placeholder. `robots` and metadata keep the site noindex until go-live (`SITE_INDEXABLE`).

## Decisions and deviations

- Package manager is pnpm (the environment had no npm or corepack).
- The production build uses the webpack bundler, which measured about 122 KB gzip first-load versus about 142 KB with Turbopack. This keeps the performance budget and the Lighthouse score within target. Recorded in ADR-0011, including the deprecation trade-off and the pinned Next version.
- The enforced first-load ceiling is 130 KB gzip per content route. The Next 16 plus React 19 App Router framework floor is about 122 KB, so the brief's "about 120 KB" target sits at the floor; per-route budgets for interactive tool pages come in SPEC-22. Recorded in ADR-0011.

## Verification

- Local: lint, type-check, format check, unit tests, build, and the bundle budget all pass.
- CI runs the same gate plus Lighthouse and the security scans on every push.

## Follow-ups

- Replace the default favicon and finalise branding in SPEC-01.
- Introduce next-intl routing (NO default, EN) in SPEC-02; the current single page becomes locale-aware.
- Add per-route performance budgets and the full accessibility and SEO pass in SPEC-22.
