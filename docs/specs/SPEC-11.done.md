# SPEC-11 completion note

## What was built

A monthly cost of ownership calculator that monetises the energy advantage in the one number a Norwegian buyer compares: kroner per month. It is an indicative estimate, never a loan offer or financial advice.

- **Loan maths**: a standard annuity in a tested module, handling a 0% rate and edge cases.
- **Energy line, consistent with the other tools**: the Knotten home's demand and self-sufficiency come from the shared SPEC-05 energy model, and the per-kWh price reuses the SPEC-10 scheme logic (ordinær strømstøtte versus Norgespris, cheaper one chosen), so no divergent numbers across tools. Self-consumed solar avoids all grid cost.
- **Fair comparison**: the Knotten home and a conventional home use identical loan terms and shared costs; only the energy line differs, so the energy advantage is isolated honestly. The conventional baseline is the SSB household average (about 14,700 kWh/year, 2024), labelled with its year.
- **Output**: side-by-side monthly cost (loan, energy, shared costs, total) for both homes, the monthly energy advantage, and its cumulative value over 20 years.
- **Enova panel**: the current grant rates as a data-driven, informational panel with a verify-before-publishing note.
- **Tool UI**: number inputs for purchase price, equity, rate, term and shared costs with sane defaults, a Plausible goal on first use, assumptions and sources inline, and a prominent not-a-loan-offer, not-financial-advice disclaimer.

## Verification

- Local gate green: lint, type-check, format, tests (104), build, bundle budget. The tool is client-side and within budget.
- Unit tests (10): the annuity against a known loan, the 0% rate, non-positive inputs, term sensitivity, scheme selection, self-cover scaling, the same-loan-only-energy-differs invariant, the isolated positive energy advantage, the principal from price minus equity, and cumulative accumulation.
- Browser smoke test (headless Chromium) in NO and EN: both cost cards render, the energy delta and 20-year cumulative show, and the figures recompute on input with no page errors.

## Honesty and privacy

Stateless, no personal data, fully client-side. Every figure is labelled indicative with assumptions and source; the rate is indicative and dated and explicitly not a loan offer; the comparison keeps loan terms identical so only energy differs. Default assumptions (rate, baseline, Enova amounts) are admin-editable via the content layer in a later pass and are recorded as placeholders in INPUTS-NEEDED.
