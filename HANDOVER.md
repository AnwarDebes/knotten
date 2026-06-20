# Handover

How to operate the Knotten platform, what it costs, what is an estimate, and what needs professional sign-off. This grows as the build completes; the deployment and observability detail is finalised in SPEC-26.

## What needs the client's real data

See `docs/INPUTS-NEEDED.md`. Nothing in the platform invents facts: unit and plot counts, prices, real photography, house types, the data-controller identity and the domain are all placeholders until provided.

## What needs professional sign-off

- The privacy policy and the consent text should be reviewed by a lawyer or DPO.
- The energy figures and the calculator are indicative estimates and need professional energy modelling before they are presented as final.
- Any structural, electrical or energy engineering claims need engineering verification.

## Production provisioning (required before go-live)

The build runs fully on an in-process database (PGlite) and a no-send email path for development. Production needs three external services, all in the EU/EEA, each with a data processing agreement on file:

1. **Hosted PostgreSQL (EU region).** Create the database (Neon, Supabase, or Vercel Postgres; EU region mandatory). Set `DATABASE_URL` in the hosting platform's secret manager. Run the migrations once: `pnpm db:migrate` (with `DATABASE_URL` set). The schema is identical to the one tested in development.
2. **Transactional email (EU/EEA provider).** Create an account (Resend EU region or equivalent), verify the sending domain (SPF, DKIM, DMARC). Set `EMAIL_API_KEY`, `EMAIL_FROM`, and `EMAIL_ADMIN_NOTIFY`. Until a key is set, the platform does not send email to anyone.
3. **Bot challenge (Cloudflare Turnstile).** Create a Turnstile widget. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. Until set, the challenge is skipped (development only).

Also set: `NEXT_PUBLIC_SITE_URL` (the real domain), `IP_HASH_SALT` (a long random value), and keep `SITE_INDEXABLE=false` until the client approves go-live.

## Go-live checklist

1. Make the GitHub repository private (recommended).
2. Provision the EU PostgreSQL, EU email provider and Turnstile (above); record each DPA in `docs/privacy/processing-record.md`.
3. Set all production environment variables in the hosting platform secret manager (see `.env.example`). Never commit secrets.
4. Run `pnpm db:migrate` against the production database.
5. Fill in the data-controller identity (legal name, org. number, contact) in the privacy policy and the consent text; have a lawyer or DPO review them.
6. Replace placeholder content (plot data, prices, imagery, house types) via the content layer as the client supplies it.
7. **Verify the lead pipeline end to end against the real infrastructure:** submit a test interest registration, confirm that the double opt-in email arrives, click the confirmation link, confirm the lead moves to confirmed and the admin notification arrives, and confirm the rate limit and Turnstile challenge behave. The logic is fully tested in development; this step confirms it against the live database, email provider and captcha.
8. Confirm analytics (Plausible EU) is recording and the no-cookie-banner conclusion holds.
9. Verify the access gate and `noindex` are still active during review, then set `SITE_INDEXABLE=true` only when the client approves go-live.
10. Confirm database backups and a tested restore (SPEC-26).

## Costs

See `COSTS.md` for the indicative monthly cost ledger.

## Revoke

When the build is handed over, revoke the build-time access token and rotate any shared secrets.
