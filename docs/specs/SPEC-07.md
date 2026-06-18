# SPEC-07: Admin dashboard and lead management

## Purpose
Sigve Simonsen AS is a small contractor selling an energy-smart coastal development at Roedberg, Sniksfjorden (Lindesnes, Agder). Every interest registration is a scarce, high-value lead, and the lead database is the platform's crown jewel. A non-technical owner needs to see who has registered, act on each lead, and meet GDPR obligations (access, export, erasure) without a developer and without risk of a data leak. This spec turns the raw consent records from SPEC-06 into a safe, auditable working surface.

## Scope
An authenticated, MFA-gated admin area to: list, search and filter registrations; view each lead's full consent record (exact text, version, timestamp, source, double opt-in state); set a lead status (ny, kontaktet, kvalifisert, lukket); export all leads to CSV; perform one-click GDPR erasure and per-subject export (DSAR); read an append-only audit log of admin and data actions; and view aggregate interest over time (sourced from SPEC-08). RBAC with least privilege, hardened sessions, re-auth for destructive actions, no personal data in logs.

## Dependencies
- SPEC-00 (engineering baseline, CI gates, EU hosting/DB).
- SPEC-06 (interest registration and consent engine: the lead and consent data model this reads).
- SPEC-08 (analytics) for the aggregate interest-over-time panel; the dashboard degrades gracefully if absent.

## Data
Reads the SPEC-06 schema: lead (id, navn, e-post, optional telefon, source, created_at, status), consent record (exact text, policy version, timestamp, double opt-in confirmed_at). Adds: admin user (id, role, TOTP secret, last_login), and an append-only audit_log (actor_id, action, target_lead_id, timestamp; no payload of personal data). Aggregate counts come from SPEC-08, not from PII. Placeholder: the data controller identity (legal name, org. number, contact) is UNKNOWN and is read from config for DSAR/erasure correspondence; see INPUTS-NEEDED.

## Acceptance criteria
- [ ] Only authenticated users with verified TOTP MFA reach any admin route; unauthenticated and unverified requests are rejected server-side.
- [ ] RBAC enforced server-side on every action; least-privilege roles tested.
- [ ] List supports search and filter by status, source and date; pagination is performant.
- [ ] CSV export produces correct, escaped output; per-subject DSAR export returns one lead's full record.
- [ ] One-click erasure verifiably deletes the lead and consent record (confirmed by re-query); the action is irreversible and confirmed via re-auth.
- [ ] Every destructive or data action is written to the audit log; logs contain no personal data.
- [ ] Auth is brute-force resistant: lockout/throttle on failed logins; sessions are short, HttpOnly, Secure, SameSite.
- [ ] Quality gate green: WCAG 2.2 AA, Lighthouse, bundle budget, security checks.

## Task checklist
- [ ] Admin auth: password + TOTP MFA enrolment/verification, lockout and throttle, short hardened sessions, re-auth gate for destructive actions.
- [ ] RBAC layer with server-side authorization on every protected route and mutation.
- [ ] Lead list view: search, filter, sort, pagination; empty, loading and error states.
- [ ] Lead detail: full consent record, status control, DSAR export button.
- [ ] CSV export (all leads) with strict escaping; per-subject JSON/CSV export.
- [ ] One-click erasure with confirm + re-auth; verify deletion by re-query.
- [ ] Append-only audit log with PII-free entries; read-only viewer.
- [ ] Aggregate interest-over-time panel wired to SPEC-08 with graceful fallback.
- [ ] CSP, security headers, CSRF on all mutations; PII scrubbing in error tracking.
- [ ] Access-control and brute-force tests; runbook for DSAR and erasure.

## Guardrails
- Privacy: personal data lives in the EU/EEA only; no personal data in application logs, audit log or error traces (PII scrubbing on). Retention and documented automatic deletion of un-actioned leads apply. The admin surface handles PII; the public buyer-value tools remain stateless and collect no personal data, and any "email my results" routes only through the consented SPEC-06 flow.
- Honesty: the aggregate interest panel is labelled as derived from cookieless aggregate analytics, not per-person tracking. Any figure shown anywhere in admin copy is labelled, sourced and disclaimed as indicative.
- Security: OWASP Top 10 and GDPR Art. 32 baseline; least privilege; parameterized data access; secrets via secret manager.
- Performance: within the §8 budget (initial route JS at most ~120 KB gzip, LCP < 2.5 s, INP < 200 ms, CLS < 0.1), measured on a mid-range mobile device.
- Accessibility: WCAG 2.2 AA: full keyboard operability, visible focus, sufficient contrast, correct labels, reduced-motion respected.

## Out of scope
Content editing of plots, prices, timeline, FAQ, news and images (SPEC-09); analytics collection itself (SPEC-08); the public registration form and consent capture (SPEC-06); email delivery infrastructure; CRM integrations or automated outbound marketing.
