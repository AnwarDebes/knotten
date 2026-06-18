# SPEC-03 completion note

## What was built

- The energy concept page (energikonseptet) is now a full interactive module in NO and EN, replacing the SPEC-02 shell.
- Eight energy elements as a data-driven list in the message catalogues (id, title, explainer, "slik fungerer det her" note, maturity tag, source), so they are editable later via the CMS-lite layer: solar, small-scale wind, ground-source heating, battery storage, the shared energy base (thermal/sand battery), the energy hub and sharing, EV as storage (V2G/V2H), and outage resilience.
- Each element shows an original line illustration, a plain-language explainer, a site-specific note, a maturity tag (proven, emerging, or concept) as a coloured badge, and its source.
- A plusskunde and energidelinng framing band that ties the elements together: self-consumed power is free of grid rent and levies, sharing is allowed within the same property up to 1 MW since 1 October 2023.
- Original SVG illustrations (no third-party IP), with a restrained opacity-only pulse that is disabled under prefers-reduced-motion.
- Every figure is framed as indicative with its source; the shared base and small-scale wind are tagged as concepts needing a study, V2G as emerging.

## Verification

- Local gate green: lint, type-check, format, 19 tests (added an EnergyIcon render test and a catalogue integrity and NO/EN parity test that also asserts no em dash anywhere), build, bundle budget.
- Structural a11y: axe on the prerendered page reports no violations; heading order is h1, h2, h2, h3.
- The page is server rendered with no client JavaScript, so it stays at the bilingual budget floor (137 KB, under the 142 KB ceiling).

## Notes

- The figures match docs/research (solar about 1000 to 1020 kWh/kWp per year, plusskunde and energidelinng rules, sand battery as a concept). Nothing is presented as proven that is not.
- The standalone calculators (SPEC-05), the 3D terrain (SPEC-04), and the live community dashboard (SPEC-13) are separate; this page explains the concept only.
