# ADR-0010: React Three Fiber for the single 3D terrain showpiece only

## Status

Accepted, 2026-06-18.

## Context

The site needs one genuinely premium moment: an interactive 3D view of the terrain and plot map (SPEC-04), built from open Kartverket Høydedata elevation data (CC BY 4.0, commercial use permitted). That moment is meant to make the location at Rødberg, Sniksfjorden read as real and worth attention, before any site photography exists.

Everything else on the site is content, not spectacle: energy figures, the passivhus story, the Strømstøtte and Norgespris comparisons, plot information. These are best served by light SVG, Lottie, and ordinary 2D layout, where they stay fast, indexable, and legible on a phone.

The constraints are hard and they pull against heavy 3D:

- Speed. The initial bundle and first paint must stay within budget. A general-purpose 3D engine in the critical path would break that on its own.
- SEO. Content must be server-rendered HTML that search engines and link previews can read. A canvas tells them nothing.
- Mobile and low-end devices. A large share of visitors arrive on phones. WebGL terrain rendering is power-hungry and not reliably available; it cannot be a precondition for understanding the project.

So the question is narrow: how much 3D, and where, without paying for it on every page and every device.

## Decision

Use React Three Fiber and Three.js for exactly one scene: the SPEC-04 terrain and plot map. That scene is:

- Code-split and lazily loaded, so Three.js and the scene code live in a separate chunk fetched only when a visitor reaches and opts into that section.
- Guarded by capability detection (WebGL support, device class, and a respect for prefers-reduced-motion and data-saver signals).
- Backed by a mandatory, high-quality static fallback: a pre-rendered image or annotated 2D map of the same terrain and plots, good enough to stand on its own, served whenever the 3D path is not taken.

No second heavy 3D scene anywhere on the site. If another candidate for 3D appears, it is solved with 2D, SVG, or Lottie, or it is reconsidered as an amendment to this record, not added quietly.

## Alternatives considered

**Multiple 3D scenes (terrain plus, for example, a 3D building or energy-flow visualisation).** Rejected. Each additional scene multiplies the maintenance surface, the asset pipeline, and the device-compatibility testing, while the marginal "wow" drops sharply after the first. The energy and building stories are clearer as 2D diagrams that are accessible, translatable, and indexable. More 3D buys less for more cost.

**A 3D-first site.** Rejected outright. It would put WebGL on the critical path, hand search engines a canvas instead of content, and exclude or punish mobile and low-end visitors. It trades the three non-negotiables (speed, SEO, mobile) for a single aesthetic, which is the wrong trade for a project whose job is to communicate a real place and real numbers.

**No 3D at all.** A serious option, and the safest one. It keeps everything simple and fast. It was rejected only because the terrain genuinely benefits from being explorable: the slope down to the Audna outlet, the orientation of plots, and solar exposure read far better in three dimensions than on a flat map. The cost of one well-isolated scene is judged worth that single, specific payoff. The honest caveat: this is the one place where complexity is accepted on purpose, and it must earn its keep.

## Consequences

- Three.js never ships in the initial bundle. It is a lazy chunk, so the cost is paid only by visitors who reach the terrain section on a capable device and choose to load it. First paint and the rest of the site stay within budget.
- The scene uses an on-demand frameloop (`frameloop="demand"`): it renders on interaction or data change, not continuously, and is paused when scrolled offscreen or when the tab is hidden. This holds down CPU, GPU, battery, and fan noise on the machines that do run it.
- Mobile and low-end devices receive the static fallback, which itself meets the speed and quality budget. No visitor sees a degraded or broken experience; they see a different, still-good one.
- The static fallback is not a throwaway. It must be maintained alongside the 3D scene as the terrain and plot data evolve, since it is what most visitors and all crawlers actually see. That is real, ongoing work and is accepted as part of the cost.
- Capability detection, the fallback path, and the lazy boundary add code paths to test. This complexity is contained to one feature and does not leak into the rest of the site.
- One scene is the ceiling, not a starting point. Adding 3D elsewhere requires revisiting this decision, which keeps scope and bundle discipline intact over time.
- Terrain geometry derives from open Kartverket Høydedata (CC BY 4.0), so the data layer carries no licensing risk for commercial use; attribution is required and will be carried in the scene and its fallback. Note that Norge i bilder orthophotos are Geovekst-licensed and not open, so they are not used as a texture source here.

## Amendment, 2026-06-27: a second, opt-in immersive scene (SPEC-27 and later)

The "no second heavy 3D scene" ceiling is amended, narrowly, to permit one further scene: the opt-in immersive experience at `/opplev` (Opplev Knotten / Experience), an investor-facing first-person walk of the real site. The original reasoning still holds for the rest of the site; this scene is allowed only because it keeps every one of the original guarantees:

- Opt-in and link-only. It is not on any content page's critical path. A visitor reaches it by clicking through from `/omradet` or the footer, and the heavy world loads only after a further explicit "Enter" click.
- Isolated to its own route and chunk. Three.js and all world code load via a dynamic `ssr:false` import after Enter, so they never enter the initial bundle of `/opplev` or any other route. The `/opplev` shell is measured by the bundle gate like a content page (it sits around 147 KB gzip).
- Mandatory fallback. The server-rendered shell is a real, indexable page: the real-versus-indicative narrative, attributions, and a still poster of the same terrain. Phones, no-WebGL and low-end clients get that shell, not a broken canvas. First person needs a pointer lock and a keyboard, so it is desktop-first; touch controls are a later increment.
- Honesty carried into 3D. The terrain, sun, sea, distances and energy figures are real and sourced; the buildings are indicative massing, labelled as such inside the scene.

The orthophoto position is unchanged in principle: Norge i bilder is Geovekst-licensed and not open. The experience is built to drape a real orthophoto once that licence is secured, and uses an openly-licensed interim texture (Sentinel-2, "Contains modified Copernicus Sentinel data") until then, swapped via a manifest with no code change. This remains a deliberate ceiling, not an open door: a third heavy scene would again require amending this record.
