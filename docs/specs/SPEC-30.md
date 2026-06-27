# SPEC-30: Smart loading and progressive reveal

## Purpose

The world must not bore the visitor while it loads, and it must not block on the
heaviest assets. This spec makes loading itself part of the experience and reveals
the world progressively, so the visitor is looking at real terrain within seconds
and the detail fills in around them.

## Scope

- A staged loader in `experience-launcher.tsx` whose status lines are wired to the real load promises (capability check, terrain fetch, world import), not a fake timer.
- Progressive reveal: a coarse heightmap renders first for an interactive scene within seconds, then the high-resolution terrain swaps in under the same extent without moving the walker.
- The real forest streams in after the terrain (it is the heaviest extra) and appears once ready.

## Dependencies

- SPEC-27 (launcher and dynamic import) and SPEC-28 (coarse and high-resolution assets).

## Data

- The coarse `public/terrain/heightmap.json` and the high-resolution `public/experience/terrain-hi.json`, plus `trees.json`.

## Acceptance criteria

- [x] The loader shows real, staged progress tied to actual load promises.
- [x] A coarse terrain is interactive quickly, then refines to high resolution in place.
- [x] The forest streams in after the terrain without blocking entry.

## Task checklist

- [x] Wire the staged loader to the real promises.
- [x] Implement the coarse-to-high-resolution terrain swap keeping the walker in place.
- [x] Stream the vegetation after the terrain.

## Guardrails

- Honesty: loader copy names the real sources ("terrain from Kartverket"), not marketing filler.
- Performance: the coarse tier keeps time-to-interactive low; the high-resolution swap is seamless.

## Out of scope (tracked for later)

- A skippable cinematic intro flyover along a spline from above the fjord to eye level; respect reduced-motion when added.
