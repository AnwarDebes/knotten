# SPEC-26 completion note

## What was built

Deployment, observability, handover and the demo, packaged so a non-developer can run the platform from the documents alone. The infrastructure-dependent steps (the live production deploy, the error-tracker DSN, the uptime monitor and the restore test) are wired through environment variables and runbooks and performed at go-live, consistent with the build-now, swap-infra-later approach used throughout.

- **Deployment**: the app is a standard Next.js (App Router) build; `docs/runbooks/deploy-and-secrets.md` covers one-time provisioning, deploying a change, and rotating or recovering secrets. The site stays access-gated and noindex (`SITE_INDEXABLE=false`, staging password) until the client approves go-live.
- **Observability**: `docs/runbooks/observability.md` describes error tracking (an EU-region tracker connected via `ERROR_TRACKING_DSN`, with mandatory PII scrubbing; errors log to stdout until then), uptime checks, logs, and the Plausible interest signal. The app fails soft on email and database hiccups so the public site stays up.
- **Backup and restore**: `docs/runbooks/backup-and-restore.md` documents the managed-Postgres daily backups with point-in-time recovery and the restore procedure, including re-applying GDPR erasures from the audit log; the tested restore is recorded at go-live.
- **Incident response**: `docs/runbooks/incident-response.md`, including the GDPR 72-hour breach-notification clock.
- **Handover**: `HANDOVER.md` now links every runbook and the demo, alongside the provisioning steps, the admin owner bootstrap, and the go-live checklist.
- **Demo**: `docs/DEMO.md`, a five-minute walkthrough from the place and the 3D terrain, through the buyer-value tools and the consent-first lead capture, to the admin control room, the community dashboard and the partner kit.

## Verification

- Local gate green: lint, type-check, format, unit tests, build, bundle budget; the end-to-end journeys run in CI (SPEC-24).
- The runbooks and the demo were written against the actual implemented behaviour (admin bootstrap and MFA, content edit to public update, DSAR and erasure, retention cron, the deliverables download).

## Go-live acceptance (with real infrastructure)

A working production deployment (access-gated, noindex), active error tracking, uptime and alerting, and a tested database restore are completed during go-live review and recorded in the runbooks. The performance budget and WCAG 2.2 AA are re-confirmed against the deployed site then.
