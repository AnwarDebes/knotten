# SPEC-35: Verification, honesty audit and deliverables

## Purpose

The experience is only trustworthy if it is verified and honest. This spec closes
the feature: each increment is verified in a real browser build, the honesty
contract is audited end to end, and the route carries the attribution and
real-vs-indicative framing an investor (and Forbrukertilsynet) would expect.

## Scope

- Per-increment verification: production build plus a headless browser pass over `/en/experience`, asserting the canvas renders, key labels are present, and there are no console or CSP errors.
- An honesty and attribution audit: the persistent indicative badge, the real-vs-indicative narrative, the Kartverket attribution, and the energy figures all present and correct; nothing real is overstated and nothing indicative is presented as fact.
- A note on the verification limits and the remaining polish, recorded honestly.

## Dependencies

- All of SPEC-27 to SPEC-34.

## Data

- No new data; this spec audits how the existing real and indicative data are presented.

## Acceptance criteria

- [x] Every shipped increment was verified against a production build with no console errors.
- [x] The route renders the canvas, the plot labels, the landmark markers and the sun control.
- [x] The honesty contract holds: indicative massing labelled, attribution shown, energy figures sourced and disclaimed.
- [x] A real foreground-browser walk is verified: in connected Chrome at 60 fps the player walks across the terrain with W and Shift, the day and season sun control re-lights the scene, and the console is clean. A polished walkthrough video remains an optional deliverable.
- [x] A baked poster and OpenGraph/Twitter image for the shell. A no-WebGL still gallery remains optional.

## Task checklist

- [x] Verify each increment with a production build and a headless browser pass.
- [x] Audit the indicative labelling, attribution and energy figures.
- [x] Record the verification limits and the remaining polish honestly.
- [x] Verify a real-browser walk once the extension is connected (done in connected Chrome at 60 fps).
- [x] Produce the baked poster and OpenGraph image (a no-WebGL still gallery remains optional).

## Guardrails

- Honesty: report what was verified and what was not, plainly.
- Attribution: "Hoydedata (c) Kartverket (CC BY 4.0)" stays visible in the world.

## Out of scope

- Load and penetration testing of the route; a managed analytics or uptime setup beyond the existing platform.
