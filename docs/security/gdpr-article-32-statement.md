# GDPR Article 32 statement: security of processing

Status: initial draft (Phase 1). Implementation has not started; this statement describes the measures the platform is designed to provide and is to be finalised under SPEC-23 (Security hardening and threat model). Mark for review by a lawyer or DPO before publication or production use.

Last updated: 2026-06-18. Author: Anwar Debes. Review owner: data controller (identity to be confirmed; see `docs/INPUTS-NEEDED.md`).

## 1. Purpose and scope

This statement records the technical and organisational measures (TOMs) for the Knotten platform under Article 32 of the GDPR (security of processing). It is the privacy-facing companion to the threat model maintained under `docs/security/` (assets, entry points, threats and mitigations, mapped to the OWASP Top 10). Where the threat model addresses adversarial risk in engineering terms, this statement maps the same measures to the Article 32 obligations.

Scope of processing covered:

- **Interest registration (lead capture):** name, email, optional phone number, plus the consent record (exact consent text, version, timestamp) and source. This is the platform's most sensitive asset and is treated as the crown jewel. Legal basis is consent, with double opt-in (SPEC-06).
- **Admin access:** authenticated staff who view and manage leads and edit content (SPEC-07, SPEC-09).
- **Analytics:** Plausible (EU, cookieless), which the provider states processes no personal data and sets nothing on the user's device (SPEC-08). See `docs/research/personvern-og-analyse.md`.
- **Buyer-value tools** (calculators and the 3D map): designed to be stateless and to collect no personal data. Any optional "email my results" routes only through the consented lead flow.

Article 32 requires measures appropriate to the risk, taking into account the state of the art, the costs of implementation, and the nature, scope, context and purposes of processing. The data set here is small and low in sensitivity (contact details for prospective buyers, no special categories), but a contact list of named individuals interested in property is attractive to spammers and is treated accordingly.

## 2. Implementation status legend

Each measure is marked as one of:

- **Designed:** specified and decided (ADR or spec), not yet built. This is the status of nearly everything below, because the platform is at Phase 1.
- **Planned:** intended, to be specified in detail later.
- **Implemented:** built, tested and verified in the codebase. Nothing carries this mark yet.

When a measure is built and verified, its status is updated here and a completion note is recorded against the relevant spec. Do not present a measure as in place until it is marked Implemented and the verifying evidence exists.

## 3. Pseudonymisation and encryption (Art. 32(1)(a))

| Measure                                           | Status   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TLS in transit for all traffic                    | Designed | HTTPS enforced; HSTS response header (SPEC-23, ADR 0001 Vercel).                                                                                                                                                                                                                                                                                                                                                       |
| Encryption at rest for the database               | Designed | Managed PostgreSQL in the EU provides at-rest encryption; confirm the chosen provider's encryption and key management before production (ADR 0003; provider parked in `docs/OPEN-QUESTIONS.md`).                                                                                                                                                                                                                       |
| Encryption at rest for backups                    | Planned  | Backups inherit provider encryption; verify under SPEC-26.                                                                                                                                                                                                                                                                                                                                                             |
| Minimisation as a substitute for pseudonymisation | Designed | The strongest control here is collecting almost nothing: name, email and an optional phone number. Buyer-value tools hold no personal data, so most of the platform has nothing to pseudonymise. Pseudonymisation of stored leads is not currently planned, because the data is needed in identifiable form to respond to an enquiry; this is a deliberate, documented choice to revisit if retention or volume grows. |
| Analytics without personal data                   | Designed | Plausible is cookieless and EU-hosted and, per the provider, processes no personal data and does not read the device; this removes a class of data rather than encrypting it. Re-verify the provider's claims and residency before go-live.                                                                                                                                                                            |

## 4. Confidentiality, integrity, availability and resilience (Art. 32(1)(b))

**Confidentiality**

| Measure                                                                                                                                                     | Status                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Least-privilege database user for the application (no superuser, scoped to required tables and operations)                                                  | Designed (SPEC-23)                              |
| Admin authentication with TOTP multi-factor, lockout and throttling                                                                                         | Designed (ADR 0008, SPEC-07)                    |
| Least-privilege admin roles; server-side authorisation on every protected action                                                                            | Designed (SPEC-23)                              |
| Hardened sessions: `HttpOnly`, `Secure`, `SameSite` cookies, short session lifetime, re-authentication for sensitive actions                                | Designed (SPEC-23)                              |
| No personal data in application logs; error tracking with PII scrubbing                                                                                     | Designed (SPEC-23, SPEC-26)                     |
| Secrets via environment and the platform secret manager, never in the repository, with documented rotation                                                  | Designed (ADR 0014)                             |
| All processing and storage in the EU/EEA, with a data processing agreement recorded for each processor (hosting, database, email, analytics, captcha, maps) | Designed; DPAs to be recorded before production |

**Integrity**

