# ADR-0012: Database-backed content layer with ISR revalidation

## Status

Accepted, 2026-06-18.

## Context

The site owner is non-technical and must run the site without a developer on hand for routine work. Day-to-day content changes (plot details, prices, availability status, the project timeline, FAQ entries, news posts, the parameters that drive the community dashboard, the key on-page content blocks, and the image slots) need to be made directly by the owner, safely and repeatedly, without touching code or waiting on a deploy.

Several facts constrain how content is handled:

- Plot and unit counts are not yet fixed. The figure "8" referred to student internship positions, not homes. The site is data-driven against placeholders, so the editable layer has to be the source of truth for these numbers rather than anything hard-coded.
- No real site photography exists yet. Image slots must default to honest placeholders and must not imply that imagery is final or that a depicted scene is real.
- Public copy mixes regulated and indicative figures (Strømstøtte, Norgespris, plusskunde and energy-sharing limits, passivhus targets, solar yield around 1000–1020 kWh/kWp per year from PVGIS, SSB household baselines). All indicative figures must stay labelled as estimates, and any rendering, visualisation or AI-assisted illustration must be disclosed.
- Data residency is constrained: email and database live in the EU/EEA only. Analytics is Plausible (EU, cookieless), so no new processor or cookie banner should be introduced casually.
- An admin authentication system already exists for the site, hosted in the EU.

The question is where editable content should live and how public pages should pick up changes.

## Decision

Build an admin-editable content layer (CMS-lite) backed by the existing EU database and protected by the existing admin authentication. No separate content-management product is introduced.

Through this layer the owner edits:

- Plots: details, prices, and availability status.
- The project timeline.
- FAQ entries.
- News posts.
- The community-dashboard parameters (the inputs that drive the public dashboard figures).
- Key on-page content blocks.
- Image slots.

Behaviour and guarantees:

- All inputs are validated on write. Numeric fields, dates, status enumerations and required fields are checked before they can be saved, so a single mistyped value cannot break a public page.
- Image slots carry a forbehold field and an AI-disclosure field. Every image that is a placeholder, a rendering, or AI-assisted is labelled as such on the public page, consistent with the no-real-photography-yet position.
- Public pages are statically rendered and revalidated through Incremental Static Regeneration (ISR). When the owner saves a change, the affected pages are revalidated on change, so visitors see fresh content without a redeploy.
- Reuse of the existing EU-hosted database and admin auth keeps all content data inside the EU/EEA and adds no new data processor.
- The editing workflow is documented in the runbooks so the owner can operate it unassisted.

This keeps the indicative figures editable and clearly labelled in one place, and keeps the plot, price and status data, which is genuinely unknown and placeholder-driven today, under the owner's direct control rather than in code.

## Alternatives considered

**Hosted headless CMS.** A managed product would give a polished editing experience out of the box. It adds a third-party data processor, a recurring cost, and a second system to keep inside the EU/EEA and to reconcile with the existing admin auth. It also splits the source of truth: content lives in the vendor while the rest of the application data stays in the project database. For a single non-technical owner editing a bounded set of fields, the operational and contractual overhead outweighs the convenience. Rejected.

**Git-based content (Markdown/JSON in the repository).** Cheap and versioned, with no extra runtime dependency. It requires the editor to work through pull requests, branches and a build pipeline, which is not realistic for a non-technical owner running the site alone. It also makes structured, validated fields (status enumerations, price numerics, dashboard parameters, per-image disclosure flags) awkward compared with a typed database schema. Rejected on the non-technical-owner constraint.

**Hard-coded content.** Simplest to build and fastest to render, with nothing extra to operate. Every routine change would require a developer and a deploy, which directly contradicts the requirement that the owner run the site independently. It is also a poor fit while plot counts, prices and status are unknown and expected to change. Rejected.

## Consequences

Positive:

- No code edits are needed for routine content. The owner changes plots, prices, status, timeline, FAQ, news, dashboard parameters, content blocks and images directly.
- Inputs are validated before they reach a public page, reducing the chance that an edit breaks rendering or publishes an out-of-range value.
- Image slots carry the forbehold and AI-disclosure fields, so placeholder, rendered and AI-assisted imagery is labelled honestly by construction, not by remembering to add a caption.
- All content stays in the existing EU-hosted database under the existing admin auth: no new processor, no new cookie or analytics surface, no new residency exposure.
- ISR keeps public pages static and fast while still reflecting edits shortly after they are saved.
- The workflow is documented in the runbooks, so operation does not depend on the original developer.

Costs and trade-offs:

- The editing UI, the validation rules, and the revalidation wiring are built and maintained in-house rather than bought. New editable fields require schema, validation and form work.
- Editorial safety depends on the validation rules and on the labelling discipline encoded in the image-slot fields. Indicative figures stay correct in public copy only if the dashboard parameters and content blocks are entered correctly; validation guards format and range, not factual accuracy.
- ISR introduces a short propagation window between save and public visibility, and a stale page can persist if a revalidation is missed, so revalidation paths need to be covered for each editable surface.
- Custom auth and storage carry their own ongoing security and backup responsibility, which the project now owns rather than delegating to a CMS vendor.
