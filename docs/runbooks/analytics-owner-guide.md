# Runbook: reading the interest numbers (Plausible)

Status: short, non-technical guide for the owner. It answers the one question that matters before salgsstart: **how many people are interested, and where do they come from?** No developer needed.

## What the analytics is (and is not)

- It is **Plausible**, a cookieless, EU-hosted web analytics tool. It counts page views, where visitors come from, and a few named goals.
- It sets **no cookies** and stores **no personal data**, so the site needs no cookie banner. The legal basis is written up in `docs/research/personvern-og-analyse.md`.
- It is **not** per-person tracking. You cannot, and should not try to, tie a number back to a named individual. Treat every figure as an indicative measure of interest, never a confirmed sale.

## Getting in

1. Sign in at `https://plausible.io` with the account credentials for Knotten (account ownership is decided at go-live; see `docs/INPUTS-NEEDED.md`).
2. Pick the Knotten site. The default view is the last 30 days; change the period with the date picker at the top.

## How many are interested?

The headline goal is **Interesse fullfort**. It counts each completed interest registration (after the person confirms by email, the lead is real; the goal fires when the form is submitted).

- On the dashboard, scroll to **Goal Conversions**. The count next to **Interesse fullfort** is how many registrations happened in the chosen period.
- Change the date range to see a week, a month, or since launch.

## Where do they come from?

- **Top Sources** shows where visitors arrive from (direct, Facebook, a search engine, a partner link, and so on).
- **Top Pages** shows which pages they read. A high count on Området or the energy pages tells you what draws interest.
- To see the sources of people who actually registered, click the **Interesse fullfort** goal; the dashboard then filters every panel to just those visitors, so Top Sources now shows where your registrations came from.

## The other goals

| Goal                | Fires when                                                          | Read it as                                                 |
| ------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| Interesse fullfort  | Someone completes the interest form                                 | Genuine interest, the key number                           |
| Verktoy brukt       | Someone uses a buyer-value tool (for example the energy calculator) | Engagement with the value story                            |
| Prospekt nedlasting | Someone downloads the prospekt                                      | Sales-readiness (lights up when the prospekt is published) |

## Trends over time

- The graph at the top plots visitors or a selected goal over time. Switch it to a goal by clicking the goal name, then watch the line after a Finn.no post, a newspaper mention, or a partner share to see what moved interest.
- Use **non-colour cues** too: read the numbers, not only the line, so the reading does not depend on colour vision.

## What you will never see here

- No names, emails or phone numbers. Those live only in the admin dashboard (`/admin`), behind login and two-factor, and are governed by the consent and retention policy.
- No cross-site or cross-device tracking, no advertising pixels, no session recordings.

## When the numbers are zero

Until the Plausible account and the real domain are connected (set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`), the site loads no analytics script and the dashboard is empty. This is expected before go-live; see `HANDOVER.md`.
