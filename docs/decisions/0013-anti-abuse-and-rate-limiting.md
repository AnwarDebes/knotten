# ADR-0013: Anti-abuse for public forms

## Status

Accepted, 2026-06-18

## Context

The public site exposes several unauthenticated entry points: the lead capture form, newsletter sign-up, contact form, and the authentication endpoints (sign-in, password reset). These are the surfaces an adversary reaches first. Automated scanners and spam tooling probe public forms continuously, and the lead pipeline is the part of the system most exposed to that traffic. Submissions flow into a database and trigger downstream email; unfiltered abuse pollutes the lead data, wastes the email allowance, and gives credential-stuffing and enumeration attempts a foothold against the auth endpoints.

Two constraints shape the response.

First, privacy. Analytics already run on Plausible (EU, cookieless) specifically to avoid third-party tracking and the cookie banner that comes with it. Email and database are kept in the EU/EEA. Any anti-abuse control must hold that line: it cannot reintroduce a cross-site tracker through the back door of a form widget.

Second, infrastructure surface. The deployment is serverless. Each external dependency added for anti-abuse is another data processor to assess, another vendor in the data-processing agreement chain, another point of failure, and another billing relationship. The bar for adding one is high.

The goal is to resist spam and abuse on these surfaces while preserving the privacy posture and without expanding the processor footprint beyond what is justified.

## Decision

Public forms and authentication endpoints are protected by a layered set of controls. No single layer is trusted on its own; each is cheap to add and removes a distinct class of abuse.

1. Honeypot field. Each form carries a hidden field that a human never fills. Naive bots that submit every field populate it; those submissions are dropped server-side. This catches a large share of low-effort spam at zero cost to legitimate users and with no third-party dependency.

2. Privacy-respecting challenge. A challenge widget gates the higher-value forms (lead capture, auth). Cloudflare Turnstile is the default candidate: it issues a token the server verifies, without the behavioural tracking and advertising-identity coupling of the Google alternative. The challenge is the layer that handles bots sophisticated enough to defeat the honeypot.

3. Server-side input validation and sanitisation. Every submitted field is validated against an explicit schema (type, length, format) and sanitised on the server before it touches the database or any email template. Client-side checks are treated as a usability feature only, never as a control. This is the layer that contains injection and malformed-payload attempts regardless of how the request arrived.

4. Rate limiting and throttling, database-backed. Per-IP and per-email counters are persisted in the existing database and enforced on the server. This caps submission and authentication-attempt volume, slowing brute-force, enumeration, and bulk-spam attempts. The counters live in the database deliberately: it works on serverless without a long-lived in-memory store, and it avoids introducing a separate datastore as another processor.

5. CSRF protection on all state-changing requests. Every request that mutates state (form submission, auth) requires a valid anti-CSRF token, so a third-party origin cannot drive these endpoints on a victim's behalf.

## Alternatives considered

reCAPTCHA (Google). Mature and effective, and it would cover the same challenge role as Turnstile. Rejected as the default because it embeds Google trackers and ties the form into an advertising-identity graph. That directly contradicts the cookieless, no-tracker posture established for analytics and would reopen the cookie-banner and consent questions deliberately avoided elsewhere. It remains a fallback only if Turnstile proves unworkable, and it would require revisiting the privacy assessment.

Upstash Redis for rate limiting. A clean, serverless-friendly way to hold rate-limit counters, and it removes load from the primary database. Rejected because it adds another processor and another vendor relationship for a job the existing database can do. The volume on these forms does not justify a dedicated store, and the marginal database load from counter rows and reads is acceptable. If contention or write volume later becomes a measured problem, a dedicated store can be reconsidered as a targeted fix rather than a default.

No protection. Lowest effort and zero added surface. Rejected outright: the lead pipeline cannot absorb open spam and the auth endpoints cannot be left undefended against enumeration and brute-force. The cost of cleanup, wasted email allowance, and degraded lead data outweighs any saving.

## Consequences

Positive.

- Turnstile is privacy-respecting and keeps the no-tracker, cookieless posture intact, so no cookie banner or fresh consent flow is needed for the challenge.
- Database-backed counters work on serverless without an in-memory store and without adding a processor, keeping the vendor and data-processing-agreement surface unchanged.
- Layering means defeating one control (for example, scripting past the honeypot) still leaves the challenge, validation, throttling, and CSRF in place; abuse must beat the whole stack, not one check.
- Server-side validation and sanitisation protect the database and email templates regardless of the request path, including direct API calls that bypass the rendered form entirely.
- CSRF protection on all state-changing requests closes cross-origin abuse of the forms and auth endpoints.

Negative and accepted trade-offs.

- Turnstile is a Cloudflare dependency. Even though it is privacy-respecting, it is an external processor and a runtime dependency: if its service is unavailable, gated forms fail closed unless a fallback path is defined. The privacy assessment for Turnstile must be completed before launch, and the default-candidate status means it is not yet final.
- Database-backed counters add write and read load to the primary database on every gated request and on every auth attempt. At current expected volume this is acceptable; under a sustained flood the counter writes themselves become load, and aggressive attempts can contend with legitimate traffic. This is the trade made to avoid a second datastore, and it sets a measurable threshold for revisiting Upstash.
- The honeypot is brittle on its own. It only stops bots that fill every field, and accessibility tooling or aggressive autofill can occasionally trip it for real users. It is treated strictly as a cheap first filter behind the stronger layers, never as a primary control.
- Per-IP throttling is imprecise: shared NAT and corporate egress can put many legitimate users behind one address, and adversaries can rotate addresses. Pairing per-IP with per-email throttling mitigates but does not eliminate this, and limits must be tuned to avoid locking out genuine users.
- The combined stack adds friction and engineering surface: a challenge widget to render and verify, schemas to maintain, counter logic and CSRF tokens to keep correct across every form and auth route. This is ongoing maintenance, not a one-time cost.
