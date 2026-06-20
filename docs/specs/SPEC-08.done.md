# SPEC-08 completion note

## What was built

Privacy-first interest measurement, so the owner can answer "how many are interested and where do they come from" without surveilling anyone and without a cookie banner.

- **Cookieless, EU analytics**: a small `Analytics` component loads Plausible (EU, cookieless) only when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set, so development and previews stay clean. The script is deferred and off the critical path, sets no cookies, and carries no personal data, so no consent prompt is needed.
- **Goals**: a single `trackGoal` helper (a no-op until the script is present) fires named goals with no personal data attached. Wired now: interest-form completion (`Interesse fullfort`) on the form's success state, and buyer-value tool use (`Verktoy brukt`, with a coarse `tool` property) on first interaction with the energy calculator. The prospekt download goal (`Prospekt nedlasting`) is defined and ready to attach when the prospekt surface ships (SPEC-09/SPEC-25).
- **Owner reading**: `docs/runbooks/analytics-owner-guide.md` shows the non-technical owner how to read the interest count, its sources, and the trend over time, and how to filter sources to just the people who registered.
- **No-banner basis**: the legal reasoning (no device storage under ekomlov paragraf 3-15, no personal data under GDPR) and the EU-US Data Privacy Framework caveat were already documented in `docs/research/personvern-og-analyse.md`; the processing record already carries the Plausible DPA row and the no-PII note.

## Verification

- Local gate green: lint, type-check, format, tests, build, bundle budget. The analytics script is external and deferred, so it does not enter the bundle; the heaviest content route stays within budget.
- Unit tests: `trackGoal` is a safe no-op when the script is absent, forwards the goal name, passes only non-identifying properties, and the goal names are stable.
- The goal events are wired at the real surfaces that exist today (interest form, energy calculator). End-to-end goal firing in the live Plausible dashboard is confirmed once the account and the real domain are connected at go-live (the script does not load until then).

## Production note

Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (and optionally `NEXT_PUBLIC_PLAUSIBLE_SRC` for a self-hosted or proxied endpoint) to the real domain at go-live, create the goals in the Plausible account with the names above, and smoke-test each in NO and EN per `HANDOVER.md`. Account ownership (developer vs Sigve Simonsen AS) is an open input.
