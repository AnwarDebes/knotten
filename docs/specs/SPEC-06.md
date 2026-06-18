# SPEC-06: Interest registration and GDPR consent engine

## Purpose

A small groundwork contractor with no sales staff and no website cannot chase leads manually, and cannot afford a privacy mistake that would damage credibility with Lindesnes kommune, partners and buyers. Before salgsstart and regulering, the platform's whole job is honest interest capture. This spec turns the _Meld interesse_ call to action into a working, lawful pipeline: a short no-obligation form that a prospective buyer trusts, that proves consent if ever questioned, that resists spam without surveilling visitors, and that drops a clean lead into the owner's inbox. It is the commercial core of the site and the most privacy-sensitive surface, so it is built to GDPR standard from the first line.

## Scope

- A minimal interest form: navn, e-post, optional telefon, optional interest or plot reference (the plot reference is data-driven, see SPEC-04).
- A "what happens next" block beside the form (how contact works, expected response time, next milestone).
- Explicit, unbundled, opt-in consent: one separate checkbox, not pre-ticked, with clear purpose text and a link to the privacy policy.
- Double opt-in: the lead is provisional until the e-post link is confirmed.
- Server-side validation and sanitisation of every field (allowlist), with output encoding on the read side.
- Anti-abuse: honeypot field, a privacy-respecting challenge (Cloudflare Turnstile), per-IP and per-email rate limiting and throttling.
- Storage in EU PostgreSQL: lead fields, timestamps, the versioned consent record (exact text plus version plus time), and the source (page, locale, optional plot).
- Confirmation e-post to the registrant and notification e-post to the admin, both plain and free of tracking pixels.
- Programmatic export and erasure paths, exposed to the admin UI in SPEC-07.

## Dependencies

- SPEC-00 (engineering baseline, CI gates, EU database, email provider, secrets).
- SPEC-01 (form, button, input and feedback components from the design system).
- SPEC-02 (the _Meld interesse_ page and the privacy policy page the consent text links to).
- SPEC-04 (the data-driven plot identifiers used as the optional plot reference).
- SPEC-07 consumes this engine for lead management, DSAR export and erasure; SPEC-08 records the form-completion goal. Neither is required to ship SPEC-06.

## Data

- `leads`: id, navn, epost, telefon (nullable), interesse or plot reference (nullable), locale, source page, status (pending, confirmed, erased), created_at, confirmed_at (nullable).
- `consent_records`: id, lead id, exact consent text, policy version, lawful basis (consent), captured_at; immutable once written.
- Double opt-in tokens: single-use, hashed, time-limited; never the raw token at rest.
- Retention metadata for un-actioned leads (deletion window), enforced per the privacy plan.
- Placeholders, recorded in INPUTS-NEEDED: the data-controller identity (legal name, org. nr, contact) shown in the consent and policy copy, and the live plot identifiers. The privacy policy is marked _bør gjennomgås av jurist eller DPO_. No client personal data is seeded; only synthetic test data and test e-post addresses are used in development.

## Acceptance criteria

- [ ] Only navn, e-post, optional telefon and optional interest or plot are collected; nothing more.
- [ ] Consent is explicit, unbundled (its own non-pre-ticked checkbox), with purpose text and a policy link.
- [ ] The exact consent text, its version and the timestamp are stored per lead and are immutable.
- [ ] Double opt-in works: a lead stays pending until the e-post link confirms it, and unconfirmed leads expire.
- [ ] Inputs are validated and sanitised server-side; the engine is safe against SQL injection, XSS and CSRF.
- [ ] Honeypot, Turnstile, and per-IP plus per-email rate limiting and throttling are active and spam-resistant.
- [ ] All lead and consent data is stored in the EU; the database user holds least privilege.
- [ ] Confirmation and admin e-post send correctly and contain no tracking pixels.
- [ ] Programmatic export and erasure paths exist and a test erasure verifiably removes the lead and its consent record.
- [ ] WCAG 2.2 AA met; the performance budget holds.

## Task checklist

1. Define the `leads` and `consent_records` schema and a migration; add the least-privilege DB role.
2. Build the form UI from SPEC-01 components, with the "what happens next" block and the unbundled consent checkbox.
3. Implement the route handler: allowlist validation, sanitisation, CSRF protection, honeypot and Turnstile checks, rate limiting and throttling.
4. Persist the lead plus an immutable consent record (exact text, version, timestamp, source).
5. Implement double opt-in: issue a hashed single-use time-limited token, send confirmation e-post, confirm on callback, expire the unconfirmed.
6. Send the admin notification e-post (plain, no pixels) on confirmation.
7. Expose export and erasure functions plus the retention sweep for un-actioned leads.
8. Tests: unit (validation, consent versioning), integration (full submit, double opt-in, abuse paths), and the erasure proof.
9. Update PROGRESS.md, INPUTS-NEEDED, the processing record and the DONE note.

## Guardrails

- Privacy by design: only the four field types above; no tracking pixels in any e-post; EU or EEA storage and email only; consent is the lawful basis, logged with exact text, version and timestamp; retention and erasure are real, not cosmetic. This engine holds personal data and is the sole sanctioned path for any optional "email my results" from the stateless buyer-value tools, which themselves collect no personal data.
- Honesty: response times, next milestones and any indicative figures in surrounding copy are labelled, sourced and disclaimed as estimates; nothing is presented as a promise or an offer.
- Performance: within the budget (initial route JS at most about 120 KB gzip, LCP under 2.5 s, INP under 200 ms, CLS under 0.1); the Turnstile script loads without blocking LCP.
- Accessibility: WCAG 2.2 AA, with labelled fields, keyboard operability, visible focus, programmatic error messaging and a challenge that offers an accessible path.

## Out of scope

- The admin dashboard, lead search and the DSAR or erasure UI (SPEC-07).
- Analytics goal wiring and interest measurement (SPEC-08).
- Newsletter or milestone nurture e-post to consented leads (SPEC-19).
- CRM or megler handover and any later transactional sales flow.
- The privacy policy text itself and the legal or DPO review (SPEC-25 and the privacy documentation).
