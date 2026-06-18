# Running costs

A living ledger of the recurring monthly cost to operate the platform. Figures are indicative and to be confirmed against each provider's current pricing and the chosen plan. All processors must be EU/EEA-resident with a data processing agreement on file.

| Item | Provider (candidate) | Plan | Indicative monthly cost | Notes |
|------|----------------------|------|-------------------------|-------|
| Web hosting | Vercel | Hobby or Pro | 0 to ~20 USD | Hobby may suffice pre-launch; Pro for production guarantees and team use |
| Database | Neon / Supabase / Vercel Postgres | Free or entry paid | 0 to ~20 USD | EU region mandatory; small dataset (leads) fits a free or entry tier |
| Analytics | Plausible Cloud (EU) | Starter | ~9 EUR | Cookieless, EU-hosted; no cookie banner needed |
| Email | Resend / Postmark (EU) | Entry | 0 to ~15 USD | Low volume (lead confirmations and notifications) |
| Bot mitigation | Cloudflare Turnstile | Free | 0 | Privacy-respecting challenge |
| Domain | Registrar (to be chosen) | Annual | ~1 to 2 USD/month equiv. | `.no` requires a Norwegian org. number; client to provide domain |
| Error tracking | Sentry (EU) or self-hosted | Free tier | 0 | With personal-data scrubbing |

**Indicative total:** roughly 20 to 80 USD per month depending on plan choices, well within a small contractor's budget. The largest variable is the hosting and database tier once real traffic and the production guarantees are needed.

Update this file whenever a provider or plan is chosen or changes.
