# SPEC-14 completion note

## What was built

"Livet her", a neighbourhood and amenities view that answers the first question every buyer asks: what is nearby? It pairs a server-rendered amenity list with an interactive map, honestly and accurately.

- **Amenities dataset**: real places only, from the verified location note (groceries, kindergarten, primary school, Mandal, Kristiansand, Lindesnes fyr, sea access, walking trails), each with a drive distance and time, a source and a verification month. Items the municipality has not confirmed (which school is the nærskole, public sea access and signposted trails) are flagged "bekreftes" and never stated as fact.
- **HTML-first list**: server-rendered and crawlable, the accessible non-map fallback, with each distance labelled "ca." and a note that values are measured from Vigeland (about 4 km north) so a few minutes should be added.
- **Interactive map**: MapLibre GL over OpenStreetMap raster tiles (ODbL, attributed), loaded on demand when the visitor opens it, so the library is code-split out of the initial route bundle and there are no third-party routing or tracking calls. The tile source is configurable via `NEXT_PUBLIC_MAP_TILE_URL`. Markers carry the same distance and bekreftes information as the list.

## Verification

- Local gate green: lint, type-check, format, tests (123), build, bundle budget. The map library is lazy and excluded from the route bundle, which stays at 146.9 KB; `pnpm audit --audit-level=high` is clean.
- Unit tests (5): unique ids, every amenity within a sane bounding box around the site, a source and verification month on each, distance and drive time set or absent together, and at least one item flagged to-be-confirmed.
- Browser smoke test (headless Chromium) in NO and EN: the amenity list is server-rendered with distances labelled "ca." and the bekreftes flag and OSM attribution present, the map mounts on demand after the button click, and there are no page errors.

## Honesty and privacy

Stateless, no personal data, no trackers or cookies. Distances and times are indicative router values anchored to Vigeland, labelled "ca." with source and verification date; unverified items are marked bekreftes. Map tiles are OSM (ODbL) with attribution; Norge i bilder is excluded as it is not openly licensed. The exact site coordinate and the confirmations are recorded in INPUTS-NEEDED.
