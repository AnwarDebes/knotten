# Inputs needed from the developer

Data and decisions required from Sigve Simonsen AS to replace placeholders with real content. Until each item is provided, the relevant feature is built data-driven against a clearly marked placeholder, so dropping in the real value requires no code changes.

## Critical (blocks accurate public content)

1. **Exact number of plots / homes.** This is currently UNKNOWN. The figure "8" from the original brief refers to advertised student internship positions, not units. The plot map, plot pages and all counts are fully data-driven and assume nothing about the total.
2. **Plot data:** size (m²), orientation, position/coordinates, and gnr/bnr for each plot.
3. **Indicative prices and status** per plot (ledig / reservert / solgt), if and when available.
4. **Real house types** for the configurator (names, sizes, layouts, basic specs).

## Imagery and media

5. **Real site photography and drone footage.** None exists yet. Until provided, the site uses clearly marked placeholders and tasteful abstract coastal art, with documented swap slots. No fabricated photos of the real location are used.
6. Any existing logo source files and brand assets beyond the current emblem and wordmark.

## Project and legal

7. **Data controller identity** for the privacy policy: company legal name, organisation number, and a contact point.
8. **Domain name.** Until provided, a Vercel preview URL is used. A `.no` domain requires a Norwegian organisation number.
9. **Account ownership** for the production services: Vercel (hosting), the database provider, Plausible (analytics), and the email provider. Decide whether these sit under the developer's account or Sigve Simonsen AS.
10. **Fremdrift / timeline** details: real dates or stages for regulering, bygging and innflytting.
11. Whether a real-estate agent (megler) will handle sales in the later phase.
12. Confirmation of the **ownership and licensing** arrangement for this codebase (see OPEN-QUESTIONS.md).

## Production infrastructure (provision before go-live)

The lead engine, admin and content layer run on an in-process database (PGlite) and a no-send email path in development. Production needs these, all EU/EEA, each with a data processing agreement (see HANDOVER.md for the step-by-step):

13. **Hosted PostgreSQL in an EU region** (Neon, Supabase or Vercel Postgres). Set `DATABASE_URL`; run `pnpm db:migrate`.
14. **EU/EEA transactional email provider** (Resend EU or equivalent) with a verified sending domain. Set `EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_ADMIN_NOTIFY`.
15. **Cloudflare Turnstile** keys for the bot challenge: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
16. A random `IP_HASH_SALT`, a random `CRON_SECRET` for the retention job, and the real `NEXT_PUBLIC_SITE_URL`.

Double opt-in and anti-abuse are fully tested in development; they get one end-to-end verification against the real database, email provider and captcha during go-live review.

## Energy concept specifics (for accurate numbers, not just illustrative)

17. Any engineering studies, measured data, or supplier quotes for the solar, wind, geothermal, storage or shared-energy elements, so figures can move from indicative estimates toward verified values.
