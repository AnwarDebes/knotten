# SPEC-02: Marketing site information architecture and content (NO/EN)

## Purpose
This is a small groundwork contractor's first website, and its job is credibility and interest capture, not transactional sales. The site has to make Sigve Simonsen AS look serious enough that Lindesnes kommune, partners and prospective buyers take an energy-smart coastal development at Rødberg seriously, and it has to do so before the zoning plan exists and before any real photography is available. A clear information architecture, native-quality bilingual copy and a single repeated call to action (Meld interesse) turn that credibility into measurable leads.

## Scope
The full public page set, each in NO (default) and EN with correct hreflang: Hjem, Visjon/Hvorfor Knotten, Energikonseptet, Tomtene/Område, Robusthet, Bærekraft og standard, Verktøy (hub), Prospekt, Meld interesse, Aktuelt, For kommune og partnere, Kontakt, Personvern. Includes navigation, footer, the Meld interesse CTA pattern, shared SEO metadata and the message catalogues. Pages that depend on later specs (Energikonseptet, Tomtene/Område, Verktøy, Meld interesse, Aktuelt, For kommune og partnere) are built as complete content shells that those specs fill in.

## Dependencies
- SPEC-00 (foundation, i18n with next-intl, CI and budget gates).
- SPEC-01 (brand, design tokens, accessible components, motion signature).

## Data
Copy lives in the next-intl message catalogues (no/en), not hardcoded. Data-driven inputs against marked placeholders: plot count and plot data (UNKNOWN; never assume "8", which was internship positions), indicative prices and status, real site photography and drone footage (none exists; honest placeholders and abstract coastal art with documented swap slots), the fremdrift dates, and the data controller identity for Personvern. Indicative figures used in copy (passivhus net heating about 15 kWh/m2 per year, n50 = 0.6, solar about 1000-1020 kWh/kWp per year at the site, NO2 price context, strømstøtte and Norgespris terms) are labelled estimates with source and disclaimer. All gaps are recorded in docs/INPUTS-NEEDED.md.

## Acceptance criteria
- [ ] Every listed page renders in both NO and EN with correct hreflang and a NO default.
- [ ] A clear, unbundled Meld interesse CTA appears naturally on every relevant page and is never buried.
- [ ] Lighthouse SEO at least 95 on every content page.
- [ ] Layout is flawless on mobile and desktop; CLS is zero.
- [ ] Norwegian copy reads as native; EN is full parity, not a thin translation.
- [ ] Every public estimate is labelled, sourced and disclaimed; every placeholder is marked and listed in INPUTS-NEEDED.

## Task checklist
- [ ] Define the route tree, primary navigation and footer for both locales.
- [ ] Write native-quality NO copy for all pages using authentic new-build vocabulary (beliggenhet, tomter, prospekt, fremdrift, standard, energiløsninger); reserve salgsstart/visning for the future phase.
- [ ] Produce full EN parity copy.
- [ ] Build the reusable Meld interesse CTA and the "hva skjer videre" block, placed per page.
- [ ] Wire content shells to the placeholder data layer (plots, prices, images, fremdrift, controller identity).
- [ ] Add per-page metadata, Open Graph and hreflang; add forbehold and AI/illustration disclosure where imagery appears.
- [ ] Verify Lighthouse SEO, zero CLS, and mobile/desktop layout.

## Guardrails
- Buyer-value tools linked from the Verktøy hub stay stateless and collect no personal data; any "email my results" routes only through the consented Meld interesse flow.
- Every estimate in copy is labelled indikativt estimat, shows its source, and carries the relevant disclaimer (ikke et tilbud, krever profesjonell verifikasjon where applicable); placeholder imagery carries standard forbehold and discloses any AI or illustration use.
- Performance budget: initial route JS at most about 120 KB gzip, LCP under 2.5 s, INP under 200 ms, CLS under 0.1, Lighthouse mobile at least 95 on content pages.
- WCAG 2.2 AA: semantic HTML, keyboard operability, visible focus, AA contrast, alt text, reduced-motion fallbacks.
- Plausible (EU, cookieless) analytics only; no cookie banner; no tracking pixels; any email and data stays in the EU/EEA.

## Out of scope
The interactive energy module (SPEC-03), the 3D terrain and plot map (SPEC-04), the calculators and tools themselves (SPEC-05, 10-16), the interest-capture backend and consent engine (SPEC-06), the admin and CMS-lite editing layer (SPEC-07, 09), analytics integration (SPEC-08), Aktuelt post management (SPEC-19), the downloadable partner kit (SPEC-20), and final SEO/performance/accessibility hardening (SPEC-22). This spec delivers the IA, copy and content shells that those specs build into.
