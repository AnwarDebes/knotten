# Runbook: incident response

Status: operational runbook. A short, practical guide for the owner when something goes wrong. For a personal-data breach, GDPR sets a 72-hour notification clock, so act promptly.

## First steps (any incident)

1. **Assess**: what is affected (the public site, the interest form, the admin, the database) and is personal data involved?
2. **Contain**: if a secret may be exposed, rotate it now (`docs/runbooks/deploy-and-secrets.md`). If the admin is compromised, revoke sessions by rotating `AUTH_SECRET` and forcing re-login, and reset the affected operator's password.
3. **Preserve evidence**: note timestamps; the audit log (admin) and the host/provider logs are the record. The audit log holds no personal data.

## Personal-data breach (GDPR Article 33/34)

If lead data may have been exposed:

1. Determine scope (which records, how, when) from the audit log and provider access logs.
2. Notify the data controller and DPO immediately. The controller assesses whether the breach is likely to risk individuals' rights; if so, notify Datatilsynet **within 72 hours** of becoming aware, and inform affected individuals if the risk is high.
3. Record the breach, its handling and the decision, even if no notification is required.

## Common incidents

- **Site down**: check the host status and the latest deploy; roll back to the previous deploy if a release caused it. Public pages are static/ISR, so a database outage does not take the marketing site down; only the form and admin are affected.
- **Form abuse spike**: the rate limits and honeypot absorb most of it; if needed, enable or tighten Turnstile. No action exposes data.
- **Email not sending**: the platform fails the request open (it does not break the form); check `EMAIL_API_KEY` and the provider dashboard.
- **Database issue**: see `docs/runbooks/backup-and-restore.md`.

## After an incident

Rotate any exposed secrets, confirm the fix, and update this runbook and the threat model (`docs/security/threat-model.md`) with anything learned.
