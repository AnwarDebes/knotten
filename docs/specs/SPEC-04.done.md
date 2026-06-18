# SPEC-04 completion note

## What was built

The interactive 3D terrain and plot map (the showpiece), wired into the Området page in NO and EN.

- **Real terrain.** Built on real Kartverket elevation (national detailed terrain model, NHM_DTM, CC BY 4.0) for Snigsfjorden at Rødberg (about 58.047 N, 7.273 E): a 160x160 heightmap over a 2.96 km square, fetched by `scripts/fetch-terrain.mjs` into `public/terrain/heightmap.json`. The hillside (0 to 176 m) falling to the fjord reads clearly. Provenance and the "Hoydedata © Kartverket (CC BY 4.0)" attribution are shown in the UI.
- **React Three Fiber scene**, lazily loaded with React.lazy so Three.js is never in any initial bundle (verified: the Område page is about 148 KB, not the about 290 KB an eager import would cost). `frameloop="demand"`, capped DPR, OrbitControls, soft shadows.
- **Capability detection** (WebGL, prefers-reduced-motion, save-data, viewport width). The static fallback (a baked JPEG of the real terrain, 66 KB, plus the accessible plot list) is server-rendered as the HTML-first baseline; the 3D enhances it on capable clients.
- **Data-driven plots** (`src/content/plots.ts`): placeholder plots on the real hillside with sea views, each with a status (ledig/reservert/solgt). The count, boundaries, prices and views are clearly marked as illustrative and unknown until survey and zoning; editable later via the content layer.
- **Plot interaction**: click a marker or the list to select a plot, see its status and a sea-view sightline drawn from the plot toward the nearest water.
- **Sun-path toggle**: season (summer/winter) and time (morning/midday/evening) move the sun using suncalc at the site latitude, so the orientation-to-sun story is visible (reused later by SPEC-12).
- **Offline bake pipeline** (`scripts/bake-terrain.mjs`): renders the terrain with three.js in a headless browser to produce the static fallback image.

## Verification

- Local gate green: lint, type-check, format, 24 tests (added terrain logic and plot tests), build, bundle budget.
- The 3D was rendered and verified visually in the headless browser (a Tesla V100 plus Chromium with ANGLE/SwiftShader WebGL), in both NO and EN, including plot selection (sightline) and the sun controls changing the lighting (winter sun sits low).
- The Område SSR fallback (image plus plot list) is axe-clean; heading order is valid; the plots are in the server HTML.
- Three.js stays lazy: the Område initial bundle is 148 KB (content pages 148 KB under the 152 KB ceiling; the Område route budget is 165 KB). The 3D feature's shared-chunk cost and the budgets are documented in ADR-0011.

## Notes and placeholders

- The terrain covers the real Snigsfjord area, but the exact development boundary and plot positions are illustrative placeholders pending the survey (recorded in INPUTS-NEEDED).
- The surface uses a stylised material. A real Norge i bilder orthophoto is Geovekst-licensed (not open); using it needs a licence (OPEN-QUESTIONS #8), so the stylised material is the default.
- A first-person "se utsikten fra denne tomten" view is a possible later enhancement; the current sightline and per-plot selection convey the sea view honestly without exaggeration.
