# SPEC-19: Aktuelt news and updates

## Purpose
Sigve Simonsen AS is a small contractor selling an energy-smart coastal development at Rødberg, Sniksfjorden (Lindesnes, Agder). A development that does not yet have site photography or a fixed unit count needs a credible, living signal that the project is real and progressing. The Aktuelt section gives the owner a way to publish project milestones (regulering, grunnarbeid, energianlegg) and short energy-tech stories (strømstøtte, Norgespris, plusskunde, energideling) without a developer. It builds trust, gives search engines fresh, structured content to index, and feeds optional milestone emails to leads who have already consented, turning interest into sustained attention.

## Scope
An admin-editable news/updates section: create, edit, publish and unpublish posts from the existing admin UI, each with title, slug, summary, body, publish date, optional cover image (placeholder until real media exists), tags and NO/EN versions. A public Aktuelt index and per-post pages with clean SEO metadata, Open Graph and Article structured data. Optionally, a published post tagged as a milestone can trigger one email to leads who hold a valid double opt-in consent, sent through the consented lead flow only.

## Dependencies
- SPEC-02: the Aktuelt page shell, navigation, NO/EN i18n and hreflang.
- SPEC-09: the admin-editable content layer (CMS-lite) this extends with a post type.
- SPEC-07: the authenticated, MFA-gated admin area the editing UI lives in.
- SPEC-06: the consent engine and double opt-in state any email must respect.
- SPEC-08: Plausible goals for post views and email opt-in interest.

## Data
- Post: id, slug, locale (no/en) with a linked translation pair, title, summary, body (sanitised rich text), publish_date, status (kladd/publisert), tags, optional cover_image_ref, author label, created_at, updated_at. No personal data on the post entity.
- Email nurture reuses the SPEC-06 lead and consent records; it stores no new personal data. Sends only to confirmed double opt-in leads, EU/EEA email provider, with unsubscribe.
- Placeholders: cover images use clearly marked placeholders or abstract coastal art (no fabricated site photos); real milestone content and dates depend on the developer (see docs/INPUTS-NEEDED.md). Indicative energy figures cited in posts (strømstøtte, Norgespris, plusskunde, PVGIS yield, SSB baseline) carry their source and an estimate label.

## Acceptance criteria
- [ ] Posts created, edited, published and unpublished entirely from the admin UI, no developer needed.
- [ ] Each post has NO and EN versions with correct hreflang; NO is default.
- [ ] Index and per-post pages are SEO-clean: metadata, Open Graph, Article structured data, sitemap entry, Lighthouse SEO at least 95.
- [ ] Rich-text body is sanitised server-side; no stored XSS.
- [ ] Optional milestone email sends only to confirmed double opt-in leads, has unsubscribe, and creates no personal-data issue.
- [ ] Estimates in post copy are labelled, sourced and disclaimed; images carry the AI/illustration forbehold.
- [ ] Within the §8 performance budget; WCAG 2.2 AA.

## Task checklist
- [ ] Extend the SPEC-09 content model with a post type and translation-pair linkage; add migrations.
- [ ] Build the admin editor: fields, sanitised rich text, draft/publish, NO/EN, image slot, preview.
- [ ] Build the public Aktuelt index (paginated, tag filter) and per-post pages.
- [ ] Add per-post metadata, Open Graph, Article JSON-LD, hreflang and sitemap inclusion.
- [ ] Implement the optional milestone email behind the SPEC-06 consent flow, with unsubscribe and EU/EEA delivery.
- [ ] Wire Plausible goals; add empty/loading/error states; NO/EN copy.
- [ ] Tests: unit (sanitisation, slug, locale pairing), E2E (publish, render, consented send); update PROGRESS and DONE.

## Guardrails
- Privacy: the public Aktuelt section is stateless and collects no personal data. The optional email reuses only existing SPEC-06 consent records, targets confirmed double opt-in leads, carries unsubscribe, and keeps all email and data in the EU/EEA; no new personal data is created.
- Honesty: every estimate in post copy is labelled an indikativt estimat with its source and disclaimer; placeholder imagery carries the AI/illustration forbehold; no fabricated site photos.
- Performance: within the §8 budget (initial route JS at most about 120 KB gzip, LCP under 2.5 s, INP under 200 ms, CLS under 0.1, Lighthouse mobile at least 95); images responsive and lazy-loaded below the fold.
- Accessibility: WCAG 2.2 AA: semantic article structure, heading order, full keyboard operability, visible focus, sufficient contrast, image alt text, reduced motion respected.

## Out of scope
- User comments, reactions, or any visitor-submitted content.
- A general newsletter, campaign builder, or scheduled/automated drip sequences beyond the single consented milestone email.
- Social media auto-posting and external syndication.
- Analytics collection itself (SPEC-08) and the Fremdrift timeline (SPEC-17), which Aktuelt links to but does not replace.
