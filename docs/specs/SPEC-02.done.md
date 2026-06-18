# SPEC-02 completion note

## What was built

- next-intl i18n: Norwegian default at /no, English at /en, with localised pathnames (for example /no/omradet and /en/the-area, /no/kontakt and /en/contact). Routing, navigation helpers, request config and the proxy/middleware are in src/i18n and src/middleware.ts. The app is restructured under src/app/[locale].
- The full public page set, each in NO and EN: Hjem, Visjon, Energikonseptet, Tomtene/Området, Robusthet, Bærekraft og standard, Verktøy (hub), Prospekt, Meld interesse, Aktuelt, For kommune og partnere, Kontakt, Personvern. Pages that depend on later specs are complete content shells with a "kommer" note.
- All copy lives in message catalogues (messages/no.json, messages/en.json), native Norwegian with full English parity. Verified figures (passivhus about 15 kWh/m2 per year, n50 = 0.6, solar about 1000 to 1020 kWh/kWp per year, NO2 context, strømstøtte and Norgespris through 2029, plusskunde and energidelinng) are framed as indicative. No plot count, price, size, date, or amenity is invented.
- The repeated Meld interesse call to action and the "hva skjer videre" (what happens next) block, the localised header and footer, and a locale switcher that stays on the current page.
- Per-page metadata, Open Graph and correct canonical plus hreflang alternates (no, en, x-default), each pointing at the localised path.
- The Verktøy hub lists the buyer-value tools as "kommer snart" cards; the Kontakt page shows the real contact; the Personvern page is the privacy policy (NO canonical, marked for legal review), shown without the lead CTA.

## Verification

- Local gate green: lint, type-check, format, 14 tests, build, bundle budget.
- Runtime smoke test: / redirects to /no; /no and /en render the right language; localised slugs resolve (/en/contact, /en/the-area) and the wrong-locale slug redirects (/en/kontakt to /en/contact); html lang is correct; canonical and hreflang alternates render with the localised paths.
- All 24 content routes (12 pages, two locales) are within the 142 KB bundle budget (137 KB each; the bilingual i18n client provider adds about 11 KB, documented in ADR-0011).

## Notes and follow-ups

- The "middleware" file convention prints a Next 16 deprecation notice (rename to "proxy"); it still works. Tracked for a later cleanup.
- Real copy should still be reviewed by a native marketer before go-live, and the privacy policy by a lawyer or DPO. Recorded in INPUTS-NEEDED and HANDOVER.
- The interactive modules these shells point to arrive in their specs: energy concept (SPEC-03), 3D terrain (SPEC-04), the tools (SPEC-05, 10 to 16), the interest form (SPEC-06), Aktuelt management (SPEC-19), the partner kit (SPEC-20).
- Final SEO and accessibility hardening and per-route budgets land in SPEC-22.
