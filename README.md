# Knotten, Sjøutsikt i Rødberg

Digital platform and concept material for **Knotten, Sjøutsikt i Rødberg**, a coastal residential development by **Sigve Simonsen AS** in Rødberg, Sniksfjorden, Lindesnes kommune.

The development aims to be one of Norway's most energy-efficient, robust and attractive residential areas, a national reference project where energy concept, infrastructure, regulation and market work are developed together from the start. This repository holds the public-facing platform that presents the project, captures buyer interest, and makes the energy value tangible, plus the supporting concept documents.

## Status

Early development. The project is pre-salgsstart and pre-regulering, so the platform's job is credible interest capture and stakeholder credibility, not transactional sales. The production deployment stays access-gated and `noindex` until review and go-live approval.

Unit count, plot sizes, prices, gnr/bnr, floor plans and site photography are not yet finalised by the developer. Everything is built data-driven against clearly marked placeholders; see `docs/INPUTS-NEEDED.md`.

## Stack

- **Web:** Next.js (App Router, TypeScript), hosted on Vercel
- **Data:** managed PostgreSQL in an EU region (parameterised access, migrations in repo)
- **i18n:** Norwegian (default) and English, full parity
- **Styling:** Tailwind with an owned component library and design tokens from the Knotten palette
- **Analytics:** Plausible (EU, cookieless)
- **Email:** EU/EEA-resident provider for lead notifications and double opt-in
- **Maps and terrain:** MapLibre + OpenStreetMap; Kartverket Høydedata for the 3D terrain showpiece

## Repository layout

```
docs/
  research/     verified Norwegian regulation, standards and data sources, with citations
  decisions/    architecture decision records
  specs/        feature specifications and per-spec completion notes
  security/     threat model and security review
  privacy/      processing record, retention, consent
  runbooks/     operational procedures
  INPUTS-NEEDED.md   client data still required
  OPEN-QUESTIONS.md  decisions awaiting the developer
COSTS.md        running monthly cost ledger
```

The application code lands during the foundation work; setup and run instructions are added here as it is built.

## Principles

- Quality and honesty first. Every public number is labelled, sourced and disclaimed; estimates are estimates, simulations are simulations, placeholders are marked.
- Privacy by design. Data minimisation, explicit consent, EU data residency, GDPR from day one.
- Security first. The lead database is treated as the crown jewel.
- Performance is a feature, enforced as a hard budget.
- Operable by a non-technical owner.
