# SPEC-04: Interactive 3D terrain and plot map (the showpiece)

## Purpose
This is the single hero moment that sells the headline asset. A small contractor cannot fly every prospect to Rødberg, so the platform must make the place felt: the hillside falling to the outlet of the Audna into Sniksfjorden, the sjøutsikt, and where each plot sits in relation to sun and sea. Built on real Kartverket terrain, it shows the asset honestly and demonstrates the energy thinking (orientation to sun, view as a designed quality) in one polished interaction. It earns the project's "referanseprosjekt" ambition without exaggeration.

## Scope
- One WebGL scene (the only heavy 3D on the platform), on real Kartverket Høydedata terrain: a decimated, LOD'd, Draco-compressed mesh of the hillside down to the fjord.
- Sea rendered so the sjøutsikt reads (sea-level plane is sufficient; topobathy optional).
- Material toggle: stylised baked material or Norge i bilder orthophoto.
- Plots fully data-driven (any count, size, position, status).
- Click or tap a plot: indicative info card plus its sea-view sightline (view cone toward the fjord; first-person "se utsikten fra denne tomten" preview where feasible).
- Sun-path toggle at the real latitude (about 58°N): morning/midday/evening and summer/winter, with soft shadows.
- Mandatory high-quality static fallback.

## Dependencies
- SPEC-00 (engineering baseline, CI budget gate, capability detection conventions).
- SPEC-01 (design tokens, motion signature, accessible components).
- SPEC-02 (Tomtene/Område page that hosts this, and the crawlable HTML plot content beneath the renderer).

## Data
- **Terrain:** Kartverket Høydedata DTM/DOM via Geonorge (open, commercial OK; CC BY 4.0; cite Kartverket). Ungraded/open data only (avoid graded near-shore bathymetry).
- **Orthophoto:** Norge i bilder (Geovekst-licensed, not open): used only under a confirmed licence, otherwise the stylised material ships as default.
- **Plots:** editable structured source (size m², orientation, position/coordinates, gnr/bnr, status, indicative price). Placeholders until survey data: count is UNKNOWN, nothing hardcoded. Gap recorded in INPUTS-NEEDED.
- **Sun:** computed from latitude/date/time (suncalc or equivalent); method cited.

## Acceptance criteria
- [ ] On capable desktop, loads only after content paints; runs smoothly (target 60 fps, never below about 30 on a mid-range laptop).
- [ ] Usable on touch and mouse.
- [ ] Plots, count and sightlines 100% data-driven; new plot data drops in with no code change.
- [ ] Sun-path toggle and per-plot sea-view sightline both work.
- [ ] Terrain provenance documented; Kartverket cited; orthophoto used only if licensed.
- [ ] Static fallback verified on a real mid-range Android and hits the SPEC-22 Lighthouse target.
- [ ] 3D chunk not in the initial bundle; no trackers.
- [ ] Placeholders and forbehold marked; views labelled illustrative.

## Task checklist
1. Acquire and decimate terrain; build LOD tiers; Draco-compress; bake stylised material; (conditionally) prepare KTX2 orthophoto.
2. Implement lazy-loaded R3F Canvas (dynamic import, Suspense skeleton, never blocks LCP) per §3.4: capability detection, frameloop "demand", offscreen/hidden-tab pause, DPR cap, geometry reuse/instancing, dispose on unmount.
3. Load plots from the editable source; render data-driven markers and selection.
4. Build plot info card, sea-view sightline cone, and the first-person view preview.
5. Implement sun-path toggle (real latitude, season/time) with soft shadows; expose orientation story (links to SPEC-12).
6. Build the static fallback: baked terrain render, labelled plots, per-plot static sightline images.
7. Add DOM text alternatives and @react-three/a11y; keyboard operability.
8. Profile (r3f-perf/stats-gl) and run a mobile Lighthouse pass; document terrain provenance and forbehold.

## Guardrails
- Buyer-value interactions here are stateless and collect no personal data; any "email this view" routes only through the consented lead flow (SPEC-06).
- Every indicative figure (size, price, view) is labelled an estimate, sourced, and disclaimed; sightlines are illustrative and must not be exaggerated; not engineering advice.
- Performance budget (§8): initial route JS under about 120 KB gzip excluding the lazy 3D chunk; Three.js never in the initial bundle; LCP under 2.5 s, INP under 200 ms, CLS under 0.1; the heavy-3D page may sit slightly lower only if its static-fallback variant scores at least 95. The budget wins over the wow.
- Accessibility: WCAG 2.2 AA (keyboard, focus, contrast, reduced-motion); the static fallback is the accessible baseline.

## Out of scope
- House placement and the configurator (SPEC-16).
- Full year-round per-plot sun analysis (SPEC-12, reuses this sun engine).
- Neighbourhood and amenities map (SPEC-14).
- Per-plot deep-link pages (SPEC-18).
- A second heavy 3D scene anywhere on the platform.
