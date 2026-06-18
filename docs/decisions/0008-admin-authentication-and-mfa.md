# ADR-0008: Admin authentication with TOTP multi-factor

## Status

Accepted, 2026-06-18.

## Context

The public site (the Roedberg project at Sniksfjorden, Lindesnes kommune, Agder) serves anonymous visitors only. No public-facing accounts exist, and none are planned: prospective buyers read content, browse data-driven figures, and submit interest through a lead form without registering. This keeps the public surface free of credential storage, password reset flows, and the attendant phishing and account-takeover risk.

Behind the public site there is an admin and content area reached only by the owner and a small set of trusted operators. This area edits site content and, more sensitively, reads and exports the lead database: contact details and expressions of interest from real people. That database is the asset most worth protecting. Two threats dominate the model:

- Brute force and credential stuffing against the admin login, including reuse of passwords leaked elsewhere.
- Session theft (stolen cookies, an unlocked machine, a shared link) granting an attacker the same access as a logged-in operator.

The user base is tiny and stable, and it will stay that way. There is no growth pressure that would justify self-service signup, social login, or organisation management. The constraint that shapes everything below is data residency: lead data is personal data under GDPR, and the project commits to keeping email and database in the EU/EEA only, with Plausible (EU, cookieless) for analytics. Any authentication design must respect that boundary and avoid quietly widening the set of parties that process personal data.

## Decision

Protect the admin and content area with the following controls. The public site keeps no accounts.

1. **Strong password authentication plus TOTP multi-factor.** Every admin login requires a password and a time-based one-time code (RFC 6238 TOTP) from an authenticator app. Passwords are checked for length and against known-breached lists, and stored only as a salted, memory-hard hash (Argon2id). TOTP secrets are generated and verified through a vetted, maintained library rather than hand-rolled, with secrets encrypted at rest and a small set of single-use recovery codes issued at enrolment.

2. **Server-side authorisation on every protected action.** Authentication establishes who the caller is; authorisation is checked independently on the server for each protected request, including every read and export of lead data. The client never decides access. There are no unauthenticated mutation endpoints and no "hidden" URLs treated as a security boundary.

3. **Account lockout and throttling.** Login attempts are rate-limited per account and per source, with exponential backoff and temporary lockout after repeated failures. TOTP verification is rate-limited separately to blunt code-guessing. Throttling state and lockout counters live server-side so they cannot be reset by the client.

4. **Short, hardened sessions.** Sessions are short-lived with idle and absolute timeouts. Cookies are HttpOnly, Secure, and SameSite, scoped to the admin host, with server-side session records that can be revoked individually or in bulk. Session identifiers are rotated on login and on privilege change to limit fixation and replay.

5. **Re-authentication for sensitive actions.** Exporting the lead database, changing roles, managing other operators' access, and rotating MFA require a fresh credential check (step-up), even within an active session. A stolen idle session is therefore not enough to exfiltrate the lead database.

6. **Sessions stored in the EU database.** Session and throttling state are persisted in the project's EU-resident database alongside the rest of the data, so no session data leaves the EEA and revocation is authoritative.

7. **Least-privilege roles.** Operators receive the narrowest role that lets them do their work; full lead-export and operator-management rights are held by the owner role only. Roles are explicit and enforced server-side (see point 2).

8. **Audit logging.** Authentication events (login success and failure, lockouts, MFA enrolment and reset, step-up challenges) and sensitive actions (lead reads in bulk, exports, role changes) are written to an append-only audit log with actor, action, timestamp, and source. The log itself is treated as personal-data-adjacent and retained under the same EEA and retention rules as the lead data.

## Alternatives considered

**Managed auth provider (Clerk, Auth0).** These deliver MFA, lockout, and session management out of the box and would reduce the code to maintain. The decisive objection is data processing: adopting a hosted identity provider adds a personal-data processor (operator identities, login metadata, often session storage) for a user base of a handful of people. That means another data processing agreement, another sub-processor chain to keep inside the EEA, and another vendor dependency and cost, all to manage perhaps a few accounts. The benefit scales with user count and complexity; here both are near zero, so the overhead is not justified. Rejected.

**Magic links only (passwordless email).** Simple and avoids password storage, but it makes the email channel the single factor. For an admin area guarding a lead database that is too weak: anyone with access to an operator's inbox, or able to intercept a link, gains entry, and there is no second factor to stop them. It also couples admin access to email deliverability. Acceptable as a convenience layer, not as the protection for this asset. Rejected as the primary mechanism.

**Single sign-on (SSO via an external IdP).** Sensible when operators already live in a corporate directory (Google Workspace, Entra, Okta) that enforces MFA centrally. There is no such directory here, and standing one up for two or three people reintroduces the managed-provider trade-off above (an external processor, federation configuration, vendor lock-in) without a real administrative win. Rejected for the current scale; revisit only if operators are ever consolidated under an existing EEA-resident directory.

## Consequences

**Positive.**

- The lead database is defended in depth: a leaked password alone does not grant access (TOTP), a guessing attack is throttled and locked out, and a stolen idle session cannot export data without step-up re-authentication.
- All authentication and session data stays in the EU database. No new personal-data processor is added, so the GDPR footprint and the sub-processor list stay minimal, which is the main reason for keeping auth self-hosted at this scale.
- Server-side authorisation and least-privilege roles mean access can be reasoned about and revoked centrally; audit logging gives an after-the-fact record for incident review and accountability.
- The public site carries no credential surface at all, removing a large class of risk.

**Negative and accepted.**

- Self-hosting auth is code that must be maintained, kept patched, and reviewed: the password hashing, TOTP, throttling, and session logic are now project responsibilities rather than a vendor's. This is accepted in exchange for data-residency control and is bounded by leaning on vetted libraries rather than bespoke cryptography.
- TOTP adds friction and a recovery burden: operators must enrol an authenticator app, and lost devices require the recovery-code path and an owner-assisted reset. Recovery codes must be stored and handled carefully, since they are a bypass of the second factor.
- Short sessions and step-up re-authentication mean operators re-authenticate more often, especially around exports. This is a deliberate trade of convenience for containment of session theft.
- The audit log and session store hold personal-data-adjacent records and must be covered by the same retention, access, and EEA-residency rules as the lead data; they are not a place to relax governance.

**Operational notes.**

- TOTP enrolment is required at first admin login; recovery codes are shown once and must be stored securely by the operator.
- Owner-level actions (operator management, bulk export, role changes) always trigger step-up and are always audited.
- Throttling and lockout thresholds, and session idle/absolute timeouts, are configuration values to be tuned against observed legitimate usage, not constants to be hard-coded and forgotten.
