# Consent and Retention Policy: Knotten Lead Capture

Status: draft, internal. This policy governs how consent is obtained, recorded and withdrawn, and how lead data is retained, deleted and disclosed for the Knotten interest-capture processing (SPEC-06, SPEC-07). It is the operational counterpart to the public privacy policy and the processing record, and it implements MASTER-BRIEF section 10 and the SPEC-06 / SPEC-07 acceptance criteria.

> **Marked for legal / DPO review.** This document and the user-facing consent text it references describe the intended implementation. They must be reviewed and signed off by a lawyer or DPO before the site goes live (bør gjennomgås av jurist/DPO). Nothing here is legal advice.

> **Pending input.** The data controller identity (legal company name, organisation number, contact point) is UNKNOWN and tracked in `docs/INPUTS-NEEDED.md` (item 7). It is referenced below as `[CONTROLLER]` and must be filled in before publication. The same applies to the privacy-policy URL, shown as `[/personvern]`.

## 1. Scope

This policy covers personal data submitted through the "Meld interesse" interest form: at most navn (name), e-post (email), telefon (phone, optional), an optional interest or plot reference, and the consent record. It also covers any "email my results" action originating in a buyer-value tool, which routes through this same consented lead flow and never collects data on its own.

The lawful basis for the processing is consent (GDPR art. 6(1)(a)). No special-category data is collected, and the form must reject it.

### Out of scope: the buyer-value tools

The buyer-value tools (savings, price-resilience, monthly cost, sun, community dashboard, neighbourhood map, outage resilience, configurator, CO₂, and the rest of SPEC-05, 10, 11, 12, 13, 15, 16, 21) are stateless and **collect no personal data**. They run in the browser against indicative parameters, persist nothing about the visitor, and require no consent. The only path from a tool to a stored record is an explicit, opt-in "email my results" action, which hands off to the interest form and is governed by sections 2 to 4 of this policy. A tool must never write a lead, a contact detail or an identifier of its own accord.

## 2. Consent requirements

Consent for the lead processing must meet all of the following. A submission that does not satisfy them is rejected server-side.

- **Explicit and opt-in.** Consent is a deliberate affirmative action: an unchecked checkbox the visitor must actively tick, or an equivalent clear act. **No pre-ticked boxes**, no consent implied by submitting the form, no opt-out construction, no consent bundled into a "by continuing you agree" pattern.
- **Unbundled.** Consent to be contacted about Knotten is separate from any other purpose. It is not a condition for using the buyer-value tools or browsing the site, and it is not packaged together with, for example, a newsletter or marketing consent. If a further optional purpose is ever added (for example milestone updates under SPEC-19), it is presented as its own separate, independently tickable choice with its own text, not folded into the interest consent.
- **Specific and informed.** The consent control states the **purpose in plain language**: that `[CONTROLLER]` will use the contact details to get in touch about the Knotten development (an uforpliktende, no-obligation contact), and nothing else. It carries a **link to the privacy policy** (`[/personvern]`) reachable before the visitor consents.
- **Freely given.** Declining consent must leave the rest of the site, including every tool, fully usable.
- **Granular where applicable.** Each distinct optional purpose gets its own control. The base interest consent and any future optional purpose are never satisfied by a single tick.

### Anti-abuse must not weaken consent

Honeypot, the privacy-respecting challenge (Turnstile / hCaptcha), rate limiting and per-IP/email throttling protect the form, but they never act as, or substitute for, the consent action, and a passed challenge is not consent.

## 3. The consent record (stored per lead)

For every accepted submission the system stores a consent record alongside the lead, so consent is provable after the fact (GDPR art. 7(1)). The record contains at least:

