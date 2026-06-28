# SPEC-29: Core 3D world and first-person controls

## Purpose

Turn the real terrain into a place a visitor can walk. This spec builds the
first-person world at true 1:1 metre scale, with real eye height, real walking
speed, the real sun for 58 degrees north, sea, sky and a heads-up readout, so the
landscape and the distances are experienced honestly rather than described.

## Scope

- `experience-world.tsx`: terrain mesh from the heightmap with slope and elevation shading, a sea plane, drei `<Sky>` and a directional sun from the real `sunDirection` helper.
- First person at eye height 1.7 m and walking speed 1.4 m/s (with a sprint), drei `PointerLockControls` plus WASD and arrow keys, terrain-follow each frame so the camera stays on the ground.
- A day and season sun control: the directional light and sky update to the real sun position for the site, with warmer light morning and evening and a dimmer low winter sun.
- A you-are-here HUD: live elevation, the energy note, attribution, and a persistent indicative badge.
- Stable Canvas configuration and a continuous frame loop so the per-frame HUD update never resets the walker and the scene animates smoothly.

## Dependencies

- SPEC-27 (route, launcher) and SPEC-28 (terrain and vegetation assets).
- Reused terrain helpers: `elevationAt`, `bearingToSea`, `sunDirection`, and the `SunSeason`/`SunTime` types.

## Data

- The real heightmap, the real sun for 58.047, 7.273, and the NN2000 sea datum.

## Acceptance criteria

- [x] The terrain renders at metre scale with natural shading and a sea plane.
- [x] A visitor walks in first person at real eye height and speed, staying on the terrain.
- [x] The season and time-of-day control re-lights the scene with the real sun.
- [x] The HUD shows live elevation, attribution and the indicative badge with no console errors.
- [x] The frame loop is continuous and the camera is not reset by HUD updates.

## Task checklist

- [x] Build terrain, sea, sky and the real sun.
- [x] Implement pointer-lock plus keyboard movement with terrain-follow.
- [x] Add the day and season sun control.
- [x] Fix the Canvas prop identity and frame loop so movement persists.

## Guardrails

- Honesty: per-plot sun and view are shown as the real solar geometry, never stated as a guaranteed outcome; the homes remain indicative.
- Accessibility: keyboard movement is supported; reduced-motion toning of decorative animation and a guided still alternative are tracked for a later pass.
- Performance: instanced vegetation and a single terrain mesh keep draw calls low.

## Update: third-person investor and free camera

At the owner's direction the controls evolved from first person to a GTA-style
third-person investor. The terrain, sun control, HUD and frame-loop fix above
still hold; the camera and the avatar changed.

- A visible investor avatar (dark suit, carrying a briefcase) walks the terrain
  in third person, turning to face the way it moves, with an animated walk cycle.
- A custom orbit camera replaces PointerLockControls: the yaw is an unbounded
  accumulator, so it spins a full smooth 360 with no snap at any angle, and the
  pitch sweeps from the sky down to nearly overhead. Look by dragging or by
  clicking to capture the mouse.
- Space and C rise and descend for an overhead survey; a speed control (1x, 2x,
  3x) sets the pace; Shift still sprints.
- An orientation minimap shows the plots and the investor's live position.
- Reduced motion is respected (the energy animation holds still).

All verified in a real foreground browser: walking, the 360 spin, the sky and
overhead look, fly-up, the speed control and the minimap, with a clean console.

## Out of scope (still tracked for later)

- Capsule collision against the buildings, on-screen touch joysticks for phones,
  and a scripted cinematic intro flyover.
