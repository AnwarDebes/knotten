# SPEC-09: Admin-editable content layer (CMS-lite)

## Purpose

A small groundwork contractor (Sigve Simonsen AS) has no in-house IT, marketing or developer function. For the platform to live past handover, the owner must be able to keep it current without touching code. Plot status changes (ledig, reservert, solgt), prices firm up, the fremdrift moves stage, news happens, and placeholder imagery gets replaced with real photography. Every one of these is routine editorial work, not a deploy. This layer lets the owner run an energy-smart coastal development end to end from a browser, while preserving the honesty discipline (forbehold, AI-disclosure, estimate labelling) that the public site depends on.

## Scope

An authenticated content area, reusing the SPEC-07 admin auth and session model, where the owner edits without code:

- Plot data: size (m²), orientation, status (ledig / reservert / solgt), indicative price, optional gnr/bnr and position.
- The fremdrift timeline (stages, current stage, dates or stage labels).
- FAQ entries (NO/EN, ordered).
- Aktuelt / news posts (NO/EN, draft and published states).
- The community-dashboard parameters (mode and illustrative values for SPEC-13).
- Key content blocks (hero text, contact details).
- Image slots: upload or replace, each with forbehold and AI/illustration-disclosure fields.

Content is versioned where sensible (plots, prices, timeline, news bodies) so a change is auditable and reversible. The public site reflects edits through ISR revalidation, not a rebuild.

## Dependencies

- SPEC-00 (engineering baseline, CI, validation tooling).
- SPEC-01 (design system: the editor UI reuses owned components).
- SPEC-02 (the content blocks and pages being edited).
- SPEC-06 / SPEC-07 (auth, MFA, sessions, audit log, RBAC; reused, not rebuilt).
- Postgres in the EU (per architecture). Consumed by SPEC-04 (plots), SPEC-13 (dashboard), SPEC-17 (timeline, FAQ), SPEC-18 (plot pages), SPEC-19 (news).

## Data

All schemas are data-driven against clearly marked placeholders; dropping in real values requires no code change.

- `plots`: id, label, size_m2, orientation, status (enum), price_indicative (nullable), gnr_bnr (nullable), position (nullable). Placeholder set until survey data arrives (INPUTS-NEEDED #1-3).
- `timeline_stages`: id, key, label_no, label_en, date_or_stage, is_current, order.
- `faq`, `news`: NO/EN fields, order, status (draft/published), timestamps.
- `dashboard_params`: mode, illustrative values (clean interface for future real telemetry).
- `content_blocks`: key, body_no, body_en.
- `image_slots`: slot_key, asset_ref, forbehold_text, is_ai_or_illustration (bool), disclosure_text, alt_no, alt_en.
- `content_versions`: entity, entity_id, snapshot, editor, timestamp.

Prices and counts remain placeholders; nothing is presented as final.

## Acceptance criteria

- [ ] A non-technical user can update plots, prices, status, timeline, FAQ, news and images end to end from the UI, with no code edits for routine content.
- [ ] Public site reflects each change correctly via ISR revalidation (NO and EN).
- [ ] All inputs are server-side validated and sanitised; invalid input is rejected with clear messages.
- [ ] Plot status enum, price formatting and orientation are constrained, not free-text where structure matters.
- [ ] Image slots require alt text; forbehold and AI/illustration disclosure are captured and rendered on the public side.
- [ ] Edits are versioned where sensible and recorded in the SPEC-07 audit log (who, what, when); reversible where versioned.
- [ ] Only authenticated, MFA-verified admins can read or write; all mutations are server-authorised.
- [ ] Operating the content layer is documented in the runbooks (docs/runbooks/).

## Task checklist

1. Define and migrate the schema above (Drizzle/Prisma, parameterised access).
2. Build editor routes under the existing admin shell, gated by the SPEC-07 auth and RBAC.
3. Implement validated forms (allowlist) per entity, with edge, empty, loading and error states.
4. Add the versioning model and a restore-from-version action for versioned entities.
5. Wire ISR revalidation (tag or path) so public pages refresh on save, NO and EN.
6. Implement secure image upload/replace (type and size checks, EU storage) with mandatory alt, forbehold and AI-disclosure fields.
7. Expose dashboard params behind the SPEC-13 data interface.
8. Hook every mutation into the audit log; no PII in logs.
9. Tests: unit (validation), integration (mutations, auth), E2E (edit then public update).
10. Write the runbook section for non-technical editing.

## Guardrails

- Buyer-value tools stay stateless and collect no personal data; this layer manages content, not buyer PII, and the dashboard values it edits are illustrative only.
- Every estimate is labelled (indikativt estimat), sourced and disclaimed; prices and the community-dashboard values carry the appropriate forbehold, and AI or illustration imagery is disclosed per slot.
- Performance budget holds: editor code is admin-only and excluded from the public initial route JS (≤ ~120 KB gzip); public pages keep LCP < 2.5 s, INP < 200 ms, CLS < 0.1, Lighthouse mobile ≥ 95.
- WCAG 2.2 AA across the editor and the public output: keyboard operable, visible focus, sufficient contrast, labelled fields, image alt required.

## Out of scope

- A general-purpose page builder, rich block layouts or arbitrary route creation (key blocks only).
- Lead and consent management, export and erasure (SPEC-06, SPEC-07).
- Analytics configuration (SPEC-08).
- Real inverter or battery telemetry (interface only; SPEC-13).
- Localisation of editor chrome beyond NO/EN content fields.
- Multi-tenant or multi-project content; single development only.
