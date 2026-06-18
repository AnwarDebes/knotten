# ADR-0003: Managed PostgreSQL in the EU with Drizzle ORM

## Status

Accepted, 2026-06-18

## Context

The lead database is the crown jewel of this project. Leads, content records, and consent records all carry personal data and represent the single most sensitive asset under management. Two requirements dominate the design space:

1. **Data residency.** Personal data must stay within the EU/EEA. This is not a preference, it is a constraint that must hold across the host, its backups, and any replicas. Where the data lives is recorded in the processing record (behandlingsprotokoll) so the obligation is auditable.
2. **Small, well-bounded dataset.** The data model is modest: leads, content, and consent. There is no high-cardinality event stream, no analytics warehouse, and no need for horizontal sharding. Analytics are handled separately by Plausible (EU, cookieless), which keeps the operational database lean and free of tracking concerns.

The project must also be straightforward to hand over. A future maintainer should be able to read the schema, understand the queries, and reason about migrations without learning a heavyweight abstraction layer first. That favours a SQL-first stack with explicit, version-controlled migrations over a code-generation-heavy approach.

## Decision

Use a **managed PostgreSQL** database hosted in an **EU region**, with **Neon** as the default candidate host.

- **ORM: Drizzle.** Schema is defined in TypeScript, queries are SQL-first, and types flow from the schema to the call sites.
- **Parameterised queries only.** No string-concatenated SQL. All user-influenced values pass as bound parameters, which removes the most common SQL injection vector by construction.
- **Migrations committed to the repo.** Generated migrations are reviewed in pull requests and applied through the pipeline. The migration history is the source of truth for schema state, in development, staging, and production alike.
- **Least-privilege database user.** The application connects with a role scoped to the operations it actually performs (read/write on application tables). Schema-altering privileges are reserved for the migration step, not granted to the runtime role.

The region selection at provisioning time must be an EU/EEA region, and the chosen region is documented in the processing record. Backups and any read replicas inherit the same residency constraint.

## Alternatives considered

**Prisma ORM.** Mature, with a strong client and a large ecosystem. Rejected as the default because its abstraction sits further from SQL, its query engine adds a binary runtime dependency and a heavier footprint, and the generated client obscures the exact queries issued. For a small schema that must be easy to hand over, the SQL-first transparency of Drizzle is worth more than Prisma's higher-level conveniences. Prisma would be reconsidered if the data model grew substantially in relational complexity.

**Supabase as the host.** Attractive bundle (Postgres plus auth, storage, and edge functions) and EU regions are available. Rejected as the default because the project needs a database, not a platform: the additional surface (auth, RLS conventions, the Supabase client) is scope that is not required and would have to be governed and handed over. Postgres underneath is the same engine, so a later move to Supabase remains feasible without rewriting the data layer.

**Vercel Postgres as the host.** Convenient if deployment lands on Vercel. Rejected as the default because it is, in practice, a reseller layer over an underlying provider, which adds a contractual hop to reason about for residency and processing terms. Pinning residency and the data processing agreement is cleaner with a host where Postgres is the primary product. Neon being the engine behind several such offerings also reduces lock-in if the host changes.

**A non-Postgres store (for example a document database or a hosted key-value store).** Rejected because the data is inherently relational (leads relate to content and to consent records), consent handling benefits from transactional integrity and constraints, and Postgres gives mature tooling, strong typing through Drizzle, and a clear migration story. A schemaless store would trade away exactly the guarantees that a consent and lead database most needs.

## Consequences

**Positive.**

- Drizzle is lightweight and SQL-first, with strong typing and a small footprint. The schema reads like the database it describes, which lowers the cost of handover and of onboarding a new maintainer.
- Parameterised queries and a least-privilege runtime role narrow the attack surface: injection is closed off at the query layer, and a compromised application credential cannot alter the schema or escalate beyond its granted operations.
- EU residency is mandatory and is recorded for the processing record, so the data-protection obligation is satisfied and auditable rather than implicit.
- Migrations in the repository make schema changes reviewable, reproducible across environments, and reversible by inspection of history.
- Standard PostgreSQL underneath keeps the host replaceable. Neon is the default candidate, not a hard dependency; moving to another EU Postgres host is a connection-string and migration-replay exercise, not a rewrite.

**Negative / costs to accept.**

- Drizzle's ecosystem is smaller and younger than Prisma's. Some conveniences (rich introspection tooling, certain third-party integrations) are less developed, and edge cases occasionally require dropping to raw SQL. This is an acceptable trade given the small schema and the value placed on transparency.
- SQL-first means the team carries more SQL literacy. The abstraction does less hand-holding, which is the point, but it does assume comfort with relational modelling.
- Managed hosting introduces an external processor and an ongoing cost, and ties availability to the provider's region and SLA. The residency constraint also rules out hosts and regions that might otherwise be cheaper or closer to compute.
- The least-privilege split between the runtime role and the migration role adds a small amount of operational ceremony (a separate credential and a deliberate migration step) that must be respected in the deployment pipeline.
