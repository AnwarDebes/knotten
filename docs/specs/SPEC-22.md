# SPEC-22: SEO, performance and accessibility (WCAG 2.2 AA)

## Purpose

A small contractor selling an energy-smart coastal development at Rødberg competes against larger developers without a marketing department. Discoverability, speed and accessibility are the cheapest competitive edge available: a page that ranks, loads in under a second on a mid-range phone and works for every visitor converts more interest into leads at no added running cost. This spec finalises the cross-cutting concerns that earlier specs applied continuously, turning SEO, Core Web Vitals and WCAG 2.2 AA into enforced, measured gates rather than good intentions.

## Scope

- Semantic HTML and a correct document outline on every route.
- Per-page metadata, Open Graph and Twitter cards, canonical URLs, and JSON-LD structured data (Organization, Place, Product for tomter/hustyper, Article for Aktuelt).
- `sitemap.xml` and `robots.txt`, generated from the route table and NO/EN catalogues.
- Correct `hreflang` (NO default, EN alternate, `x-default`) across all localised pages.
- Image optimisation (responsive `next/image`, AVIF/WebP, explicit dimensions) and font optimisation (self-hosted, subset, `font-display: swap`, preload).
- Core Web Vitals tuned to green; the §8 performance budget enforced in CI.
- WCAG 2.2 AA verified with axe plus a documented manual keyboard pass.
- Optional installable PWA (manifest, offline shell) if it does not threaten the budget.

## Dependencies

- SPEC-00: CI quality gate, Lighthouse CI and the bundle-size check this spec hardens.
- SPEC-01: accessible components, focus ring, motion signature, labelled-estimate and disclaimer primitives.
- SPEC-02: route table, NO/EN catalogues, base metadata, Open Graph and `hreflang` scaffolding this spec completes and enforces.
- All feature specs (SPEC-03 onward): their pages are the surfaces audited; heavy modules (SPEC-04, 12, 14) keep their static fallbacks within budget.

## Data

- No client or personal data. Inputs are the route table, NO/EN strings and structured-data templates.
- Structured data is filled from the data-driven plot/content sources; absent client facts stay as marked placeholders in `INPUTS-NEEDED.md` (plot count, gnr/bnr, prices, real photography, final domain). Organization JSON-LD uses the data-controller identity once supplied; until then a clearly marked placeholder.
- Social and PWA imagery are honest placeholders (no real site photography exists yet), labelled as illustrations.

## Acceptance criteria

- [ ] Lighthouse mobile Performance, SEO, Best Practices and Accessibility all at least 95 on content pages.
- [ ] axe reports zero serious or critical issues across all routes (NO and EN).
- [ ] Full keyboard operability: logical order, visible focus, skip link, no traps; recorded manual pass.
- [ ] Field-realistic Core Web Vitals in the good band: LCP < 2.5 s, INP < 200 ms, CLS < 0.1.
- [ ] Valid JSON-LD (Organization, Place, Product, Article), `sitemap.xml`, `robots.txt` and correct `hreflang` with `x-default`.
- [ ] The §8 performance budget is enforced in CI and fails the build on regression.

## Task checklist

- [ ] Audit and correct semantic structure, headings and landmarks on every route.
- [ ] Complete per-page metadata, Open Graph/Twitter, canonicals and JSON-LD templates.
- [ ] Generate `sitemap.xml` and `robots.txt` from the route table; wire `hreflang` and `x-default`.
- [ ] Optimise images (responsive, AVIF/WebP, fixed dimensions) and fonts (subset, self-host, preload).
- [ ] Tune LCP/INP/CLS; defer non-critical JS; keep heavy modules code-split.
- [ ] Add axe to CI; run and document the manual keyboard pass; add `web-vitals` reporting via Plausible custom events.
- [ ] Wire the bundle-size and Lighthouse CI budgets as hard gates; add an optional PWA manifest if within budget.

## Guardrails

- Buyer-value tools audited here stay stateless and store no personal data; structured data exposes only public, non-personal facts.
- Every estimate on every page remains labelled an _indikativt estimat_, sourced and carrying _"ikke profesjonell rådgivning"_; SEO and structured data never restate an estimate as fact.
- §8 performance budget: initial route JS at most about 120 KB gzip, LCP < 2.5 s, INP < 200 ms, CLS < 0.1, Lighthouse mobile at least 95 on content pages; enforced in CI.
- WCAG 2.2 AA throughout: keyboard operability, visible focus, contrast, text alternatives, `prefers-reduced-motion`.
- Analytics is Plausible (EU, cookieless): no cookie banner, no tracking pixels; any data stays in the EU/EEA.

## Out of scope

- Paid search, backlinks and off-site SEO campaigns.
- New page content or features (owned by SPEC-02 and the feature specs).
- Final brand assets, real photography, prices and the production domain (client-supplied).
- Full WCAG 2.2 AAA and a third-party accessibility audit (AA is the target).
