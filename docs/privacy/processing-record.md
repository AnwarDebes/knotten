# Records of processing activities (GDPR Article 30)

**Document:** Protokoll over behandlingsaktiviteter / Records of processing activities
**Scope:** The Knotten platform (Knotten, Sjøutsikt i Rødberg)
**Controller role:** Behandlingsansvarlig (controller) under GDPR Article 4(7)
**Status:** Draft for legal / DPO review. Not yet adopted. See "Review and sign-off" below.
**Version:** 0.1
**Last updated:** June 2026
**Owner of this record:** Sigve Simonsen AS (developer / data controller)

> This record is maintained under Article 30(1) of the General Data Protection Regulation (Regulation (EU) 2016/679, GDPR), as incorporated into Norwegian law by personopplysningsloven. It documents the processing carried out through the Knotten platform. It is a living document: it is reviewed when the processing, the processors, or the legal basis changes, and at least annually.
>
> **REVIEW REQUIRED:** This document, and the linked privacy policy (personvernerklæring), must be reviewed by a qualified data protection lawyer or DPO before the platform goes live under the client's name. The controller block below contains a placeholder that must be completed before adoption.

---

## 1. Controller (behandlingsansvarlig)

> **PLACEHOLDER, TO BE COMPLETED BEFORE ADOPTION.** The identity below is a placeholder pending confirmation from the developer. It must be filled in with the verified legal name, organisation number and contact details, and confirmed by legal / DPO, before this record is adopted or the platform goes live. Recorded as a gap in `docs/INPUTS-NEEDED.md` (item 7).

| Field | Value |
|-------|-------|
| Legal name | Sigve Simonsen AS *(PLACEHOLDER: confirm exact registered legal name)* |
| Organisation number | *(PLACEHOLDER: confirm org. nr from Brønnøysundregistrene / Enhetsregisteret)* |
| Registered address | *(PLACEHOLDER: confirm registered business address, Lindesnes kommune, Agder)* |
| Contact point for this processing | *(PLACEHOLDER: confirm controller contact, e.g. a dedicated personvern@ address. During development the known contact is Sigve Simonsen, Daglig leder, but a role-based address is preferred for a published privacy policy.)* |
| Data protection officer (personvernombud) | Not appointed. A DPO is not mandatory for this processing under GDPR Article 37 (the processing is limited in scale and not a core activity). *(Confirm with legal / DPO; revisit if the scope of processing grows.)* |
| Joint controllers | None. |
| Representative (if controller is outside the EU/EEA) | Not applicable; the controller is established in Norway (EEA). |

---

## 2. Processing activity

The platform carries out a **single processing activity**.

### 2.1 Name of the activity

**Interesseregistrering for boligprosjektet Knotten (interest registration for the Knotten housing development).**

A prospective buyer voluntarily submits a short, no-obligation interest form (*Meld interesse*) so the controller can make contact about the development. A double opt-in confirmation step verifies the e-mail address before the registration is treated as active.

### 2.2 Purpose of the processing (Article 30(1)(b))

To register and follow up expressions of interest in the Knotten development:

- contacting the prospective buyer for a no-obligation conversation (*uforpliktende prat*) about the project;
- informing registered, consenting prospects of project milestones and progress (*fremdrift*) where they have asked to be kept informed;
- understanding aggregate interest and demand to plan the development and its marketing.

The purpose is limited to interest registration and follow-up. The data is not used for transactional sales (the project is pre-salgsstart and pre-regulering), is not sold or shared for third-party marketing, and is not subject to any automated decision-making or profiling within the meaning of Article 22.

### 2.3 Lawful basis (rettslig grunnlag)

**Consent, GDPR Article 6(1)(a) (samtykke).**

Consent is collected as an explicit, unbundled, affirmative opt-in:

- a single, clearly worded checkbox, not pre-ticked;
- separate from any other action, so the consent is freely given and specific to this purpose;
- accompanied by a clear statement of purpose and a link to the privacy policy (personvernerklæring);
- withdrawable at any time, as easily as it was given, by contacting the controller or using the unsubscribe / erasure path. Withdrawal does not affect the lawfulness of processing before withdrawal.

