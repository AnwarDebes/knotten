# SPEC-23 completion note

## What was built

Security hardening across all surfaces, with the threat model and statements finalised.

- **Enforced CSP**: a public Content-Security-Policy now applies to all non-admin routes (locks framing, base-uri and object-src; constrains sources to self plus Plausible and OpenStreetMap, including the worker and connect sources the map needs), alongside the stricter admin CSP. Added HSTS to the baseline headers.
- **Threat model and OWASP Top 10**: `docs/security/threat-model.md` updated with a post-build implementation-status section; every OWASP 2021 category is reviewed against the shipped controls.
- **GDPR Article 32 statement**: `docs/security/gdpr-article-32-statement.md` updated with the implemented technical and organisational measures.
- **Already in place from earlier specs**: scrypt + mandatory TOTP MFA, lockout, hashed short sessions with secure cookies, server-side RBAC, CSRF protection on forms and Server Actions, rate limiting, honeypot, email-header-injection guard, enumeration-safe responses, salted IP hashing, owner-gated content mutations, signature-checked uploads, allowlisted redirects, escaped rendering, parameterised ORM queries, a PII-free audit log, and CI dependency audit plus secret scan.

## Verification

- Local gate green: type-check, build, bundle budget, tests.
- The enforced public CSP was verified with a headless-browser check across the home page, a calculator and the neighbourhood map: zero CSP violations, including the MapLibre Web Worker (blob) and the OpenStreetMap tile fetches.
- `pnpm audit --audit-level=high` is clean; gitleaks runs in CI; no secrets in history (the access token lives only outside the repo).
- Auth and form abuse paths (rate limit, lockout, CSRF, honeypot, re-auth) are covered by the SPEC-06/07 unit tests and the admin end-to-end run.

## Known residuals (go-live)

The public CSP keeps `'unsafe-inline'` for styles and the small inline JSON-LD/analytics-init scripts because the public pages are statically rendered; a nonce-based, no-inline CSP requires dynamic SSR and is a documented go-live trade-off. Least-privilege DB user, TLS in transit and encryption at rest are properties of the managed EU Postgres confirmed at go-live; PII-scrubbed error tracking is wired in SPEC-26.
