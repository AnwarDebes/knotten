# SPEC-06 completion note

## What was built

The interest registration and GDPR consent engine, the lead database (the crown jewel), built real and fully tested.

- **Data layer**: Drizzle ORM over PostgreSQL. The schema (leads, audit log, rate limit) runs on PGlite (in-process PostgreSQL) in development and tests, and on the client's hosted EU PostgreSQL in production via the same schema and migrations. Generated migrations are in `drizzle/`.
- **Minimised data**: only name and email are required; phone and interest are optional. The exact consent text, its version and timestamp are stored per lead, and the consent is reconstructed server-side from a single source of truth, never trusted from the client.
- **Double opt-in**: a pending lead gets an unguessable, single-use token and a plain-text confirmation email (no tracking pixels); the confirmation link sets the lead to confirmed, clears the token so it cannot be replayed, and notifies the developer. The email is unique, so a re-submission updates the existing record rather than duplicating it.
- **Withdrawal**: every confirmation email carries a one-click unsubscribe link backed by a stable per-lead token (no login). Withdrawing sets the lead to unsubscribed, stamps the time, and is audit-logged; a later re-registration reactivates the same record with fresh consent. Withdrawing is as easy as consenting (GDPR art. 7(3)).
- **Anti-abuse**: a honeypot (a filled hidden field returns a generic success and stores nothing), a same-origin (CSRF) check, single-line input validation that rejects newlines (no email-header injection), atomic database-backed rate limiting by hashed IP and by email, and an optional Cloudflare Turnstile challenge.
- **Privacy by design**: no raw IP is stored (only a salted hash, and the salt is required in production); identical generic responses avoid email enumeration; export and erasure paths exist (`listLeads`, `getLeadById`, `eraseLeadById`), used by the admin in SPEC-07.
- **Retention**: `purgeStalePending` hard-deletes un-actioned pending leads older than 30 days and logs a non-personal count; it runs from a secret-protected cron endpoint, to be wired to the host scheduler at go-live. The confirmed and actioned retention tails activate with the SPEC-07 actioned flag.
- **Form**: an accessible, design-system interest form on the Meld interesse page, with explicit unbundled consent, the "what happens next" block, and a confirmation banner after the double opt-in.

## Verification

- Local gate green: lint, type-check, format, tests, build, bundle budget. The form page stays within the content budget (native inputs).
- Unit and integration tests (against PGlite): validation including newline rejection, consent record, IP hashing, single-use confirmation, deduplication, already-confirmed handling, withdrawal and re-activation, retention purge, database-level unique email, erasure, and atomic rate limiting.
- End-to-end against the running server: a valid submission stores a pending lead and sends both the confirmation and unsubscribe links (200); the confirmation link confirms and redirects (303 to bekreftet=1) and a replay of the same token is rejected (bekreftet=0); the unsubscribe link withdraws (avmeldt=1) and is idempotent; a re-registration after withdrawal reactivates and re-sends confirmation; a header-injection attempt is rejected (400); the honeypot returns success without sending; a cross-origin request is blocked (403); and the retention cron rejects a missing or wrong secret (401) and runs with the right one (200).
- An adversarial security and GDPR review pass was run over the lead pipeline; the confirmed findings were fixed (single-use tokens, atomic rate limiting, header-injection guard, enumeration-safe responses, required production salt, unique email, withdrawal token and endpoint, and retention).

## Production note

The lead logic is complete and tested. Production needs the hosted EU PostgreSQL, an EU email provider and Turnstile keys (documented in HANDOVER.md and INPUTS-NEEDED.md, with a go-live checklist). Double opt-in and anti-abuse get one end-to-end verification against the real infrastructure during go-live review.
