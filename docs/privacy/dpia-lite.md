# DPIA-lite: interesseregistrering (Knotten, Sjøutsikt i Rødberg)

Status: draft for review. This is a lightweight, screening-level data protection impact assessment (DPIA-lite) for the interest-registration ("Meld interesse") processing on the Knotten platform. Its purpose is to decide whether the processing is likely to result in a high risk to data subjects and therefore whether a full DPIA under GDPR Article 35 is mandated, and to record the data-protection design so it can be built and audited against. It must be reviewed by a DPO or qualified privacy counsel before go-live, and is marked accordingly throughout.

**Honesty about status (read first).** As of the date below, the platform is at the architecture-and-specification stage (Phase 1). The lead-capture engine (SPEC-06), admin and lead management (SPEC-07), analytics (SPEC-08), security hardening (SPEC-23) and the supporting privacy artefacts (records of processing, retention policy, consent design, DSAR process) are specified but not yet implemented or verified. This document therefore describes the intended (by-design) processing and the controls that the specifications commit to. Every control below is marked **[planned]** unless a verifiable implementation exists. No control should be read as "in place" until the corresponding spec is built, tested, and its evidence recorded. This DPIA-lite must be re-checked against the as-built system before go-live: claims that are aspirational today must be re-stated as facts only once verified.

- Behandlingsansvarlig (data controller): Sigve Simonsen AS. **[review]** Legal name, organisation number and a named contact point are not yet confirmed; see `docs/INPUTS-NEEDED.md`, item 7. The controller identity must be fixed before go-live, because it determines who is accountable, who signs the data processing agreements, and who is named in the privacy policy and any breach notification.
- Processor / data-processing role during the build: the developer (Anwar Debes) builds and operates the pre-launch environment. The build, account ownership and handover model (`docs/OPEN-QUESTIONS.md`, item 4) must be reflected in a controller-processor arrangement until the production services and accounts transfer to Sigve Simonsen AS. **[review]**
- Processing assessed: interest registration ("Meld interesse") on the public platform.
- Date: June 2026. Scope version: pre-salgsstart, pre-regulering.
- Out of scope: the buyer-value tools (savings, price-resilience, monthly cost, sun, community dashboard, neighbourhood map, outage resilience, configurator, fremdrift and FAQ, shareable plot pages, aktuelt, partner area, CO2). These are designed to be stateless and to collect no personal data; see section 7, which also notes the limits of that claim (the neighbourhood map and the captcha challenge involve third-party requests that may process technical data).

## 1. Description of the processing and its purpose

The platform is a pre-sales interest-capture and credibility site for a coastal residential development in Rødberg, Sniksfjorden, Lindesnes kommune, by the outlet of the Audna river. Because the project is pre-salgsstart and pre-regulering, the site's job is credible interest capture, not transactional sales.

A prospective buyer who wants to be contacted submits a short, no-obligation form ("uforpliktende"). The processing covers:

- collecting the contact details a person voluntarily enters,
- confirming the person's intent through a double opt-in email,
- storing the confirmed registration in a managed PostgreSQL database in the EU/EEA,
- notifying the developer (or, later, a real-estate agent; see section 8) so a follow-up contact can be made,
- managing the registration in an authenticated admin area (search, status, export, erasure),
- retaining backups of the database as part of normal operations,
- deleting registrations on request and after a defined retention period.

Purpose: to let a prospective buyer ask to be contacted about the development, and to let the developer measure and respond to genuine interest during the pre-sales phase. The purpose is specific and limited; the data is not used for advertising profiling, scoring, automated decision-making, or any secondary purpose.

Categories of data subject: prospective buyers and other interested members of the public who choose to submit the form. The form is not aimed at children and no age verification is performed; the processing assumes adult data subjects (see section 4, residual risk on age). **[review]**

## 2. Necessity and proportionality

