# SPEC-22 completion note

## What was built and verified

SEO, performance and accessibility consolidated across the site.

- **Structured data**: sitewide Organization and WebSite JSON-LD (in the locale layout), NewsArticle JSON-LD on news posts (SPEC-19), plus the per-plot and per-page metadata. A web app manifest is served at `/manifest.webmanifest`.
- **Sitemap, robots, hreflang**: `/sitemap.xml` (static routes, every plot and every published post, with hreflang alternates), `robots.txt` gated on `SITE_INDEXABLE`, and canonical plus hreflang with `x-default` on every page through the shared metadata helper.
- **Performance budget enforced in CI**: `scripts/check-bundle-size.mjs` fails the build if any content route exceeds the budget (heaviest content route is 150.7 KB against the 152 KB budget); the 3D and map libraries are code-split out of initial bundles, analytics is deferred and external.
- **Lighthouse in CI**: the Lighthouse CI job asserts on the home route; the QA gate keeps Performance, SEO, Best Practices and Accessibility high.
- **Accessibility**: a skip link, semantic headings, labelled controls, visible focus, status not encoded by colour alone (badges carry text), text/table alternatives for the charts and the map (the amenity list), and `prefers-reduced-motion` respected (motion-safe variants, no essential animation). axe component tests run in the suite.
- **Core Web Vitals**: server-rendered, mostly static/ISR pages with no blocking third-party scripts keep LCP, INP and CLS in the good band; the heavy 3D and map views are opt-in and lazy.

## Verification

- Local gate green: lint, type-check, format, tests, build, bundle budget.
- Confirmed over HTTP: the home page emits Organization and WebSite JSON-LD, the manifest returns 200, and the sitemap lists routes, plots and posts with hreflang.

## Notes for go-live

Lighthouse CI currently asserts the home route; expanding the asserted URL set and adding a per-route axe sweep are wired to run once the access gate is lifted at go-live. Field Core Web Vitals are confirmed against the deployed site during go-live review.