The exact consent text, its version, and the timestamp of the action are recorded with each registration (see section 4, the consent record). No special-category data (Article 9) and no criminal-offence data (Article 10) are processed.

> Note: the platform analytics (Plausible, EU, cookieless) are out of scope for this record because they process no personal data and store nothing on the visitor's device. The reasoning is documented in `docs/research/personvern-og-analyse.md`. If residual analytics data were ever reassessed as personal data, a separate lawful basis and a new assessment would be required.

### 2.4 Categories of data subjects (Article 30(1)(c))

**Prospective buyers (potensielle kjøpere / interessenter)** who voluntarily submit the interest form. No data is collected about any other group, and the form is not directed at, or intended for, children.

### 2.5 Categories of personal data (Article 30(1)(c))

Collection is minimised (Article 5(1)(c)). The fields are:

| Field | Norwegian label | Required | Notes |
|-------|-----------------|----------|-------|
| Name | navn | Required | Needed to address the prospect in follow-up. |
| E-mail | e-post | Required | Primary contact channel; also the address verified by double opt-in. |
| Phone | telefon | Optional | Collected only if the prospect chooses to provide it, for follow-up by phone. |
| Plot / interest | tomt / interesse | Optional | Free-text or a selected plot reference, indicating which plot or aspect the prospect is interested in. Pre-filled when the form is reached from a per-plot page. |

In addition, the following **consent record** is stored with each registration as evidence that valid consent was obtained (Article 7(1)):

| Field | Description |
|-------|-------------|
| Consent text | The exact wording of the consent statement shown to the data subject at the moment of submission, stored verbatim (not a reference). |
| Consent version | The version identifier of the consent text in force when consent was given, so the precise wording can be reconstructed even after the text is later revised. |
| Timestamp | The date and time the consent action was recorded (and, separately, the time of double opt-in confirmation). |
| Source | The origin of the registration (for example the page or per-plot deep link the form was submitted from), used to understand where interest comes from. No tracking pixels or third-party identifiers are used. |

The double opt-in confirmation status is stored as part of the record. A registration that is not confirmed within the configured window is not treated as an active lead and is removed per the retention rule (section 6).

> Data minimisation note: no address, no date of birth, no financial data, no IP address retained as a lead attribute, and no marketing-tracking identifiers are collected. The buyer-value tools (calculators, configurator, maps) are stateless and collect no personal data; an optional "email my results" action, if used, routes through this same consented interest flow and is covered by this record.

---

## 3. Recipients and processors (Article 30(1)(d))

Personal data is not disclosed to third parties for their own purposes. It is processed on the controller's behalf by the data processors (databehandlere) listed below. Each is engaged under a written data processing agreement (databehandleravtale, DPA) meeting Article 28, and each processes data only on the controller's documented instructions. All are located, and store data, within the EU/EEA.

| Function | Processor (candidate; confirm at go-live) | Role | Location / data residency | Personal data handled | DPA |
|----------|-------------------------------------------|------|----------------------------|------------------------|-----|
| Web hosting | Vercel | Processor (hosting / serverless execution) | EU region | Form data in transit; request handling | Required, Article 28 DPA on file before go-live |
| Database | Neon / Supabase / Vercel Postgres (one chosen) | Processor (storage of registrations and consent records) | EU region (mandatory) | All stored lead fields and consent records | Required, Article 28 DPA on file before go-live |
| E-mail | Resend / Postmark (EU) or Norwegian SMTP | Processor (double opt-in and notification e-mail) | EU/EEA | Name, e-mail (no tracking pixels in messages) | Required, Article 28 DPA on file before go-live |
| Analytics | Plausible Cloud (EU) | Processor (aggregate, cookieless analytics) | EU (Germany / Finland / Slovenia per provider) | No personal data; included for completeness | DPA in place; no personal data processed |
| Bot mitigation / captcha | Cloudflare Turnstile | Processor (privacy-respecting challenge on public forms) | EU/EEA processing | Challenge token; no personal-data profiling | Required, Article 28 DPA on file before go-live |
| Maps / terrain | MapLibre + OpenStreetMap; Kartverket Høydedata | Data source / library, not a processor of buyer data | Open data; client-side rendering | None; no buyer data sent to map providers | Not a processor of personal data; no trackers |
| Error tracking | Sentry (EU) or self-hosted | Processor (error monitoring with personal-data scrubbing) | EU/EEA | None expected; configured to scrub personal data | Required, Article 28 DPA on file before go-live |

