# SPEC-17 completion note

## What was built

A fremdrift timeline and a cited FAQ that set honest expectations and let a cautious buyer verify the energy concept, on a dedicated `/fremdrift` page (EN `/progress`).

- **Timeline**: the stages (idea, zoning, groundwork, construction, move-in) with the current stage marked and a phase note instead of a promised date, carrying a forbehold. Admin-editable through the content layer; the page falls back to cited phase defaults until the owner adds stages.
- **FAQ**: an accessible, keyboard-operable accordion (native details/summary, no JavaScript) answering how energy sharing works, the prosumer benefit, the support schemes (with a cross-reference to the price tool), and forward-looking items (battery ownership, selling) that carry an explicit forbehold. Factual answers cite their source inline.
- **Next steps and CTA**: the "hva skjer videre" steps and a Meld interesse call to action accompany both modules.
- **Editable and live**: timeline and FAQ come from the SPEC-09 content layer; saving an entry revalidates the public page (NO and EN). Both render with locale parity.

## Verification

- Local gate green: lint, type-check, format, tests (138), build, bundle budget (the page is 146.9 KB, server-rendered, no client JavaScript).
- Unit tests (4): the default timeline marks exactly one current stage and has bilingual labels with a phase note, and the default FAQ has bilingual question/answer pairs with unique keys and a cited source on the factual scheme answer.
- Server-rendered output verified in NO (`/no/fremdrift`) and EN (`/en/progress`): the timeline stages, the "where we stand" heading and the FAQ render without JavaScript.

## Honesty and privacy

Stateless, no personal data. Dates are provisional placeholders carrying a forbehold (real fremdrift dates are unknown, recorded in INPUTS-NEEDED); factual FAQ answers cite their source and forward-looking answers are clearly marked as reservations.
