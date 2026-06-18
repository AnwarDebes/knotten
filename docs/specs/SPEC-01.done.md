# SPEC-01 completion note

## What was built

- Design tokens (navy and sea brand scales, neutral and semantic tokens, radii, motion timings) as Tailwind v4 theme variables and CSS variables in `globals.css`. All foreground/background pairs chosen for WCAG 2.2 AA contrast. Light theme, `color-scheme: light`.
- A motion signature (shared easing and durations) and a global `prefers-reduced-motion` path that disables non-essential animation.
- Owned components on the shadcn/Radix base: button, badge, card, alert, input and textarea, label, checkbox, radio group, select, tabs, accordion, dialog, tooltip, table, breadcrumb, separator, plus a skip link.
- Honesty primitives: `EstimateBadge` and `Disclaimer` (with standard Norwegian disclaimer strings) so every public estimate is labelled and disclaimed consistently.
- Site chrome: a placeholder logo (marked placeholder), a zero-JavaScript responsive header (mobile menu via a native `<details>` disclosure), and a footer. Wired into the root layout with the skip link.
- A `/styleguide` route rendering every token and component with states. It is noindex and exempt from the content bundle budget (it loads many interactive components by design).
- Brand docs: `docs/brand/logo-usage.md` and `docs/brand/imagery-art-direction.md`.
- Tests: `cn` utility, Button behaviour, and a jest-axe structural accessibility test over the static components (14 tests total).

## Decisions

- The header is server-rendered with no client JavaScript (native `<details>`), which keeps content pages within the performance budget (index at about 127 KB gzip first-load, under the 130 KB ceiling).
- `AlertTitle` and similar are not document headings, so components do not force heading levels and break heading order; pages own their outline.

## Verification

- Local: lint, type-check, format check, 14 unit and a11y tests, build, and the bundle budget all pass.
- jsdom cannot compute rendered colour contrast or full keyboard flows; those are verified in a real browser in SPEC-22. Tokens were chosen for AA contrast by design.

## Follow-ups

- Apply the system to real marketing pages with next-intl (NO/EN) in SPEC-02.
- Final brand assets and real photography from the developer (recorded in INPUTS-NEEDED).
- Full-page browser axe, keyboard pass, and per-route budgets in SPEC-22.