Notes:

- The candidate processors above are recorded in `COSTS.md` and the architecture decision records; the final choice per function is confirmed before go-live, and this table is updated to name the actual processor and its DPA.
- The maps/terrain and analytics rows are included for transparency. They are not recipients of buyer personal data: the analytics tool processes no personal data and the map libraries receive no buyer data.
- No public authority is a routine recipient. Data would be disclosed to an authority only where a specific legal obligation requires it.

---

## 4. The consent record (evidence of consent)

For each registration the platform stores a complete, self-contained record that the controller can produce to demonstrate compliance under Article 7(1):

- the **exact consent text** shown at submission, stored verbatim;
- the **version** of that text in force at the time;
- the **timestamp** of the consent action, and separately of the double opt-in confirmation;
- the **source** of the registration.

Because the verbatim text and its version are stored together, the precise wording a given data subject agreed to can always be reconstructed, even after the published consent text is revised. This supports both accountability and any later dispute about scope of consent.

---

## 5. Transfers to third countries (Article 30(1)(e))

**No transfers of personal data outside the EU/EEA take place.**

All processors that handle personal data store and process it within the EU/EEA, which is a hard requirement of the architecture (EU data residency for hosting, database and e-mail). Consequently there are no transfers to third countries or international organisations, and no transfer safeguards (Article 46 standard contractual clauses, adequacy decisions, or derogations under Article 49) are relied upon for this processing.

This is a deliberate design choice that avoids the EU-US transfer questions that affected, for example, standard Google Analytics (see `docs/research/personvern-og-analyse.md`). If any future processor or feature would introduce a transfer outside the EU/EEA, it must not be adopted until a transfer mechanism and a fresh assessment are in place, and this record must be updated first.

---

## 6. Retention and erasure (Article 30(1)(f) where applicable; Article 5(1)(e))

Personal data is kept only as long as needed for the purpose, then deleted.

| Category | Retention rule | Deletion mechanism |
|----------|----------------|--------------------|
| Unconfirmed registrations (double opt-in not completed) | Removed after the confirmation window expires (default: 7 days; confirm with legal / DPO). | Automated deletion; the registration never becomes an active lead. |
| Active, un-actioned leads (confirmed, but no contact / progression) | Retained for a defined period of **24 months** from the last meaningful interaction, then deleted, unless the data subject has been moved into an active sales relationship or asks to be kept informed and renews consent. *(24 months is the proposed default for this pre-salgsstart, interest-only phase; confirm and finalise with legal / DPO.)* | Scheduled, automated deletion with a documented, logged run; deletion is verifiable. |
| Consent records | Retained for as long as the related lead is retained, plus a limited period needed to evidence that valid consent was obtained, then deleted with the lead. *(Confirm the evidence period with legal / DPO.)* | Deleted together with the lead. |
| Data subject erasure request | Honoured without undue delay (Article 17). | One-click GDPR erasure in the admin tool truly deletes the record (verifiable), with the action recorded in the audit log. |

Withdrawal of consent (Article 7(3)) results in deletion of the lead, save for any minimal record needed to evidence that the data was held and lawfully erased on request. The full erasure and access (DSAR) process is documented in the runbooks (`docs/runbooks/`).

