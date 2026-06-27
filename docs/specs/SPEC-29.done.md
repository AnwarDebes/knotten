# SPEC-29 completion note

## What was built

The first-person world at true 1:1 metre scale: the real terrain made walkable,
under the real sun.

- **World**: `experience-world.tsx` builds the terrain mesh with slope and elevation shading, a sea plane, drei `<Sky>` and a directional sun from the real `sunDirection` helper.
- **Controls**: drei `PointerLockControls` plus WASD and arrow keys, eye height 1.7 m, walk 1.4 m/s with a sprint, terrain-follow each frame.
- **Sun control**: a season and time-of-day control that re-lights the scene with the real sun position for 58 degrees north, warmer morning and evening, dimmer low winter sun.
- **HUD**: live elevation, the energy note, attribution and a persistent indicative badge.
- **Frame-loop fix**: the Canvas camera, gl and dpr props were inline object literals recreated on every HUD re-render, which made R3F reset the camera and froze the walker; pinned them to stable references and set `frameloop="always"`, so movement persists and the scene animates continuously.

## Verification

- Local gate green: typecheck, lint, build.
- Production build driven headlessly: the terrain, sea, sky, sun and HUD render; the sun control re-lights the scene (summer midday bright, winter dimmer); no console errors. The movement logic was confirmed per-frame (key down advances the camera, placement runs once); a continuous 60fps walkthrough could not be captured because the headless and background test browsers throttle requestAnimationFrame.

## Deferred (documented)

Capsule collision, a click-to-teleport minimap, on-screen touch joysticks, a first-person/orbit cinematic toggle, and reduced-motion toning of decorative animation are tracked for later passes.
