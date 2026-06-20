# SPEC-07 completion note

## What was built

An authenticated, MFA-gated admin area that turns the SPEC-06 consent records into a safe, auditable working surface for a non-technical owner, with GDPR access, export and erasure built in.

- **Authentication**: password (scrypt, per-user salt) plus mandatory TOTP MFA (RFC 6238, implemented on `node:crypto`, no native dependency). First login routes to enrolment; the secret is shown for an authenticator app and only activates once a code is verified. Repeated failures trigger a temporary lockout. Sessions are server-side, short-lived, and stored only as a SHA-256 hash; the cookie is HttpOnly, Secure and SameSite=strict.
- **RBAC**: two least-privilege roles. `owner` can view, export and erase; `viewer` can view and export. Authorisation is enforced server-side on every protected page, route handler and mutation, never only in the UI.
- **Lead management**: search by name or email, filter by pipeline status and source, sort, and paginate with a correct total. Lead detail shows the full consent record (exact text, version, timestamp, double opt-in state, confirmation and withdrawal). A separate sales-pipeline status (ny, kontaktet, kvalifisert, lukket) is set by the admin; moving a lead off "ny" stamps `actionedAt` once, which marks it actioned for retention.
- **CSV and DSAR export**: a full-list CSV with RFC 4180 escaping and spreadsheet formula-injection neutralised, and a per-subject JSON export (GDPR art. 15/20) of one lead's full record.
- **Erasure**: one-click, owner-only, confirmed by re-entering password and TOTP at the moment of deletion. It hard-deletes the lead and consent record (a true delete), verified by re-query, and is audited.
- **Audit log**: append-only, PII-free (action, actor email, lead id, non-personal counts). A read-only paginated viewer.
- **Aggregate panel**: degrades gracefully until cookieless analytics (SPEC-08) is connected, and is labelled as derived from aggregate, not per-person, data.
- **Hardening**: a strict Content-Security-Policy and `no-store`/`noindex` on every admin route, a baseline of security headers site-wide, Server Action CSRF protection, and the admin area excluded from the i18n routing and from indexing.

## Verification

- Local gate green: lint, type-check, format, tests, build, bundle budget.
- Unit and integration tests (against in-process PostgreSQL): password hashing, base32, a known RFC 6238 TOTP vector and drift tolerance, session resolve/revoke, login success and the generic-credentials path, account lockout, MFA enrolment then required-code login, re-auth, role checks, lead search/filter/pagination/count, status change with one-time `actionedAt` and audit, per-subject DSAR export, and CSV escaping with formula-injection defused.
- End-to-end in headless Chromium against the running server: secret-gated bootstrap (and its 401/400/409 paths), unauthenticated `/admin` redirected and `/admin/export` blocked (401), first login to enrolment, TOTP enrolment to the dashboard, a seeded lead listed, status update, owner erasure with re-auth, the audit log showing the status and erase actions with no lead email present, and logout.
- Security headers confirmed at runtime: the admin CSP, `Cache-Control: no-store` and `X-Robots-Tag: noindex` on admin routes, and the baseline headers on public routes.

## Production note

The owner account is provisioned once via the secret-gated `/admin/bootstrap` endpoint, then enrols MFA on first login; the steps are in `HANDOVER.md`. GDPR operations follow `docs/runbooks/dsar-and-erasure.md`. The aggregate interest panel lights up when SPEC-08 analytics is connected.
