# SPEC-14: Neighbourhood and amenities map (Livet her)

## Purpose

Buyers always ask "what is nearby?" before they ask about the house. For a small contractor selling an energy-smart coastal development at Rødberg, the surroundings (the sea, the Audna outlet, school and kindergarten, daily shopping, the road to Mandal and Kristiansand, turstier and Lindesnes fyr) are part of the product. An honest, accurate map turns "out in the countryside" into "15 minutes from everything," which is the real story and a credible lead-capture argument.

## Scope

An interactive MapLibre GL map rendered over OpenStreetMap data, centred on the site, with labelled points of interest and, for each, a drive distance and time. Points cover at minimum: barnehage, nærskole, dagligvare, Mandal sentrum, Kristiansand, sjøtilgang, turstier and Lindesnes fyr. The map is reachable from the Verktøy hub and from Tomtene/Område (SPEC-02). It pairs an HTML-first list of amenities (server-rendered, crawlable) with the interactive map layered on top.

## Dependencies

- SPEC-00 (engineering baseline, CI budget gate).
- SPEC-01 (design tokens, components, motion signature).
- SPEC-02 (IA, NO/EN catalogs, the page that hosts the map).
- SPEC-09 (CMS-lite: amenities are an editable, validated content collection).
- Grounded by the Phase 0 geodata note (OSM is ODbL; Norge i bilder is Geovekst-licensed, not open) and the location note (distances confirmed June 2026 from Vigeland).

## Data

- `amenities`: id, kategori, navn, koordinat (lat/lng), kjøreavstand_km, kjøretid_min, kilde, sist_verifisert, synlig. Editable via SPEC-09.
- Distances and times are precomputed and stored, not requested live, so the map ships zero third-party routing calls.
- PLACEHOLDER: the exact site coordinate and gnr/bnr are UNKNOWN. Published distances are indicative, currently anchored to Vigeland (nearest service centre); Rødberg/Snig sits a few km further south, so values are rounded up and labelled. Nærskole, signposted turstier and public båtutsett are not yet confirmed by the kommune and are flagged "bekreftes" until verified. Recorded in INPUTS-NEEDED.

## Acceptance criteria

- [ ] Real OSM map tiles and real amenity coordinates only; no invented places.
- [ ] Each amenity shows a distance and time, each labelled "ca." and indikativt, with source and verification date.
- [ ] Unverified items are visibly marked "bekreftes" and never presented as fact.
- [ ] No third-party trackers, cookies or routing beacons; tiles from a license-clean, privacy-respecting source with attribution.
- [ ] Fully usable on mobile and desktop; keyboard operable; WCAG 2.2 AA.
- [ ] Within the §8 performance budget; the map library is code-split out of the initial bundle.

## Task checklist

- [ ] Define the amenities schema and seed it from the verified location note.
- [ ] Stand up the MapLibre map, lazy-loaded on view, with OSM tiles and visible attribution.
- [ ] Render the HTML-first amenity list with distances/times before the map boots.
- [ ] Build category markers, popups and a list-to-map focus link, all keyboard reachable.
- [ ] Wire amenities to SPEC-09 editing with input validation.
- [ ] Add NO/EN strings and the indikativt/source/forbehold labels.
- [ ] Add unit and E2E coverage; confirm bundle, Lighthouse and axe gates.

## Guardrails

- Stateless; collects no personal data. No "email my results" path here; if added later it routes only through the consented SPEC-06 flow.
- Every distance and time is labelled an estimate, carries its source and verification date, and is not advice.
- No trackers, no cookies, no third-party calls beyond license-clean map tiles (OSM ODbL, attributed; Norge i bilder excluded as it is not openly licensed).
- §8 performance budget: initial route JS ≤ ~120 KB gzip with the map chunk excluded and lazy-loaded; LCP < 2.5 s, INP < 200 ms, CLS < 0.1; Lighthouse mobile ≥ 95.
- WCAG 2.2 AA: keyboard operable, visible focus, contrast, alt/labels, reduced-motion respected; the amenity list is the non-map fallback.

## Out of scope

- Live or per-route directions, traffic and public-transport routing.
- 3D terrain and per-plot sightlines (SPEC-04) and sun/daylight (SPEC-12).
- Walk/cycle isochrone polygons (drive distance and time only for v1).
- Inventing or embellishing amenities, ratings or opening hours.
