# Imagery and art direction

## Honesty first

No real photography or drone footage of the site exists yet. Until the developer supplies it, the platform uses clearly marked placeholders, tasteful abstract coastal art, or properly licensed stock, never fabricated photos of the real location. Every placeholder is recorded in `docs/INPUTS-NEEDED.md` and lives in a swappable image layer so real assets drop in without code changes.

Follow Norwegian property-marketing convention (see `docs/research/nybygg-konvensjoner.md`):

- Include standard forbehold text where illustrations appear (illustrations may deviate; surroundings are not finally designed).
- Disclose explicitly where an image is an illustration or is AI-generated or edited. Unedited images come first; any edit gets a clear, specific explanation of what was changed.
- Depict the surroundings and the sea view honestly. Do not remove existing buildings, trees, or poles, and do not exaggerate sightlines or sun.

## Visual tone

- Calm, natural, coastal. Navy and sea tones from the palette, generous whitespace, restrained motion.
- Prefer real texture (water, rock, sky, timber) over synthetic gloss.
- Premium feel comes from craft and restraint, not heavy effects. One designated 3D moment (the terrain and plot map); everything else stays light.

## Technical

- Serve modern formats (AVIF or WebP) with responsive sizes through the framework image pipeline; always set width and height to avoid layout shift.
- Provide meaningful alt text for informative images; mark decorative images as decorative.
- Respect the performance budget: large hero media uses a poster and a short, muted, reduced-motion-aware loop, never an autoplaying heavy video.

## Image slots and disclosure fields

Each image slot in the content layer carries fields for: alt text, a forbehold flag and text, and an AI-or-illustration disclosure. These are filled in when real or edited imagery is added, so the disclosure travels with the image.
