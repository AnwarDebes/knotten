# Contributing

Conventions for working on this repository.

## Workflow

- Work one specification at a time, to completion, before starting the next. A spec is complete only when its acceptance criteria, the quality gate (lint, type-check, build, tests, accessibility, Lighthouse, bundle budget, security checks) and the performance budget all pass.
- One spec maps to one branch and one focused set of commits, with a short completion note in `docs/specs/<spec>/`.
- Commit frequently. Never leave work uncommitted at the end of a session.

## Commits

- Conventional Commits style: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`, `perf:`.
- Write messages in the imperative mood describing the change and its rationale. Keep them concise and specific.

## Code quality

- TypeScript in strict mode. No `any` without a documented reason.
- ESLint and Prettier are authoritative; commit hooks run them.
- Build every feature from the design system. No ad-hoc styles.
- Every feature ships with its loading, empty and error states, is accessible (WCAG 2.2 AA), is responsive, and is tested.
- Parameterised database access only. Validate and sanitise all input. Never log personal data.

## Tests

- Unit tests for logic, especially calculators and validation.
- Integration tests for API routes, especially lead capture, authentication and the admin layer.
- End-to-end tests (Playwright) for the critical journeys.
- Accessibility checks (axe) and Lighthouse budgets run in CI.

## Secrets

- Never commit secrets. Use environment variables and the platform secret manager. Only `.env.example` is committed.
