# ADR-0011: Performance budget enforced in CI

## Status

Accepted, 2026-06-18

## Context

Performance on this project is a pass/fail feature, not a finishing polish applied at the end. The site presents data-driven content about Rødberg at Sniksfjorden (Lindesnes kommune, Agder), including interactive and occasionally 3D-heavy views, and the target audience reaches it largely over mobile networks. A page that renders impressive visuals but loads slowly, shifts layout under a reader's thumb, or stutters during interaction fails the people it is meant to serve.

The budget wins over the wow. When a visual ambition and a performance limit conflict, the limit holds and the ambition is reshaped to fit it (lazy loading, a static fallback, or removal). This is a deliberate ordering of priorities, recorded here so it is not relitigated per feature.

Without an enforced budget, regressions are invisible until they accumulate. Bundle sizes creep up one dependency at a time, a heavy library lands in the initial route by accident, and Core Web Vitals drift below threshold long before anyone notices on a real device. Human review does not reliably catch a 15 KB increase or a Largest Contentful Paint that slipped from 2.3 s to 2.7 s. Machines catch this; people do not.

The choice in front of the project was whether to treat the budget as guidance or as a gate. Guidance is cheaper to set up and never blocks a merge. It is also routinely ignored under deadline pressure, which is precisely when performance erodes fastest. A gate costs more to build and maintain, and it will occasionally block work that the author considers acceptable, but it is the only mechanism that makes the budget real.

## Decision

A hard performance budget is enforced in CI. The build fails on regression against the following limits:

- Initial route JavaScript: at most about 120 KB gzip, excluding lazy-loaded 3D chunks.
- Three.js is never present in the initial bundle. It loads only as a lazy chunk on pages that use it.
- Largest Contentful Paint (LCP) under 2.5 s.
- Interaction to Next Paint (INP) under 200 ms.
- Cumulative Layout Shift (CLS) under 0.1.
- Lighthouse mobile score at least 95 on content pages.
- Motion holds 60 fps and animates transform and opacity only (no layout-triggering or paint-heavy properties in the animation path).

These targets are verified on a real mid-range Android device before any spec is considered done. Lab numbers and emulated throttling are necessary but not sufficient; the device check is the final arbiter, because that is what the audience actually holds.

The metric thresholds (120 KB, 2.5 s, 200 ms, 0.1, 95) are firm budget lines, not aspirational figures. The "about 120 KB" wording allows a small, explicitly approved tolerance band for the gzip measurement; it does not license open-ended growth.

## Alternatives considered

**Soft guidance without gates.** Document the budget in contributor notes and rely on review and good intent to uphold it. Rejected. Soft guidance has no enforcement point, so it degrades silently under exactly the conditions (deadline pressure, large diffs, dependency churn) where performance is most at risk. The whole value of a budget is that it says no on its own; guidance never does. This alternative was rejected in favour of CI gates, and the gates are the substance of this decision.

## Consequences

- Lighthouse CI and a bundle-size analyzer run in the pipeline and fail the build on any regression past the thresholds. A pull request that pushes initial JS over the limit, drags a Core Web Vital below target, or pulls Three.js into the initial bundle does not merge until it is brought back under budget.
- The 60 fps and transform/opacity-only rule constrains how motion is built. Animations that would touch layout or trigger heavy repaints are reworked or dropped; this is a design constraint accepted up front, not a per-case negotiation.
- A heavy-3D page may score slightly lower than 95 only if its static fallback still scores at least 95. The fallback, not the interactive view, carries the content-page guarantee, so a visitor on a constrained device or without WebGL still gets a fast, complete page. A heavy-3D page with no qualifying fallback is not allowed to ship below the threshold.
- New dependencies are scrutinised for their bundle cost before adoption, and some otherwise convenient libraries will be declined because they do not fit the budget. This slows certain features and is the intended trade-off.
- The gates add CI time and maintenance: thresholds must be kept current, the mid-range Android verification step is a manual gate on each spec, and occasional false alarms (measurement noise near the gzip line) will need triage. These costs are accepted as the price of a budget that holds.
- Authors lose the ability to merge a knowingly over-budget change "to fix later." Raising a threshold is a deliberate, reviewed amendment to this ADR, not an inline override in a single pull request.
