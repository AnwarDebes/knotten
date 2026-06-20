# Runbook: observability

Status: operational runbook. What is monitored and how to read it. Designed so the integrations are wired through environment variables at go-live without code changes.

## Error tracking

- The application logs server errors to stdout (captured by the host). Connect an EU-region error tracker (for example Sentry EU or GlitchTip) at go-live by setting its DSN in the secret manager; the reporting hook is added then. PII scrubbing is mandatory: never send lead name, email, phone or free text to the tracker. The audit log and application logs already exclude PII.
- The interest email path and the database reads fail soft (they do not crash the request), so transient provider issues surface as logged warnings, not outages.

## Uptime

- Configure an external uptime check (for example the host's built-in monitor or a free pinger) against `/no` and `/api/interesse` (a GET returns 405, which still proves the app is up) at go-live. Alert the operator on two consecutive failures.

## Analytics (interest signal)

- Plausible (EU, cookieless) records page views, sources and the goals (interest completed, tool used, document downloaded). The owner reads it per `docs/runbooks/analytics-owner-guide.md`. This is the business signal, not error monitoring.

## Logs

- Host logs hold request and error lines with no personal data. Keep the retention short (the host default is fine) and ensure the log sink is in the EU.

## What good looks like

- CI green on `main`; the deployed site up; no error spikes in the tracker; the retention cron running daily (a `lead.retention.purged` audit entry appears when it removes stale leads); Plausible recording interest. The performance budget and accessibility are re-checked against the deployed site at go-live and stay within the section 8 budget and WCAG 2.2 AA.
