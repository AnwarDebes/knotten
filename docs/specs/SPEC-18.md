# SPEC-18: Shareable per-plot deep-link pages

## Purpose

A small groundwork contractor selling an energy-smart coastal development at Rødberg has no sales staff and no showroom: word of mouth is the channel. When a prospective buyer wants to send "look at this one" to a partner over SMS, Messenger or e-post, that link has to land on a specific tomt, not the front page. This spec gives every plot its own stable, indexable URL that shows the plot in context (its 3D or static view, sun, sightline, specs, indicative price and status) and a Meld interesse CTA already scoped to that plot. It turns informal sharing into traceable interest and makes the development legible to Lindesnes kommune and partners before salgsstart.

## Scope

- A canonical per-plot route, NO default with EN parity and correct hreflang, addressed by the data-driven plot identifier from SPEC-04.
- Per-plot content: the SPEC-04 3D/static plot view, the SPEC-12 sun summary, sightline/orientation, plot specs (areal, orientation, standard), and indicative price plus status from the content layer.
- A Meld interesse CTA pre-scoped to the plot (the SPEC-06 form opens with the plot reference pre-filled).
- Rich Open Graph and Twitter Card previews per plot (title, summary, per-plot share image) for SMS and social.
- Server-rendered, SEO-indexable pages with a sitemap entry per plot.
- Cross-links into the per-plot views of the buyer-value tools (SPEC-10, 12, 15).

## Dependencies

- SPEC-00 / SPEC-01: engineering baseline, i18n, design tokens and accessible components.
- SPEC-02: route tree, navigation, the Meld interesse CTA pattern and shared SEO/OG metadata.
- SPEC-04: the data-driven plot source, identifiers and 3D/static plot view (reused, not duplicated).
- SPEC-06: the consented Meld interesse flow that the pre-scoped CTA opens.
- SPEC-09: the admin-editable content layer that supplies live status and indicative price.
- SPEC-12: the per-plot sun summary embedded on the page.

## Data

- Plot identifier and geometry: data-driven from the SPEC-04 source; the slug is derived from a stable plot id, never an array index. Plot count, coordinates and orientation are UNKNOWN; use marked placeholders recorded in `docs/INPUTS-NEEDED.md` so real survey and matrikkel data (gnr/bnr) drop in without code changes.
- Status and indicative price: read from the SPEC-09 content layer (status enum, indicative price or "pris på forespørsel"); never hardcoded.
- OG share image: per-plot, generated from the plot view or a labelled abstract placeholder; no real site photography exists yet, so honest placeholders only, with AI/illustration disclosure.
- No personal data of any kind.

## Acceptance criteria

- [ ] Every plot has a stable, canonical shareable URL, NO and EN, with correct hreflang.
- [ ] The page shows the plot view, sun summary, sightline, specs, and indicative price plus status from the content layer.
- [ ] OG and Twitter Card previews render correctly for that plot in SMS and social unfurls.
- [ ] Status and price reflect the SPEC-09 content layer live; nothing is hardcoded.
- [ ] Pages are server-rendered and SEO-indexable, with a per-plot sitemap entry.
- [ ] The Meld interesse CTA opens the SPEC-06 form pre-filled with that plot's reference.
- [ ] Every public estimate is labelled indikativt estimat, sourced and disclaimed; placeholders are marked.
- [ ] Within the performance budget; WCAG 2.2 AA met.

## Task checklist

1. Add the canonical per-plot route, deriving slugs from stable SPEC-04 plot ids; wire hreflang and a redirect for legacy or invalid slugs.
2. Compose the page from the SPEC-04 plot view (lazy-loaded, static fallback), the SPEC-12 sun summary, sightline and specs.
3. Read status and indicative price from the SPEC-09 content layer; show "pris på forespørsel" and an explicit status when data is absent.
4. Pre-scope the Meld interesse CTA to pass the plot reference into the SPEC-06 form.
5. Generate per-plot OG/Twitter metadata and a per-plot share image (or labelled placeholder); validate unfurls.
6. Emit per-plot sitemap entries and canonical tags; confirm indexability.
7. Add NO/EN copy, the estimate disclaimer and AI/illustration disclosure; record placeholders in INPUTS-NEEDED.
8. Tests: unit (slug mapping, metadata, status/price binding), E2E (deep link, fallback, pre-filled CTA); Lighthouse, bundle-budget and axe checks; update PROGRESS and the DONE note.

## Guardrails

- Privacy: the page is stateless and collects no personal data; the only personal-data path is the consented SPEC-06 Meld interesse flow, which the CTA opens. Plausible (EU, cookieless) analytics only; no cookie banner; no tracking pixels in any OG asset.
- Honesty: indicative price, sun hours and any energy figures are labelled indikativt estimat, show their source, and carry "ikke et tilbud, krever profesjonell verifikasjon"; status reflects the content layer truthfully; share imagery is a labelled placeholder with AI/illustration disclosure, never passed off as real photography.
- Performance: within the §8 budget (initial route JS at most about 120 KB gzip; the 3D view never in the initial bundle and gated by device capability; LCP under 2.5 s, INP under 200 ms, CLS under 0.1; Lighthouse mobile at least 95, with the static fallback meeting the budget where the live view cannot).
- Accessibility: WCAG 2.2 AA, with semantic headings, keyboard operability, visible focus, AA contrast, text/data alternatives to the plot view, and a prefers-reduced-motion fallback.

## Out of scope

- The 3D engine, sun engine and tool calculators themselves (SPEC-04, 05, 10, 12, 15); this spec composes and deep-links them.
- The Meld interesse backend, consent engine and lead management (SPEC-06, 07).
- Editing plot status, price or content (SPEC-09 owns the editing layer).
- Online reservation, booking, payment or any transactional sales flow.
- A printable per-plot prospekt PDF and the partner kit (SPEC-20).
