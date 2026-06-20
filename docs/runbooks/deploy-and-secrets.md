# Runbook: deploy and rotate secrets

Status: operational runbook for go-live and ongoing operation. Written so a non-developer can follow it. The platform is a Next.js (App Router) app; it runs on any Node host or a managed platform (Vercel recommended). Until go-live it stays access-gated and noindex.

## One-time go-live provisioning

Do these once, in order. Full context is in `HANDOVER.md`.

1. **Make the GitHub repository private** (recommended).
2. **Provision the EU services** (all EU/EEA, each with a data processing agreement): managed PostgreSQL (EU region), an EU/EEA transactional email provider, and Cloudflare Turnstile. Record each DPA in `docs/privacy/processing-record.md`.
3. **Set the environment variables** in the host's secret manager (see `.env.example` for the full list): `DATABASE_URL`, `EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_ADMIN_NOTIFY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `IP_HASH_SALT`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, and keep `SITE_INDEXABLE=false` and `STAGING_ACCESS_PASSWORD` set until launch. Generate each secret with `openssl rand -base64 32`. Never commit secrets.
4. **Run the database migration**: `pnpm db:migrate` with `DATABASE_URL` set. The schema is identical to the one tested in development.
5. **Provision the admin owner**: set a temporary `ADMIN_BOOTSTRAP_SECRET`, call `POST /admin/bootstrap` once (see the admin section of `HANDOVER.md`), then remove the secret. Enrol MFA on first login.
6. **Wire the retention cron**: schedule `POST /api/cron/retention` daily with the `Authorization: Bearer $CRON_SECRET` header.
7. **Run the go-live checklist** in `HANDOVER.md`, then set `SITE_INDEXABLE=true` only when the client approves.

## Deploying a change

- Push to `main`. CI must be green (lint, types, format, unit, build, bundle budget, Lighthouse, end-to-end, secret scan, dependency audit).
- The host builds and deploys the new version. Public pages use ISR; content edits revalidate immediately, so most updates need no deploy.

## Rotating a secret

1. Generate a new value (`openssl rand -base64 32`).
2. Update it in the host's secret manager.
3. Redeploy (or restart) so the new value is picked up.
4. For `IP_HASH_SALT`: rotating it changes future IP hashes only (no personal data is exposed); the old hashes simply no longer correlate.
5. After handover, revoke the build-time access token and rotate `AUTH_SECRET`, `CRON_SECRET` and `ADMIN_BOOTSTRAP_SECRET`.

## If a secret leaks

Rotate it immediately (above), then check the audit log and the provider's access logs. The secret scan (gitleaks) runs in CI; the access token never lives in the repo.
