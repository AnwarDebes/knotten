# SPEC-18 completion note

## What was built

A stable, shareable, indexable page for every plot, so an informal "look at this one" link lands on a specific tomt with its context and a pre-scoped interest CTA.

- **Canonical per-plot route** `/tomt/[code]` (EN `/plot/[code]`), generated from the data-driven plot source with a stable slug from the plot code (never an array index), with correct canonical and hreflang alternates per locale.
- **Per-plot content**: status badge, plot specs (size, orientation, indicative price or "pris på forespørsel"), and a server-computed sun summary (June versus December direct-sun hours from the real Kartverket terrain), with links to the 3D terrain and the sun tool.
- **Live status and price**: read from the content layer, matched to the plot by label, so an admin edit drives the page (ISR); placeholders until then.
- **Pre-scoped CTA**: the Meld interesse button opens the SPEC-06 form with the plot reference pre-filled (`?tomt=A1`), shown as a banner, and the lead's source records the plot.
- **SEO**: server-rendered, per-plot Open Graph metadata, and a sitemap (`/sitemap.xml`) with an entry per plot and per static route, each with hreflang alternates.

## Verification

- Local gate green: lint, type-check, format, tests (138), build, bundle budget (each plot page is 146.9 KB, server-rendered). Per-plot pages prerender for every plot in both locales.
- Server-rendered output verified via curl: `/no/tomt/a1` and `/en/plot/a1` render the title, specs, sun summary and pre-scoped CTA; the Open Graph title is present; `/sitemap.xml` contains the NO and EN plot URLs; and `/no/meld-interesse?tomt=A1` shows the prefill banner and records the plot as the lead source.
- A typed `StaticPathname` was introduced so the metadata helper, navigation and locale switcher stay type-safe now that a dynamic route exists.

## Honesty and privacy

Stateless, no personal data. Status and indicative price come from the content layer; everything is labelled indicative with a forbehold, and plot boundaries, area, price and exact position are confirmed after survey and zoning (placeholders recorded in INPUTS-NEEDED). No real site photography exists, so no per-plot share photo is fabricated.
