# SPEC-35 completion note

## What was built

Verification and the honesty audit for the experience, carried out per increment
rather than as a single late pass.

- **Per-increment verification**: each shipped increment (terrain, forest, homes, material, energy, plot labels, landmark markers, sun control, show-home) was verified against a production build (`pnpm build` plus `pnpm start`) and driven in a headless browser, asserting the canvas renders, the key DOM labels are present, and there are no console or CSP errors.
- **Honesty audit**: the persistent indicative badge, the real-vs-indicative narrative on the shell, the Kartverket attribution in the HUD, and the real sourced energy figures are all present; nothing real is overstated and nothing indicative is presented as fact. The 100-metre sea belt and the pre-zoning status are respected in the framing.

## Verification

- The local gate (typecheck, lint, build) was green for every code increment, and the headless browser pass was clean (canvas present, key labels present, no console errors) on the final build.
- **Real-browser walk confirmed**: once the Chrome extension was connected, the route was driven in real foreground Chrome at 60 fps. Holding W and Shift walked the player forward across the terrain (the show-home and the foreground tree the camera started beside moved out of frame after a few seconds), the day and season sun control re-lit the scene to a darker winter evening, the plot and landmark labels rendered, and the console was clean. This resolves the earlier limit, where the headless and background test browsers throttled requestAnimationFrame so sustained motion could not be shown.

## Outstanding (optional polish)

- A polished walkthrough video or GIF, and a no-WebGL still gallery for the shell, are not produced; the social poster and OpenGraph image are done.