> **REVIEW REQUIRED:** The 24-month active-lead retention period and the consent-evidence period are proposed defaults for this interest-only phase. They must be confirmed (and, if needed, shortened) by legal / DPO before adoption, and the figure published in the privacy policy.

---

## 7. Security measures (Article 30(1)(g); Article 32)

A general description of the technical and organisational security measures, as required by Article 30(1)(g). The full detail is maintained separately and must be read alongside this record:

- **Threat model:** `docs/security/threat-model.md` (assets, entry points, threats and mitigations, mapped to the OWASP Top 10). The lead database is treated as the crown jewel and the public forms as the primary attack surface.
- **GDPR Article 32 statement:** maintained under `docs/security/` and summarised here.

Measures in force (mapped to Article 32):

- **Encryption (Art. 32(1)(a)):** TLS in transit and encryption at rest for stored data.
- **Confidentiality and integrity (Art. 32(1)(b)):** input validation (allowlist) and output encoding throughout; parameterised database access only; strict Content Security Policy, HSTS and related response headers; CSRF protection on state-changing requests; rate limiting and bot mitigation (captcha) on public forms and authentication; admin access behind strong authentication with TOTP multi-factor, lockout, least-privilege roles and short, secure sessions; no personal data in logs; audit logging of admin and data actions; error tracking with personal-data scrubbing.
- **Availability and resilience (Art. 32(1)(b)):** managed EU hosting and database; database backups with a documented and tested restore procedure (`docs/runbooks/`); uptime monitoring and alerting.
- **Testing and evaluation (Art. 32(1)(d)):** dependency and secret scanning in CI (nothing high/critical left open); security tests in CI; abuse testing of forms and authentication; periodic review of the threat model and this record.
- **Organisational:** secrets held only in the platform secret manager / environment with documented rotation; least-privilege database user; access limited to the controller and authenticated, MFA-protected admin users.

A short data protection impact screening (DPIA-lite) for the lead-capture processing is maintained alongside this record. Given the limited scale, the minimised data, the absence of special categories, profiling and third-country transfers, a full DPIA under Article 35 is not expected to be required; this conclusion is to be confirmed by legal / DPO.

---

## 8. Data subject rights

The processing supports the rights under GDPR Chapter III:

- **Access and portability (Articles 15, 20):** per-subject export (DSAR) from the admin tool.
- **Rectification (Article 16):** records can be corrected.
- **Erasure (Article 17):** one-click, verifiable erasure.
- **Restriction and objection (Articles 18, 21):** handled through the documented request process.
- **Withdrawal of consent (Article 7(3)):** available at any time, as easily as consent was given.

Requests are handled per the documented DSAR / erasure runbook (`docs/runbooks/`). A data subject may also lodge a complaint with the Norwegian supervisory authority, Datatilsynet.

---

## 9. Related documents

- `docs/security/threat-model.md`: threat model (OWASP Top 10 mapping).
- `docs/security/`: GDPR Article 32 security statement.
- `docs/privacy/`: DPIA-lite, consent and retention notes, and the privacy policy (personvernerklæring, NO/EN), all marked for legal / DPO review.
- `docs/research/personvern-og-analyse.md`: analysis of cookieless analytics, the cookie-banner conclusion, and the EU-US transfer background.
- `docs/runbooks/`: DSAR / erasure and incident procedures.
- `docs/INPUTS-NEEDED.md` (item 7): the outstanding controller-identity inputs.
- `COSTS.md`: candidate processors and plans.

---

## 10. Review and sign-off

| Item | Status |
|------|--------|
| Controller legal name, org. number, contact | PLACEHOLDER, to be completed |
| Active-lead retention period (proposed 24 months) | To be confirmed by legal / DPO |
| Final processor selection per function and DPAs on file | To be confirmed before go-live |
| Legal / DPO review of this record and the privacy policy | REQUIRED before adoption and go-live |

**This document is a draft and must be reviewed and approved by a qualified data protection lawyer or DPO (bør gjennomgås av jurist / personvernombud) before it is adopted and before the platform processes any real personal data under the client's name.**
