# Runbook: data subject requests (DSAR) and erasure

Status: internal operational runbook. It tells the operator how to handle access, export and erasure requests for Knotten lead data through the admin dashboard (SPEC-07), in line with the consent and retention policy (`docs/privacy/retention-and-consent.md`) and GDPR articles 15, 17 and 20.

> The data controller identity (legal name, organisation number, contact point) is still open; see `docs/INPUTS-NEEDED.md` item 7. Fill it in before going live, since it names who is accountable for these requests.

## Who can act

- **Owner** role: can view, export and erase.
- **Viewer** role: can view and export, but cannot erase.

Every operator signs in with a password and a TOTP one-time code. Erasure additionally requires re-entering the password (and code) at the moment of deletion.

## 1. Receiving a request

1. A request can arrive at the controller's contact point or, once appointed, the DPO address.
2. Verify identity proportionately, normally by confirming the person controls the email address on file. Do not disclose or erase anything before this is satisfied, so data is never handed to or deleted by the wrong person.
3. Record receipt. The dashboard writes the resulting data actions to the audit log automatically; note the request itself in the controller's own intake record without storing request contents as extra personal data.

## 2. Access and export (GDPR art. 15 and 20)

1. Sign in to `/admin`.
2. Find the lead with the search box (name or email) and open the detail view.
3. The detail view shows the full consent record: exact text shown, version, timestamp, double opt-in state, confirmation and withdrawal timestamps, source and pipeline status.
4. Use **Last ned personens data (JSON)** to produce a structured, machine-readable per-subject export suitable for portability. This writes a `lead.dsar.export` entry to the audit log.
5. Send the export to the verified requester through a secure channel.

For an internal bulk view, **Last ned CSV** on the dashboard exports the current list with strict escaping (formula injection is neutralised).

## 3. Erasure (GDPR art. 17, "right to be forgotten")

1. Confirm the request is valid and identity is verified (section 1).
2. Open the lead detail view as an **owner**.
3. In the **Slett** panel, re-enter the password and current TOTP code, then confirm.
4. The lead and its consent record are hard-deleted (a true delete, not a soft flag). The action writes a PII-free `lead.erased` entry to the audit log.
5. **Verify** by searching for the email again; it must return nothing. The end-to-end test (`scripts/_admin-e2e.mjs`) and the unit tests assert this re-query returns empty.

### Backups

Deletions propagate to backups within the backup rotation window. An erased subject may briefly persist only inside an as-yet-unrotated encrypted backup; it is purged on the next rotation, and any restore must re-apply pending deletions. Backup rotation and the tested restore are owned by SPEC-26.

## 4. Timeframe and cost

- Fulfil without undue delay and within **one month** of a verified request (art. 12(3)). If complex or numerous, the period may be extended by up to two further months, with the subject informed of the extension and reason within the first month.
- Requests are free, except the narrow art. 12(5) case of manifestly unfounded or excessive requests, which is documented if ever relied on.

## 5. Automatic retention (no request needed)

- Un-actioned pending leads are deleted automatically 30 days after submission via `POST /api/cron/retention` (Bearer `CRON_SECRET`), wired to the host scheduler at go-live.
- The confirmed-un-actioned (18 months) and actioned (24-month tail) deletions activate with the pipeline "actioned" flag now present on each lead (`actionedAt`), as set out in the retention policy.

## 6. What is never exposed

- The audit log contains no personal data: only action names, actor email (an operator, not a data subject), lead ids and non-personal counts.
- Application logs and error traces must not contain lead PII.
- The public buyer-value tools remain stateless and collect no personal data; the only path to a stored record is the consented interest flow (SPEC-06).