Necessity: contacting a prospective buyer requires a way to reach them. A name plus one contact channel is the minimum needed to fulfil a request to be contacted. The processing is therefore necessary for the stated purpose, and the purpose itself is legitimate (responding to a person's own request).

Data minimisation (GDPR Article 5(1)(c)): the form collects at most three fields of personal data.

| Field | Status | Why it is collected |
| --- | --- | --- |
| navn | required | to address the person and recognise them on follow-up |
| e-post | required | the double opt-in channel and the primary contact method |
| telefon | optional | an alternative contact channel, only if the person chooses to give it |

Optional, non-personal qualifiers may also be captured (for example an interest in a specific plot, including a plot pre-filled from a shareable per-plot page, SPEC-18) to make the follow-up useful. A free-text field, if any, is a known minimisation risk: free text can attract unsolicited special-category data (Article 9) or third-party data, so the form should avoid free text or, if a short message field is included, warn against entering sensitive or third-party information and treat its contents under the same controls. **[review]** No special-category data is collected by design, and none is requested. The form does not ask for an address, date of birth, financial details, or any field beyond what a callback needs. Deeper qualification is deferred to the human follow-up call, which keeps the stored data minimal.

Alongside each registration the system stores the metadata needed to evidence valid consent and lawful handling: the exact consent text, its version, the timestamp, and the source. To support double opt-in and anti-abuse it will also, for a bounded period, process technical data such as the submitting IP address and the confirmation-token state. IP address is personal data; it is processed for security and abuse prevention and for evidencing the confirmation event, kept only as long as needed for those purposes, and then removed or reduced. This must be reflected in the records of processing and the retention policy. **[planned] [review]**

Lawful basis: consent (GDPR Article 6(1)(a)) for the interest registration and the follow-up contact. The person actively asks to be contacted; consent is the honest and appropriate basis. The narrow processing of IP and token data for security and abuse prevention may additionally rest on legitimate interests (Article 6(1)(f)) as a security measure; this is the controller's, not the data subject's, and should be recorded as such. **[review]** Consent is designed to be:

- explicit and opt-in, with no pre-ticked boxes,
- unbundled (a separate, specific action, not folded into other terms),
- informed, with a clear statement of purpose and a link to the privacy policy at the point of collection,
- recorded with exact text, version and timestamp per registration,
- confirmed by double opt-in, so an address cannot be entered by a third party and stored as a live lead,
- withdrawable at any time, as easily as it was given, through the erasure and request process (and, ideally, a one-click withdrawal/unsubscribe link in any email sent).

Transparency (Articles 13 and 14): a privacy policy (NO/EN), marked for legal review, must be live at the point of collection and state the controller identity, purposes, lawful basis, recipients (including processors), EU/EEA residency, retention periods, and the data subject's rights including the right to lodge a complaint with Datatilsynet. **[planned] [review]**

Proportionality: the data collected, the single purpose, the EU/EEA residency, and the short retention are proportionate to a no-obligation interest registration. There is no large-scale monitoring, no profiling, and no high-risk processing of the kind that triggers a mandatory DPIA under Article 35(3).

## 3. Data flow

1. Form. The person opens "Meld interesse", reads the "what happens next" block, enters navn, e-post and optional telefon, and gives explicit unbundled consent. The form is served and submitted over TLS. **[planned]**
2. Anti-abuse and validation. The submission passes a honeypot, a privacy-respecting challenge (Turnstile or hCaptcha), and per-IP and per-email rate limiting. The server performs allowlist validation and sanitisation, and CSRF protection covers the state-changing request. The captcha challenge is a third-party request from the visitor's browser and is addressed in sections 4 and 5 (transfers and unauthorised access) and section 7. **[planned]**
3. Double opt-in. A confirmation email (no tracking pixels) is sent to the address. The registration becomes an active lead only when the person clicks the confirmation link. Confirmation tokens are single-use, time-limited, and unguessable. Unconfirmed entries are not treated as leads and are pruned on a defined schedule. **[planned]**
4. EU storage. The confirmed registration is written to a managed PostgreSQL database in an EU region, using parameterised queries only and a least-privilege database user, with encryption at rest and TLS in transit. Stored alongside it: the consent text, version, timestamp and source. No personal data is written to application logs. **[planned]**
5. Admin notification. The developer (or later the megler) receives a notification email (no tracking pixels) through an EU/EEA-resident email provider so the follow-up call can be made. The notification email is itself a copy of personal data leaving the database boundary into a mailbox; the mailbox and its provider are in scope for residency, access control and retention, and the notification should carry the minimum needed. **[planned] [review]**
6. Admin area. The admin area is reachable only behind strong authentication with TOTP multi-factor, lockout and least-privilege roles, and all admin and data actions are audit-logged. **[planned]**
7. Backups. The managed database is backed up as part of normal operations. Backups contain personal data, are encrypted, reside in the EU/EEA, have their own retention, and are covered by the same processor DPA. Erasure of a live record does not by itself erase it from existing backups; the approach is that backups expire on their own schedule and are not restored selectively to revive erased records, and the runbook documents how an erasure request interacts with backups. **[planned] [review]**
8. Retention and erasure. Each registration has a defined retention period for un-actioned leads, with automatic or documented deletion at the end of it. A person can ask for access, export, rectification or erasure at any time; one-click GDPR erasure and per-subject export are specified for the admin area, and erasure is intended to genuinely remove the data from the live store (verifiable), with the backup interaction handled per item 7. A documented request (DSAR) process backs this, with an identity check proportionate to the risk and a response within the statutory one-month period. **[planned] [review]**

Processors. Each processor must be bound by a data processing agreement (Article 28) before any personal data reaches it: hosting (Vercel), the managed database, the email provider, the captcha provider, error tracking/observability, and the neighbourhood-map tiles. Analytics (Plausible) is treated as processing no personal data (section 5), which is the basis for omitting a consent banner; a DPA is nonetheless recorded as a precaution. **[review]** Each processor's sub-processors and the location of any support/administrative access must be checked, not just the primary hosting region: an EU storage region does not by itself prevent access from, or sub-processing in, a third country (section 4, transfers). All personal data is intended to stay in the EU/EEA. The current list of processors with confirmed EU/EEA residency, executed DPAs, and sub-processor positions does not yet exist and must be compiled in the records of processing (Article 30). **[planned] [review]**

## 4. Assessment of risks to data subjects

Likelihood and severity are rated low, medium or high, before the mitigations in section 5 are credited (inherent risk). The data is ordinary contact data of adults who chose to submit it, not special-category data, and the volumes in a pre-sales phase are modest, which bounds inherent severity. The risk set has been widened beyond the original four to cover the threats that this specific architecture (public form, double opt-in by email, managed processors, an admin area, backups, and data-subject rights duties) actually carries.

| Risk | What could happen | Inherent likelihood | Inherent severity |
| --- | --- | --- | --- |
| Unauthorised access or data breach (database) | An attacker reaches the lead database and reads or exfiltrates contact details (the platform's most sensitive asset) | Medium | Medium |
| Admin account compromise | An admin credential is phished, reused, or its session stolen, giving an attacker full read, export and erasure over all leads | Medium | High |
| Public form abuse and injection | The public form is used for injection (SQL/XSS), CSRF, or mass automated submission | Medium | Medium |
| Double opt-in misuse: email bombing / enumeration | The confirmation flow is abused to send unsolicited confirmation emails to third parties, or to probe which addresses are already registered | Medium | Low to medium |
| Excessive retention | Contact details (and backups) are kept longer than needed, growing the data held and the exposure if a breach occurs | Medium | Low to medium |
| Profiling or function creep | The data is combined, enriched or used for behavioural profiling, scoring, or a purpose beyond the callback the person asked for | Low | Medium |
| Transfers or third-country access | Personal data is moved to, or made accessible from, a third country without an adequate basis, including via a processor's US parent, support access, or a sub-processor | Low to medium | Medium |
| Supply-chain / dependency compromise | A compromised npm dependency, build step, or third-party script (captcha, map tiles) exfiltrates form data client-side or server-side | Low to medium | Medium to high |
| Logging / observability leakage | Personal data leaks into application logs, error reports, analytics, or email metadata despite the no-PII-in-logs intent | Medium | Low to medium |
| Data-subject rights failure | An access, erasure, rectification or withdrawal request is missed, mishandled, or not honoured in backups, or identity is not verified, leading to non-compliance or disclosure to the wrong person | Medium | Medium |
| Breach detection and notification failure | A breach is not detected, or not assessed and notified to Datatilsynet within 72 hours and to data subjects where required | Medium | Medium |
| Inaccurate or misdirected contact | A typo or a third-party-entered address leads to contacting the wrong person, or follow-up contact that the person no longer wants | Low to medium | Low |

## 5. Measures that reduce each risk

All measures are **[planned]** unless explicitly verified; none should be reported as in place until the corresponding spec (SPEC-06, 07, 08, 22, 23, 24, 26) is built and its evidence recorded against the QA gate.

### Unauthorised access or data breach (database)
- The lead database is treated as the crown jewel; the public forms are treated as a hostile entry point.
- Allowlist validation and output encoding throughout; parameterised database access only; a least-privilege database user (no DDL or superuser rights from the application); CSRF on state-changing requests.
- TLS in transit and encryption at rest (relying on the managed provider's at-rest encryption; verify it is enabled and documented for the chosen provider, and that key management is the provider's responsibility under the DPA).
- Strict Content Security Policy (nonces/hashes), HSTS, `X-Content-Type-Options`, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`; security headers verified after deployment.
- Secrets via the platform secret manager with documented rotation; dependency and secret scanning in CI, with nothing high or critical left open at release.

Residual after [planned] controls, assuming verified: low to medium. The honest position is that a managed-Postgres lead store remains a real target; residual cannot be driven below low while it holds live contact data.

### Admin account compromise
- Admin access behind strong authentication with TOTP multi-factor, account lockout and throttling on failed attempts, least-privilege roles, and server-side authorisation re-checked on every protected action (not only at login).
- Secure session handling: HttpOnly/Secure/SameSite cookies, short sessions, and re-authentication for sensitive actions (export, bulk erasure).
- Audit logging of every admin and data action (who, what, when), retained and tamper-evident as far as the platform allows; alerting on anomalous patterns (many exports, mass erasure, logins from new locations). **[review]** the alerting design and who receives alerts must be defined for a non-technical owner.
- Public site has no user accounts, so the only privileged surface is the small admin area.

Residual: low to medium. Compromise of the single privileged account is high-severity by definition; MFA and least privilege reduce likelihood but the owner's operational security (device, email account used for recovery) is the limiting factor and should be covered in the handover runbook.

### Public form abuse and injection
- Allowlist validation and output encoding; parameterised queries; CSRF tokens on the state-changing request; size and content limits on every field.
- Honeypot, a privacy-respecting challenge (Turnstile/hCaptcha), and per-IP and per-email rate limiting and throttling.
- Abuse testing of the form and auth before go-live (part of SPEC-23/24).

Residual: low.

### Double opt-in misuse (email bombing and enumeration)
- Per-IP and per-email rate limiting so the confirmation endpoint cannot be used to spray confirmation emails at a third party.
- Generic, non-revealing responses: the form and confirmation pages must not disclose whether an address is already registered (to prevent enumeration), and must not leak token validity beyond a generic success/failure.
- Single-use, time-limited, unguessable confirmation tokens; unconfirmed entries pruned on schedule and never treated as leads.
- A clear sender identity and an unsubscribe/withdraw path in the confirmation email.

Residual: low to medium. The double opt-in pattern itself can be a minor abuse vector toward third parties; rate limiting bounds it but cannot eliminate it.

### Excessive retention
- A defined retention period for un-actioned leads, with automatic or documented deletion at the end of it. **[review]** the actual retention period (number of months) is not yet set and must be chosen and justified with the controller/DPO.
- Unconfirmed double opt-in entries pruned rather than retained as leads.
- Backups carry their own bounded retention and expire on schedule; the retention policy covers both the live store and backups.
- One-click erasure and a documented request process let a person remove their data at any time.

Residual: low, once the retention period is set and the deletion job is verified to run.

### Profiling or function creep
- A single, stated purpose (callback), enforced by design; no advertising pixels, no behavioural tracking, no automated decision-making, no scoring.
- The buyer-value tools are designed to be stateless and to collect no personal data, so they cannot feed a profile (section 7).
- Analytics is cookieless and EU-hosted (Plausible) and is treated as processing no personal data, so platform usage is not tied to an identified person.
- Consent records (text, version, timestamp) make any change of purpose visible and require fresh consent.

Residual: low.

### Transfers or third-country access
- Email, database and analytics are selected to be EU/EEA-resident; the hosting region is an EU region.
- DPAs are recorded with every processor, and EU/EEA residency is a selection criterion for each.
- Sub-processors and the location of administrative/support access are checked per processor, not only the primary region, because some EU-region services are operated by companies with a US parent that may have lawful-access exposure or non-EU support staff. Where such exposure exists, the standard transfer mechanism (SCCs plus, where relied upon, the EU-US Data Privacy Framework) and any supplementary measures are recorded, and a provider with cleaner EU residency is preferred. **[review]**
- No standard Google Analytics, Meta Pixel, or other tool that would create a routine transfer to a third country. The project deliberately avoids the US-transfer problem that Datatilsynet identified for standard Google Analytics. Datatilsynet's own position is that the central transfer problem appears resolved for certified recipients under the EU-US Data Privacy Framework; the framework was upheld by the General Court on 3 September 2025 (Latombe, T-553/23), but an appeal (C-703/25 P) was registered at the Court of Justice and was undecided as of June 2026, so DPF-based transfers are not treated as durably settled. The design therefore avoids reliance on US transfers rather than depending on the framework's continued validity. **[review]** verify the DPF and processor-certification status again before go-live.

Residual: low, conditional on the per-processor sub-processor and access review being completed.

### Supply-chain / dependency compromise
- Lockfile committed; automated dependency vulnerability scanning and secret scanning in CI, with nothing high or critical left open at release.
- A strict CSP that constrains which origins can load scripts and receive data, reducing the blast radius of a compromised third-party script; the captcha and map-tile origins are explicitly allow-listed and nothing else.
- Minimise third-party scripts on the form page; the interest form should load as little third-party code as possible.
- Subresource integrity or self-hosting where practical for static third-party assets. **[review]**

Residual: low to medium. A client-side form is exposed to script-supply-chain risk; CSP and minimised dependencies reduce but do not remove it.

### Logging / observability leakage
- No personal data in application logs by design; structured logging that excludes form field values.
- Error tracking with PII scrubbing configured and verified (test that a submitted email/phone does not appear in an error report).
- Email provider and notification content reviewed so personal data is not exposed in subjects or metadata beyond what is necessary.
- Periodic check that analytics receives no query strings or paths carrying personal data (for example a plot pre-fill must not place an email in the URL).

Residual: low, conditional on the scrubbing being tested rather than assumed.

### Data-subject rights failure
- One-click erasure and per-subject export in the admin area; a documented DSAR runbook for access, rectification, erasure, restriction, objection and consent withdrawal.
- Identity verification proportionate to risk before acting on a request, to avoid disclosing or deleting on the strength of an unverified claim.
- Response within one month (Article 12(3)); a log of requests and how they were handled.
- Defined handling of how erasure interacts with backups (section 3, item 7).
- A one-click withdrawal/unsubscribe path in emails so withdrawal is as easy as consent.

Residual: low to medium. This depends heavily on the non-technical owner following the runbook; the handover and demo must cover it. **[review]**

### Breach detection and notification failure
- Audit logging and anomaly alerting (above) support detection.
- An incident-response runbook covering assessment, containment, the 72-hour notification to Datatilsynet (Article 33), notification to affected data subjects where the risk is high (Article 34), and who is responsible. **[planned] [review]** the responsible person and contact path must be named once the controller identity is fixed.

Residual: medium until the incident runbook exists and a responsible contact is named; this is a genuine gap today.

### Inaccurate or misdirected contact
- Double opt-in confirms the address belongs to the person and is correct.
- Server-side validation of email and phone format; the person can correct or withdraw at any time.
- Follow-up contact respects withdrawal and the stated no-obligation framing.

Residual: low.

## 6. Residual-risk judgement and conclusion

Important qualifier: the residual ratings in section 5 assume the [planned] controls are actually built, tested and verified to the project's QA gate. Today they are specified, not implemented. The conclusion below is therefore a screening determination about the processing as designed, and is valid only once the as-built system has been checked against this assessment before go-live.

On that basis: after the planned measures, the assessed risks sit at low or low-to-medium residual likelihood and severity, with two honest exceptions that are operational rather than design flaws: admin account compromise (high inherent severity, reduced by MFA and least privilege but bounded by the owner's operational security) and breach detection/notification (medium until the incident runbook and a named contact exist). Neither indicates large-scale, high-risk, or special-category processing.

The processing involves a small set of ordinary contact data, collected with explicit unbundled consent and double opt-in, intended to be stored in the EU/EEA under Article 32 controls, kept for a defined and short period, and erasable on request. There is no profiling, no automated decision-making, no special-category data, no systematic monitoring of publicly accessible areas, and no large-scale processing.

Screening determination: subject to the planned controls being implemented and verified, no high residual risk to data subjects is expected to remain, and the criteria that would make a full DPIA mandatory under GDPR Article 35(3) (and the corresponding Datatilsynet list of processing that requires a DPIA) are not met by this processing as scoped here. A full DPIA is therefore not currently mandated for the interest-registration processing. **[review]** this determination, including the reading of the Datatilsynet list, should be confirmed by a DPO or qualified privacy counsel.

This conclusion is conditional and must be revisited if the processing changes, for example: adding fields beyond navn, e-post and telefon (including any free-text message field); introducing profiling, scoring or automated decisions; introducing a megler or other recipient into the lead flow (section 8); adding or changing a processor, sub-processor, or any third-country access; adding any non-essential cookies or device storage; or a material increase in volume. This DPIA-lite, together with the records of processing (Article 30), the retention policy, the consent design, the privacy policy and the DSAR and incident-response runbooks, must be reviewed by a DPO or qualified privacy counsel before go-live, and at any material change. **[review]** the supporting documents under `docs/privacy/` and `docs/security/` do not yet exist and are prerequisites for go-live.

## 7. Note on the buyer-value tools

The buyer-value tools (savings and energy calculator, price-resilience, total monthly cost, year-round sun, community-energy dashboard, neighbourhood map, outage resilience, configurator, fremdrift and FAQ, shareable plot pages, aktuelt, partner area, and CO2) are designed to be stateless and to collect no personal data. They perform indicative calculations and visualisations on the user's device or server-side without identifying the user. Any optional "email my results" action does not create a separate data store: it routes through the consented interest-registration flow described above, under the same lawful basis, minimisation, storage and retention.

Two honest limits to the "no personal data" claim, to be verified rather than assumed:

- The neighbourhood/amenities map (SPEC-14) loads map tiles from a third party (MapLibre with OpenStreetMap/tile provider). Tile requests can expose the visitor's IP address and approximate viewport to the tile host. The tile source and its data handling must be checked, a privacy-respecting/EU source preferred, the origin constrained by CSP, and the conclusion recorded. **[review]**
- The anti-abuse challenge (Turnstile/hCaptcha) on the interest form runs in the visitor's browser and processes technical data with the challenge provider. This is part of the lead-capture processing (sections 3-5), not a separate store, and the provider must be EU/EEA-appropriate and under a DPA. **[review]**

Subject to those checks, the tools are out of scope for this assessment because they neither store nor enrich identifiable data and cannot feed a profile.

---

Document control: this DPIA-lite is a living artefact. It must be updated as the [planned] controls become implemented (re-stating them as verified facts with evidence), re-checked against the as-built system before go-live, and signed off by a DPO or qualified privacy counsel together with the privacy policy, the records of processing (Article 30), the retention policy, the consent design, and the DSAR and incident-response runbooks. All items marked **[review]** require that sign-off or a developer/controller decision before they can be closed.
