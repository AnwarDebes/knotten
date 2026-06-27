# SPEC-27: Experience route shell, fallback and budget exemption

## Purpose

An investor who cannot travel to Rødberg should still be able to understand the
site. The flagship answer is an opt-in, first-person 3D walk of the real terrain
(SPEC-29 onward). This spec lays its foundation: a dedicated bilingual route, a
crawlable and accessible server shell that works with no WebGL, an auto-entering
client launcher that loads the heavy world as a separate chunk, and the
ADR-sanctioned budget exemption so the world can be rich without breaking the
rest of the site's performance contract.

## Scope

- Bilingual route `"/opplev"` (no) and `"/experience"` (en) in `src/i18n/routing.ts`, with message parity.
- Server shell `src/app/[locale]/opplev/page.tsx`: title, the real-vs-indicative narrative, Kartverket attribution, and the lead-to-interest CTA, all rendered without Three.js.
- A `"use client"` launcher (`experience-launcher.tsx`) that detects WebGL, auto-enters (no click required), and dynamically imports the world with `ssr: false` so `three` never ships in the shell bundle.
- A big, high-colour entry CTA (`experience-cta.tsx`) linked from the home page and `/omradet`, plus a footer entry.
- A no-WebGL fallback message so low-end and unsupported devices still get the narrative and the interest CTA.
- Budget exemption for the route in `scripts/check-bundle-size.mjs`; Lighthouse stays on the shell.

## Dependencies

- ADR-0010 (second opt-in heavy 3D scene) and ADR-0011 (budget exemption), amended for this feature.
- next-intl routing and the parity test; the existing capability-detection pattern from `plot-map.tsx`.

## Data

- No new personal data. The route reads the existing `plots`, `house-types` and `amenities` content and the public terrain assets.

## Acceptance criteria

- [x] `/no/opplev` and `/en/experience` resolve; message parity is green.
- [x] The shell renders with no WebGL and carries the honesty narrative and attribution.
- [x] The world loads only on entry, as a separate chunk, and auto-enters without a click.
- [x] A prominent, high-colour CTA links in from the home page and `/omradet`.
- [x] The route is exempt from the bundle budget; the shell still meets the content-route budget.

## Task checklist

- [x] Add the localized route and namespace; keep parity green.
- [x] Build the server shell, the launcher island and the no-WebGL fallback.
- [x] Add the entry CTA and wire it into the home page, `/omradet` and the footer.
- [x] Exempt the route in the bundle-size gate.

## Guardrails

- Honesty: the shell states plainly what is real (terrain, sun, distances, energy figures) and what is indicative (the homes), before entry.
- Privacy: the world is stateless and collects nothing; the only data path is the consented interest CTA.
- Performance: the exemption covers only the on-demand world chunk; the SSR shell stays within the content budget and Lighthouse thresholds.

## Out of scope

- The 3D world, controls, buildings, energy and loading choreography (SPEC-28 onward).
- A baked poster and still gallery for the shell (deferred; the live world plus narrative carry the route for now).
