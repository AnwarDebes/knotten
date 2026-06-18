# SPEC-01: Brand and design system

## Purpose

Knotten is sold by a small contractor with no in-house design team, against larger developers, on the promise of an energy-smart coastal development. A single owned design system makes every page look deliberate and trustworthy on the first visit, lets one person ship new features fast without redesigning each screen, and keeps the energy story (navy and sea palette evoking Sniksfjorden and the Audna outlet) consistent from marketing pages to calculators. It also bakes accessibility and the performance budget into the foundation so they are not retrofitted later.

## Scope

- Design tokens: navy/sea primary palette plus neutral and accent scales, type scale, spacing, radii, shadows, motion timings, all as Tailwind theme tokens and CSS variables.
- Accessible core components: buttons, links, inputs, select, checkbox/radio, cards, badges, alerts, tabs, accordion, dialog, tooltip, table, breadcrumbs, navigation, footer, skip link, focus ring.
- A `/styleguide` route rendering every token and component with states (default, hover, focus, disabled, loading, error).
- Logo-usage guide (clear space, minimum size, light/dark variants, misuse) and an imagery and art-direction guide.
- A subtle motion signature (shared easing and durations) honouring `prefers-reduced-motion`.

## Dependencies

Builds on SPEC-00 (foundation and engineering baseline): Next.js App Router, Tailwind, TypeScript strict, the CI quality gate, and NO/EN i18n scaffolding.

## Data

No client or personal data. Inputs are static design decisions. The logo is a marked placeholder wordmark until the developer supplies final brand assets; imagery uses honest placeholders (no real site photography exists yet) recorded in INPUTS-NEEDED.

## Acceptance criteria

- [ ] All UI is built from the system; no ad-hoc colours, spacing or type outside the tokens.
- [ ] `/styleguide` renders every token and every component with all states.
- [ ] Text and interactive elements meet WCAG 2.2 AA contrast; verified by automated checks.
- [ ] Components are keyboard operable with visible focus and correct ARIA.
- [ ] Motion respects `prefers-reduced-motion`; the page stays within the performance budget.

## Task checklist

- [ ] Define tokens (palette, neutral, accent, type, spacing, radii, shadows, motion) as Tailwind theme plus CSS variables; lint against raw values.
- [ ] Build the core components with loading, empty and error states and full i18n.
- [ ] Implement skip link, focus management and the reduced-motion path.
- [ ] Build the `/styleguide` route and wire axe checks over it in CI.
- [ ] Write the logo-usage and imagery/art-direction guides with placeholder assets.

## Guardrails

- Buyer-value tools built on these components stay stateless and store no personal data.
- Every estimate shown in components (badges, cards) is labelled, sourced and disclaimed by the consuming feature; the system provides the labelled-estimate and disclaimer primitives.
- Performance budget: the styleguide and shared CSS/JS stay within the SPEC-00 bundle budget; no heavy animation libraries.
- Accessibility: WCAG 2.2 AA across all components and the styleguide.

## Out of scope

- Page layouts, content and the marketing IA (SPEC-02).
- Final brand assets and real photography from the developer.
- Feature-specific UI (3D map, calculators, admin), which consume this system later.
