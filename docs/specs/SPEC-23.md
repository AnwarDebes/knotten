# SPEC-23: Security hardening and threat model

## Purpose

Sigve Simonsen AS is a small contractor selling an energy-smart coastal development at Rødberg, Sniksfjorden (Lindesnes, Agder). The platform carries no payment flow, but it does hold the commercial crown jewels: prospective-buyer contact and consent records (SPEC-06, SPEC-07). For a one-owner business with no security team, a breach or a privacy incident would be existential, damaging credibility with Lindesnes kommune, partners and buyers far beyond any direct cost. This spec consolidates the per-feature security work into one written, testable threat model so hardening is deliberate and verified, not assumed.

## Scope

Implement the full threat model across the platform: a strict Content Security Policy with per-request nonces, HSTS and the supporting response headers (X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors), input validation and output encoding on every surface, CSRF protection on all state-changing requests, rate limiting and bot mitigation on public forms and authentication, dependency and secret scanning in CI, a least-privilege database user, TLS in transit and encryption at rest, no personal data in logs or error traces, secure session and cookie flags, automated security tests in CI, plus the written OWASP Top 10 review and the GDPR Article 32 statement.

## Dependencies

- SPEC-00 (engineering baseline, CI quality gate, EU hosting/DB, secret manager).
- SPEC-06 (consent engine: the CSRF, validation, anti-abuse and least-privilege patterns this spec verifies end to end).
- SPEC-07 (admin/auth: MFA, hardened sessions, RBAC, audit log, PII scrubbing).
- SPEC-08 (Plausible, cookieless: confirms no tracking cookies, so no cookie banner is in scope).

## Data

No client personal data is introduced or seeded here; only synthetic test data is used. The threat model reads the existing `leads`, `consent_records` and `audit_log` models (SPEC-06/07) to confirm least-privilege grants and PII-free logging. PLACEHOLDER: the production hosting region, DB grant matrix and secret inventory are config-driven and recorded in `docs/INPUTS-NEEDED.md`; EU/EEA storage and email only.

## Acceptance criteria

- [ ] Threat model documented and implemented across all surfaces.
- [ ] CSP is real (nonce-based, no `unsafe-inline`), enforced not report-only; headers verified against the deployed site.
- [ ] Dependency and SAST scanners are clean of high/critical findings.
- [ ] Secret scan is green in CI; no secrets in history.
- [ ] Auth and all forms pass abuse testing (rate limit, lockout, CSRF, bot mitigation).
- [ ] Least-privilege DB user, TLS in transit, encryption at rest confirmed; no personal data in logs.
- [ ] Secure session/cookie flags (HttpOnly, Secure, SameSite) verified.
- [ ] OWASP Top 10 review and GDPR Article 32 statement written and committed.

## Task checklist

- [ ] Author the threat model (assets, trust boundaries, STRIDE per surface) under `docs/security/`.
- [ ] Implement nonce-based CSP and the full response-header set in middleware; verify per route.
- [ ] Audit validation, output encoding and parameterised queries across every endpoint.
- [ ] Confirm CSRF on all mutations and secure session/cookie flags.
- [ ] Wire dependency, SAST and secret scanning into the CI gate; fail on high/critical.
- [ ] Provision the least-privilege DB role; confirm TLS and at-rest encryption.
- [ ] Add PII scrubbing to logs and error tracking; assert no personal data leaks.
- [ ] Add automated security and abuse tests (header checks, CSRF, rate-limit, auth lockout).
- [ ] Write the OWASP Top 10 review and the GDPR Article 32 statement; update PROGRESS.

## Guardrails

- Privacy: public buyer-value tools stay stateless and collect no personal data; any "email my results" routes only through the consented SPEC-06 flow. Personal data stays in the EU/EEA; no personal data in logs, audit entries or traces.
- Honesty: any indicative figure in surrounding copy stays labelled an _indikativt estimat_, sourced and disclaimed; security docs state real posture, not aspiration.
- Performance: the §8 budget holds (initial route JS at most about 120 KB gzip; LCP under 2.5 s, INP under 200 ms, CLS under 0.1; Lighthouse mobile at least 95); headers and CSP add no measurable regression.
- Accessibility: WCAG 2.2 AA preserved; any challenge (Turnstile) and error messaging stay keyboard operable and programmatically announced.

## Out of scope

- Penetration testing by an external party and any formal certification.
- The privacy policy text and DPO/legal review (SPEC-25, privacy documentation).
- Incident-response runbooks and on-call procedures beyond the written threat model.
- New product features or content; this spec hardens existing surfaces only.