- the **exact consent text** the visitor was shown, stored verbatim (not a reference that could later resolve to different wording);
- the **consent text version** identifier, so the precise wording can be reconstructed even as the text evolves;
- the **timestamp** of consent, stored in UTC with timezone, recorded server-side;
- the language the text was shown in (NO or EN);
- the source / context (which page or which tool's "email my results" handoff);
- the **double opt-in confirmation timestamp** once the email is confirmed (see section 4), and the confirmation status until then.

The exact consent text is versioned in the repository (a small, append-only catalogue keyed by version id and language). When the wording changes, a **new version id** is created; existing records keep pointing at the version that was actually displayed to that lead. The verbatim copy stored on the lead is authoritative; the catalogue exists for review and reuse.

### Reference consent text (to be finalised in legal review)

The following is the intended NO and EN wording. The version id and the public URL are placeholders until finalised. This text is **subject to legal / DPO review** and must not be treated as final.

- Version id: `consent-v1` (placeholder)
- NO: "Jeg samtykker til at `[CONTROLLER]` kan kontakte meg om boligprosjektet Knotten i Rødberg, basert på opplysningene jeg oppgir her. Kontakten er uforpliktende. Se [personvernerklæringen](`[/personvern]`) for hvordan opplysningene behandles. Du kan trekke samtykket tilbake når som helst."
- EN: "I consent to `[CONTROLLER]` contacting me about the Knotten housing development in Rødberg, using the details I provide here. This contact is without obligation. See the [privacy policy](`[/personvern]`) for how the data is handled. You can withdraw your consent at any time."

The control rendering this text is an unchecked checkbox (no pre-tick), separate from the submit action and from any other choice.

## 4. Double opt-in (email confirmation)

A submission is not a confirmed lead until the email address is verified by double opt-in:

1. On submission, the lead is stored with status `unconfirmed`, the consent record is written, and a confirmation email is sent to the supplied address.
2. The confirmation email contains a single, single-use, time-limited confirmation link (token expiry to be set in implementation, for example 72 hours) and **no tracking pixels**, consistent with the email standard in MASTER-BRIEF section 5.
3. Following the link sets the lead to `confirmed` and writes the double opt-in confirmation timestamp into the consent record.
4. A lead that is never confirmed stays `unconfirmed` and is deleted per the retention rule in section 6. Unconfirmed leads are not contacted for the marketing purpose.

The confirmation step verifies the email and provides a second, independent record that the consent action came from the address holder. It does not replace the explicit consent of section 2; both are required.

## 5. Withdrawal of consent

**Withdrawing consent is as easy as giving it** (GDPR art. 7(3)). In practice:

- Every confirmation email and every subsequent contact email includes a working **one-click unsubscribe / withdraw** link that requires no login and no explanation.
- The withdraw link, and a request to `[CONTROLLER]`'s contact point (and the DPO once appointed), are both accepted as valid withdrawals.
- Withdrawal is acted on without delay: the lead is flagged withdrawn and removed from any contact use immediately, and the record is deleted under section 6 (a withdrawn lead becomes a deletion candidate at once unless a separate legal obligation requires brief retention, in which case only the minimum is kept and the reason is documented).
- Withdrawal does not affect the lawfulness of processing before withdrawal.
- The fact and timestamp of withdrawal are written to the admin audit log (SPEC-07). No tracking or profiling of the withdrawing person follows from a withdrawal.

## 6. Retention periods

Data is kept only as long as needed for the purpose it was collected for (GDPR art. 5(1)(e)). Two cases are distinguished. The concrete figures below are the **proposed defaults pending legal / DPO confirmation**; they may be tightened or adjusted on review.

### Unconfirmed leads (double opt-in never completed)

- Deleted automatically **30 days** after submission if the confirmation link is never followed.
- No marketing contact occurs in this window.

### Confirmed but un-actioned leads

An "un-actioned" lead is a confirmed registration that has not progressed into an active sales or follow-up relationship (no qualifying contact recorded by the developer).

- Retained for **18 months** from the date of confirmation (the last consent interaction), then deleted automatically.
- Before deletion, a single optional re-confirmation message may be sent close to expiry; if the lead re-engages, the clock restarts from that interaction. If not, deletion proceeds.

### Actioned leads (active interest / follow-up underway)

An "actioned" lead is one the developer is in genuine, recorded contact with about a possible purchase.

- Retained for the duration of the active relationship plus **24 months** after the last meaningful contact, then deleted, unless the relationship has by then moved into a separate process (for example a megler-handled sale) governed by its own basis and retention.
- The clock resets on each recorded meaningful contact.

### Withdrawn leads

Deleted at withdrawal per section 5, retaining at most the minimum needed to honour the withdrawal (for example a suppression note) where strictly necessary and documented.

### Analytics and tools

Plausible (EU, cookieless) holds no personal data and is governed by its own configuration, not this policy. The buyer-value tools store nothing (section 1), so they have no retention period.

## 7. Deletion process (automatic and documented)

- **Automatic deletion** runs as a scheduled job that, on each run, hard-deletes leads (and their consent records, subject to section 5) that have passed the retention thresholds in section 6: unconfirmed past 30 days, confirmed un-actioned past 18 months, actioned past their 24-month tail.
- Deletion is a true delete of the personal data, not a hidden or soft-delete flag, consistent with the SPEC-07 acceptance criterion that "erasure truly deletes (verifiable)." Where a record id must survive for audit-log integrity, only non-personal references remain; no name, email or phone is retained.
- Each automatic deletion run, and each manual deletion, writes a non-personal entry to the **audit log** (what category, how many, when, by which rule or operator). The audit log itself contains **no PII**.
- Backups: deletions propagate to backups within the backup rotation window. The runbook documents that an erased subject re-appearing only inside an as-yet-unrotated encrypted backup is expected and is purged on the next rotation; restores must re-apply pending deletions. (Backup rotation and the tested restore are owned by SPEC-26; this policy states the requirement.)
- The full procedure (schedule, thresholds, what is deleted, backup handling, verification) is written up in the DSAR/erasure runbook under `docs/runbooks/` (SPEC-26, MASTER-BRIEF section 12).

## 8. Data subject requests: access, export (DSAR) and erasure

Requests under GDPR art. 15 (access), art. 20 (portability) and art. 17 (erasure) are handled through the admin dashboard (SPEC-07) and the DSAR/erasure runbook.

- **Intake.** Requests are accepted at `[CONTROLLER]`'s contact point and the DPO address once appointed. Identity is verified proportionately (typically by demonstrating control of the email on file) before any data is disclosed or erased, so data is not handed to or deleted by the wrong person.
- **Access / export (DSAR).** The admin provides a **per-subject export** of that lead's stored data, including the full consent record (exact text, version, timestamps, source, confirmation and withdrawal status), in a structured, commonly used, machine-readable format suitable for portability.
- **Erasure.** The admin provides **one-click GDPR erasure** that truly deletes the subject's personal data, verifiably, and propagates to backups per section 7.
- **Timeframe.** Requests are fulfilled **without undue delay and within one month** of a verified request (GDPR art. 12(3)). Where a request is complex or numerous, the period may be extended by up to two further months, in which case the subject is informed of the extension and the reason within the first month.
- **Cost.** Requests are handled free of charge, save for the narrow art. 12(5) exception for manifestly unfounded or excessive requests, which is documented if ever relied on.
- **Logging.** Each request and its resolution (received, verified, fulfilled, refused with reason) is recorded in the audit log without storing the request contents as PII.

## 9. Records and review

- This processing is entered in the records of processing (Art. 30) and is the subject of the DPIA-lite for lead capture (MASTER-BRIEF section 10).
- DPAs are in place with every processor that touches lead data (hosting, database, email), all resident in the EU/EEA. Plausible and the cookieless analytics are documented separately.
- This policy, the consent text catalogue and the retention figures are reviewed by the lawyer / DPO before go-live and re-reviewed when the controller identity, processors, retention periods or consent wording change, and otherwise at least annually.

## Sources / references

- Regulation (EU) 2016/679 (GDPR): art. 5(1)(c) and (e), art. 6(1)(a), art. 7, art. 12, art. 15, art. 17, art. 20, art. 30, art. 32.
- Datatilsynet, guidance on samtykke (consent) and innebygd personvern (privacy by design): https://www.datatilsynet.no/
- MASTER-BRIEF.md sections 5, 9, 10, 12; SPEC-06, SPEC-07, SPEC-08, SPEC-26.
- `docs/research/personvern-og-analyse.md` (cookieless analytics, no-banner conclusion).
- `docs/INPUTS-NEEDED.md` item 7 (data controller identity), item 9 (processor account ownership).

Sources were checked in June 2026. Retention periods, consent wording and the controller identity are provisional and must be re-verified and approved in legal / DPO review before publication.
