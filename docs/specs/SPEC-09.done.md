# SPEC-09 completion note

## What was built

An admin-editable content layer (CMS-lite) so the non-technical owner can keep the site current without code, reusing the SPEC-07 auth, MFA, RBAC and audit log.

- **Editable entities**: plots (size, status, indicative price, gnr/bnr, position, note), the fremdrift timeline, FAQ (NO/EN), Aktuelt news (NO/EN, draft and published), the community-dashboard parameters, key text blocks (hero, contact), and image slots. Each schema is data-driven against clearly marked placeholders.
- **Editors** live under `/admin/innhold`, gated to the owner role. They reuse a small set of server-rendered form primitives, so every editor looks and behaves the same with no client JavaScript. Inputs are constrained where structure matters (status and orientation enums, numeric ranges, slug pattern), validated server-side with zod, and rejected with clear messages.
- **Versioning**: plots, timeline stages, news posts and text blocks snapshot the previous value on every change, with a one-click restore that is itself reversible.
- **Images**: upload or replace with type (signature-sniffed) and size checks, mandatory alt text, and forbehold and AI/illustration disclosure fields captured per slot and rendered on the public side. Dev writes under `public/uploads`; production uses an EU volume or object-storage adapter (see HANDOVER.md).
- **Public reflection via ISR**: the public pages read the content layer and are statically rendered with on-demand revalidation. Saving an edit calls `revalidatePath` for the affected NO and EN routes, so the plot overview on Området, published news on Aktuelt and published FAQ on the contact page update shortly after a save, with an hourly backstop.
- **Audit and honesty**: every create, edit, delete and restore is written to the SPEC-07 audit log with no personal data. Prices and dashboard values carry the indicative forbehold; images carry their disclosure.

## Verification

- Local gate green: lint, type-check, format, tests (83), build, bundle budget. Admin and content editor code is server-only and excluded from the public bundle; the heaviest content route stays within budget.
- Unit and integration tests (against in-process PostgreSQL): validation (enum and slug constraints, required alt, JSON), the plot create/update/version/restore round-trip, audit on every mutation, news draft-versus-published with publishedAt, content-block snapshotting, image-slot asset preservation, and FAQ/dashboard storage.
- End-to-end in headless Chromium against the running server: owner login and MFA, create a plot and see it on the public Området page (NO), edit it and restore a prior version, publish a news post and see it on Aktuelt (NO and EN), publish an FAQ and see it on the contact page, and a validation rejection on a bad slug. The admin lead flow was re-run as a regression and still passes.

## Notes for later specs

The editable data this layer manages is consumed by the dedicated public pages as they are built: the plot detail pages (SPEC-18), the full timeline (SPEC-17), the news index and posts (SPEC-19) and the community dashboard (SPEC-13) read the same tables. The editor, validation, versioning, audit and image handling are in place now.
