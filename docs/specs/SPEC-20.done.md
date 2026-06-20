# SPEC-20 completion note

## What was built

The "For kommune og partnere" section now earns institutional credibility: it presents the referanseprosjekt ambition and offers a self-serve download kit of the SPEC-25 deliverables, so a non-technical owner can hand stakeholders a coherent, professional concept without bespoke effort.

- **Stakeholder content** from the design system (concept summary, ambition and pillars), bilingual NO/EN.
- **Download kit** wired to the SPEC-25 deliverables via the generated manifest: the one-pager, the kommune/partner deck, the energy model and the concept documents, each listed with its format and size and served as a static, versioned file from `public/deliverables`. Norwegian-only documents are flagged.
- **Download analytics**: each download link carries the Plausible tagged-event class, so downloads are counted cookielessly with no extra code.

## Verification

- Local gate green: lint, type-check, format, tests (143), build, bundle budget (the page is 146.9 KB, within budget).
- Verified over HTTP: the kit renders on `/no/for-kommune-og-partnere` with the documents listed and the download-goal class present, and the PDF, XLSX and PPTX files download with the correct sizes.

## Honesty and privacy

Stateless, no login or gating, no personal data, no cookie banner (Plausible is cookieless). Every figure in the public copy and the documents is indicative, sourced and disclaimed, and the numbers are consistent across the site, the tools and the energy model. Unit/plot count and imagery remain honest placeholders recorded in INPUTS-NEEDED.
