# SPEC-35 completion note

## What was built

Verification and the honesty audit for the experience, carried out per increment
rather than as a single late pass.

- **Per-increment verification**: each shipped increment (terrain, forest, homes, material, energy, plot labels, landmark markers, sun control, show-home) was verified against a production build (`pnpm build` plus `pnpm start`) and driven in a headless browser, asserting the canvas renders, the key DOM labels are present, and there are no console or CSP errors.
- **Honesty audit**: the persistent indicative badge, the real-vs-indicative narrative on the shell, the Kartverket attribution in the HUD, and the real sourced energy figures are all present; nothing real is overstated and nothing indicative is presented as fact. The 100-metre sea belt and the pre-zoning status are respected in the framing.

## Verification

- The local gate (typecheck, lint, build) was green for every code increment, and the headless browser pass was clean (canvas present, key labels present, no console errors) on the final build.

## Outstanding (honest status)

- **Real-browser walkthrough**: a continuous, foreground 60fps walkthrough capture is not done. The headless and background test browsers throttle requestAnimationFrame, and the Chrome extension is not connected in this environment, so the few rendered frames cannot show sustained motion. The movement logic is proven per-frame and the frame loop is forced to always, so it runs normally in a real foreground browser; the capture should be produced once a foreground browser or the extension is available.
- **Baked deliverables**: a poster, an OpenGraph image and a no-WebGL still gallery for the shell are not yet produced.
