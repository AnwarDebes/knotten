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
- [ ] A real foreground-browser walkthrough is captured (blocked in the current environment: the headless and background test browsers throttle requestAnimationFrame and the Chrome extension is not connected; the movement logic is proven per-frame and the frame loop is forced to always).
- [ ] Baked poster, OG image and a no-WebGL still gallery for the shell.

## Task checklist

- [x] Verify each increment with a production build and a headless browser pass.
- [x] Audit the indicative labelling, attribution and energy figures.
- [x] Record the verification limits and the remaining polish honestly.
- [ ] Capture a real-browser walkthrough once a foreground browser or the extension is available.
- [ ] Produce the baked poster and still gallery deliverables.

## Guardrails

- Honesty: report what was verified and what was not, plainly; do not claim a moving walkthrough was captured when the environment prevented it.
- Attribution: "Hoydedata (c) Kartverket (CC BY 4.0)" stays visible in the world.

## Out of scope

- Load and penetration testing of the route; a managed analytics or uptime setup beyond the existing platform.
