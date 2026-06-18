# SPEC-20: For kommunen og partnere plus downloadable kit

## Purpose

The brief explicitly wants a presentation to Lindesnes kommune and partners and a basis for the zoning process (_reguleringsplan_). For a small groundwork contractor (Sigve Simonsen AS), this section is where the platform earns institutional credibility: it shows the municipality, partners and investors that the energy-smart coastal development at Rødberg is a serious, well-grounded _referanseprosjekt_, not a brochure. A self-serve, downloadable kit lets a non-technical owner hand over a coherent, professional concept without bespoke effort, and lets stakeholders carry the material into their own internal processes.

## Scope

A dedicated stakeholder section ("For kommune og partnere") that presents the concept and the national-reference-project ambition (low energy demand, local production, energy sharing and storage, robustness, national visibility). A downloadable kit wired to the SPEC-25 deliverables: a concise one-pager (PDF), the municipality/partner deck, and the concept documents. Clear stakeholder-facing copy, bilingual where useful, with the site, tools and documents telling one consistent story.

## Dependencies

- SPEC-00 / SPEC-01: engineering baseline, design tokens, accessible components.
- SPEC-02: the "For kommune & partnere" page shell, IA and NO/EN parity.
- SPEC-25: the source artefacts (`Presentasjon_kommune_og_partnere.pptx`, `Energikonsept_Knotten.docx`, feasibility briefs, `Reguleringsplan_anbefalinger.docx`, `Robusthet_og_beredskap.docx`); the one-pager is derived from these.
- SPEC-08: Plausible goals for downloads.
- SPEC-09: admin-editable copy and kit file references where practical.

## Data

- Document set: the SPEC-25 deliverables, served as static, versioned files; numbers must match the site, tools and `Energimodell_Knotten.xlsx`.
- One-pager content: indicative figures only (NO2 context, passivhus targets, solar about 1000-1020 kWh/kWp/yr), each labelled and sourced.
- No personal data. Unit/plot count and any site imagery are UNKNOWN: use honest placeholders, recorded in `docs/INPUTS-NEEDED.md`, so real data drops in without code changes.

## Acceptance criteria

- [ ] Clear, professional stakeholder-facing content framed around the _referanseprosjekt_ ambition.
- [ ] Downloadable kit (one-pager, deck, concept docs) wired to the SPEC-25 deliverables.
- [ ] Bilingual (NO/EN) where useful; key documents available in Norwegian.
- [ ] Every estimate in public copy and the one-pager is labelled, sourced and disclaimed.
- [ ] Stateless; collects no personal data on this section.
- [ ] Within the SPEC-8 performance budget; WCAG 2.2 AA.

## Task checklist

1. Build the "For kommune og partnere" page from design-system components, with concept summary, ambition and pillars.
2. Author the one-pager (PDF) derived from SPEC-25, with labelled, sourced figures and disclaimers.
3. Wire the download kit: deck and concept docs as static, versioned files, with sizes and formats shown.
4. Add NO/EN copy; mark which documents are Norwegian-only.
5. Add Plausible download goals (SPEC-08); no personal data.
6. Accessibility pass (axe + keyboard), Lighthouse and bundle-budget check; update PROGRESS and DONE.

## Guardrails

- Privacy: stateless; no personal data; no login or gating; no cookie banner needed (Plausible, cookieless).
- Honesty: every estimate labelled an _indikativt estimat_ with source and assumptions; carries _"krever profesjonell verifikasjon"_; nothing unverified presented as fact; figures consistent across docs, site and spreadsheet.
- Performance: within the SPEC-8 budget (initial route JS at most about 120 KB gzip; LCP under 2.5 s, INP under 200 ms, CLS under 0.1; Lighthouse mobile at least 95); large documents downloaded, never inlined.
- Accessibility: WCAG 2.2 AA, full keyboard operability, visible focus, sufficient contrast; download links clearly labelled with format and size.

## Out of scope

- Generating the SPEC-25 documents themselves (owned by SPEC-25; this section only presents and links them).
- Investor portals, deal rooms, NDA gating or any authenticated stakeholder access.
- Lead capture on this section (interest goes through the consented SPEC-06 flow).
- Live editing of document contents from the site; only references and copy are admin-editable.
