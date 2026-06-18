# ADR-0005: Tailwind with an owned shadcn/ui-based component library and design tokens

## Status

Accepted, 2026-06-18.

## Context

The platform's public job is interest capture and credibility, not transactional sales, and its premium feel has to come from craft rather than spend. That sets a high bar on three fronts at once:

- **Quality and consistency.** Every page, tool and the 3D showpiece must look and behave like one coherent product. Ad-hoc, page-local styling drifts over time and is the usual source of a "templated" feel. The brand is the existing Knotten coastal emblem and navy wordmark, extended tastefully rather than redesigned, so the visual language has to be encoded somewhere a developer cannot easily bypass.
- **Accessibility.** WCAG 2.2 AA is a hard acceptance criterion on every spec (keyboard operability, visible focus, contrast, reduced-motion). Interactive primitives (dialogs, menus, comboboxes, tabs, tooltips) are exactly where hand-rolled accessibility quietly fails, so the component layer needs correct focus management and ARIA from the start.
- **Performance and ownership.** The §8 budget is strict: initial route JS at most about 120 KB gzip, LCP under 2.5 s, CLS under 0.1, Lighthouse mobile at least 95 on content pages. Whatever drives styling must add little or no runtime cost. The platform is handed over to a non-technical owner and must keep running for years, so it cannot carry a runtime dependency on a closed component vendor that could change its licence, pricing, or availability. The output, including the component source, has to be fully owned and auditable.

The styling approach was already committed at the brief level (Tailwind plus an owned component library on a shadcn/ui base, design tokens from the Knotten navy and sea palette) and is realised in SPEC-01 (design tokens for colour, type, spacing, radii, shadows and motion timings; accessible core components; a `/styleguide` route). This record fixes that decision and states the trade-offs honestly.

## Decision

Use **Tailwind CSS** as the styling engine, with an **owned component library built on the shadcn/ui base**, both driven by a single set of **design tokens** derived from the Knotten navy and sea palette.

Concretely:

1. **Design tokens are the single source of truth.** One token layer encodes colour (the navy and sea palette from the logo, plus neutral and accent scales), typography (families, sizes, weights, line heights), spacing, border radii, shadows, and motion timings (durations and easing). Tokens are defined as CSS custom properties and exposed to Tailwind through its theme configuration, so the same values back both utility classes and any raw CSS. Component code references tokens, never hard-coded literals.

2. **shadcn/ui is a starting point that is copied in, not a dependency.** Components are generated from the shadcn/ui base into the repository and then owned outright: the source lives in `components/ui`, is edited freely, and is version-controlled with the rest of the application. There is no runtime package from a component vendor. The accessible primitives underneath (Radix UI for focus management, keyboard interaction and ARIA) are conventional open-source libraries, not a closed product, and can be vendored or replaced if ever needed.

3. **All UI is composed from the system.** Pages and features build from system components and Tailwind utilities resolved against tokens. Ad-hoc, one-off styles are not permitted; a recurring need becomes a token or a component, not a local override.

4. **A `/styleguide` route renders the system.** It displays every token (swatches, type scale, spacing, radii, shadows, motion samples) and every component in its states (default, hover, focus, disabled, loading, error, empty), and doubles as the living contract and a target for visual-regression and accessibility checks.

5. **Tailwind is purged to what is used.** Production CSS contains only the classes actually referenced, keeping the stylesheet small and stable in size as the project grows.

## Alternatives considered

**A third-party UI kit (for example MUI, Mantine, Chakra, or a paid component suite).**
Rejected. These ship a large, opinionated runtime and a baked-in visual language that resists a distinctive brand: matching the Knotten navy and sea identity means fighting the kit's own theming, and deep customisation often costs more than building. A paid suite adds a closed runtime dependency with licence and continuity risk, which conflicts directly with the ownership and long-lived-handover requirements. The bundle weight also pushes against the §8 budget. The kits do offer mature, accessible components out of the box, which is the genuine attraction, but the shadcn/ui base plus Radix captures most of that benefit without the runtime lock-in.

**CSS-in-JS (for example styled-components or Emotion).**
Rejected. Runtime CSS-in-JS adds JavaScript cost and serialisation work in the browser, which is the wrong trade against a strict mobile JS budget, and it interacts awkwardly with React Server Components and streaming in the App Router (extra setup, hydration and flash-of-unstyled-content hazards). Zero-runtime variants exist but add build complexity for benefits Tailwind plus tokens already provide. The co-location ergonomics are real but do not outweigh the runtime and rendering-model friction here.

**Bespoke CSS only (hand-written stylesheets, optionally with CSS Modules).**
Rejected as the primary system. It has the smallest conceptual surface and full control, but it puts the entire burden of consistency and, critically, the accessibility of interactive primitives on hand-written code, which is exactly where defects accumulate. It scales poorly across many pages and tools without a heavy in-house convention layer that would, in effect, reinvent Tailwind and a component library at lower quality. Plain CSS and CSS custom properties remain available for the rare case a utility cannot express something cleanly, but always reading from the same tokens, never as freestanding ad-hoc styling.

## Consequences

- **All UI is built from the system; there are no ad-hoc styles.** Consistency is enforced structurally rather than by review vigilance alone. The cost is discipline: a new visual need is resolved by adding a token or a component, which is slightly slower than a quick local override but keeps the system coherent.

- **Tokens encode colour, type, spacing, radii, shadows and motion timings in one place.** A brand or palette adjustment is a token change that propagates everywhere, and the motion timings live beside the rest so the subtle motion signature stays consistent and `prefers-reduced-motion` is honoured uniformly. The discipline only holds if components reference tokens rather than literals, which is a standing review point.

- **The `/styleguide` route renders everything.** It is the living documentation, the onboarding surface for any future developer, and the anchor for visual-regression and axe checks, so drift in the system is caught as a failing build rather than discovered in production.

- **Full ownership, no closed-vendor runtime.** The component source lives in the repository and can be read, audited and modified without permission from any vendor. The flip side is real: owning the components means owning their maintenance, including tracking upstream shadcn/ui and Radix improvements and security fixes ourselves, since there is no automatic upgrade path once a component is copied in. This is an accepted, deliberate cost of independence.

- **Low runtime cost, friendly to the budget and the rendering model.** Styling resolves to static CSS that is purged to what is used, with no styling runtime to ship, which suits the §8 budget, Core Web Vitals targets, and Server Components. Markup carries utility classes, which is more verbose to read; the component layer absorbs most of that by encapsulating repeated patterns behind named, typed components.

- **Accessibility starts from a sound base.** The underlying primitives provide correct focus management, keyboard interaction and ARIA, which makes WCAG 2.2 AA reachable, but does not make it automatic: contrast (driven by the token palette), reduced-motion fallbacks, copy and content order still require deliberate work and the manual keyboard and axe passes defined in the QA gate.

- **Some upfront investment before feature velocity.** Establishing the tokens, the core components and the styleguide is front-loaded work (SPEC-01) that precedes most feature delivery. It pays back across every subsequent spec, since features then assemble from a consistent, accessible, performant kit rather than restyling from scratch.
