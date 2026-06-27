# SPEC-27 completion note

## What was built

The foundation for the immersive experience: a dedicated, opt-in route that loads
the heavy 3D world as a separate chunk and keeps the rest of the site's
performance contract intact.

- **Route**: bilingual `"/opplev"` (no) and `"/experience"` (en) in `src/i18n/routing.ts`, with message parity green.
- **Shell**: `src/app/[locale]/opplev/page.tsx`, a server component with no Three.js, carrying the title, the real-vs-indicative narrative, the Kartverket attribution and the interest CTA.
- **Launcher**: `experience-launcher.tsx`, a client island that detects WebGL, auto-enters without a click, and dynamically imports the world with `ssr: false`.
- **Entry CTA**: `experience-cta.tsx`, a large high-colour banner linked from the home page and `/omradet`, plus a footer entry.
- **Fallback**: a no-WebGL message that still presents the narrative and the interest CTA.
- **Budget**: the route is exempt in `scripts/check-bundle-size.mjs`; the shell still meets the content-route budget and Lighthouse stays on the shell.

## Verification

- Local gate green: typecheck, lint, build, i18n parity.
- Production build served and driven headlessly: the route resolves in both locales, auto-enters, loads the world chunk, and the CTA links in from the home page and `/omradet`.
