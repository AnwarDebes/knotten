# SPEC-30 completion note

## What was built

Loading made part of the experience, and a world that reveals itself
progressively rather than blocking on the heaviest assets.

- **Staged loader**: `experience-launcher.tsx` shows status lines wired to the real load promises (capability check, terrain fetch, world import), not a fake timer.
- **Progressive reveal**: a coarse heightmap renders first for an interactive scene within seconds, then the high-resolution terrain swaps in under the same extent without moving the walker.
- **Streamed forest**: the real vegetation (the heaviest extra) streams in after the terrain and appears once ready.

## Verification

- Production build served and driven headlessly: the loader shows staged progress, the coarse terrain is interactive quickly, the high-resolution swap is seamless, and the forest appears after the terrain; no console errors.

## Deferred (documented)

A skippable cinematic intro flyover along a spline from above the fjord to eye level is tracked for a later pass; it must respect reduced-motion when added.
