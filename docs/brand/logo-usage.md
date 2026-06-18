# Logo usage

The Knotten mark is a navy wordmark with a small coastal emblem (a hill meeting the sea under a low sun), reflecting the setting at Sniksfjorden and the Audna outlet.

The current mark in the code (`src/components/site/logo.tsx`) is a marked placeholder. It is replaced when the developer supplies the final brand assets; this guide states how the mark is used either way.

## Clear space and minimum size

- Keep clear space around the mark equal to the height of the emblem on all sides.
- Minimum height: 24 px on screen for the emblem, 28 px for the full wordmark, so the wordmark stays legible.

## Colour

- Primary: navy (`--primary`) on light backgrounds.
- On dark or photographic backgrounds: white, with enough contrast to stay legible.
- The emblem inherits the surrounding text colour (`currentColor`), so it adapts to the context.
- Do not recolour the mark into off-brand colours. The accent sea colour is for highlights, not the wordmark.

## Misuse

- Do not stretch, skew, or rotate the mark.
- Do not add shadows, outlines, or gradients.
- Do not place the mark on a low-contrast background that fails WCAG contrast.
- Do not recreate the wordmark in a different typeface; use the provided component.

## Accessibility

- The mark always carries an accessible name ("Knotten, Sjøutsikt i Rødberg"); the emblem SVG is `aria-hidden` so screen readers announce the name once.