| Measure                                                                                                                                 | Status                       |
| --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Parameterised database access only (no string-built SQL); Drizzle ORM with migrations in the repository                                 | Designed (ADR 0003, SPEC-23) |
| Input validation (allowlist) and output encoding throughout                                                                             | Designed (SPEC-23)           |
| CSRF protection on all state-changing requests                                                                                          | Designed (SPEC-23)           |
| Strict Content Security Policy (nonces or hashes), `X-Content-Type-Options`, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy` | Designed (SPEC-23)           |
| Versioned, timestamped consent record stored per lead (exact text and version) for evidential integrity                                 | Designed (SPEC-06)           |
| Audit log for admin and data actions                                                                                                    | Designed (SPEC-23)           |

**Availability and resilience**

| Measure                                                                                                      | Status                                                                                                          |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Managed, EU-region hosting and database with provider-level redundancy                                       | Designed (ADR 0001, ADR 0003)                                                                                   |
| Database backups                                                                                             | Planned; provider-managed backups to be configured (SPEC-26)                                                    |
| Tested restore: a restore from backup is performed and verified, not assumed                                 | Planned; this is an acceptance criterion of SPEC-26 and is not satisfied until a restore has actually succeeded |
| Rate limiting and bot mitigation on public forms and authentication, to absorb abuse without loss of service | Designed (ADR 0013, SPEC-23)                                                                                    |
| Uptime monitoring and alerting on anomalies                                                                  | Planned (SPEC-26)                                                                                               |

Backups without a tested restore give false assurance. Until a restore has been executed and verified under SPEC-26, availability for the lead data should be regarded as unproven.

## 5. Regular testing, assessment and evaluation (Art. 32(1)(d))

| Measure                                                                                                                            | Status                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Threat model maintained under `docs/security/`, mapped to the OWASP Top 10, covering assets, entry points, threats and mitigations | Planned; authored and finalised in SPEC-23 (a stub exists; the full model is not yet written) |
| Automated dependency vulnerability scanning in CI, with no high or critical findings left open                                     | Designed (SPEC-23)                                                                            |
| Secret scanning in CI                                                                                                              | Designed (ADR 0014, SPEC-23)                                                                  |
| Security tests in CI (headers, CSP, auth and form abuse cases)                                                                     | Designed (SPEC-23, SPEC-24)                                                                   |
| Abuse testing of the public forms and the authentication flow (injection, XSS, CSRF, brute force, automated submission)            | Planned; an acceptance criterion of SPEC-23                                                   |
| Lockfile committed; reproducible builds                                                                                            | Designed (SPEC-00)                                                                            |
| Penetration testing by an external party                                                                                           | Not planned for v1; flag for the controller to decide on scope and budget before go-live      |

"Penetration" here means the structured abuse testing of forms and authentication defined in SPEC-23, not a formal third-party penetration test. Do not describe the platform as penetration-tested in the formal sense unless and until an external test is commissioned.

## 6. Process for handling incidents

A personal data breach process is required by Articles 33 and 34. The outline below is to be turned into a runbook under SPEC-26 and finalised with the data controller (who carries the notification duty).

- **Detect:** error tracking with PII scrubbing, uptime monitoring, audit logs and CI scan alerts feed an initial signal (Planned, SPEC-26).
- **Contain and assess:** on a suspected breach, restrict access (rotate secrets and credentials, revoke sessions), preserve logs, and assess the nature, categories and approximate number of data subjects and records affected.
- **Notify:** the data controller assesses notification to the supervisory authority (Datatilsynet) without undue delay and, where feasible, within 72 hours of becoming aware (Article 33), and notifies affected data subjects where the breach is likely to result in a high risk to their rights and freedoms (Article 34). Processor obligations to notify the controller without undue delay are to be reflected in each DPA.
- **Record:** every incident is logged with the facts, effects and remedial action, whether or not it is notifiable (Article 33(5)).
- **Review:** a short post-incident review updates the threat model and these measures.

Until the runbook exists and contacts are confirmed, treat the incident process as defined in principle only, not operational.

## 7. Honest summary of what is and is not in place

- **In place today:** nothing in code. The platform is at Phase 1 (architecture and specifications). The measures above are decisions and designs, not running controls.
- **Decided and specified:** the full set of TOMs in sections 3 to 5 (TLS, at-rest encryption, least-privilege database user, hardened sessions and MFA, parameterised access, security headers, CI dependency and secret scanning, rate limiting and bot mitigation, EU residency).
- **Specified but unproven until verified:** backups with a tested restore, the written threat model, form and authentication abuse testing, and the incident runbook. These are acceptance criteria of SPEC-23 and SPEC-26 and must not be claimed as satisfied before their verifying evidence exists.
- **Open dependencies:** the data-controller identity, the final database, email and captcha providers, and the signed DPAs for every processor. See `docs/INPUTS-NEEDED.md` and `docs/OPEN-QUESTIONS.md`.

## 8. Review

This is an initial draft and is not legal advice. It must be reviewed by a lawyer or data protection officer, and reconciled against the finished threat model (`docs/security/`), the records of processing (Article 30), the DPIA-lite for the lead-capture processing, and the signed data processing agreements, before the platform processes any real personal data. Re-verify the residency and personal-data claims of all third-party providers (in particular the analytics, email and database providers) at that point, since provider terms and the legal position can change.
