# Architecture decision records

Each record captures one significant decision, its context, the alternatives weighed, and the consequences. Records are immutable once accepted; a later decision that changes course is added as a new record that supersedes the old one.

| ADR                                           | Decision                                                        | Status   |
| --------------------------------------------- | --------------------------------------------------------------- | -------- |
| [0001](0001-web-framework-and-hosting.md)     | Next.js App Router on Vercel                                    | Accepted |
| [0002](0002-backend-route-handlers.md)        | Next.js Route Handlers as the backend (no separate API service) | Accepted |
| [0003](0003-database-and-orm.md)              | Managed PostgreSQL in the EU with Drizzle ORM                   | Accepted |
| [0004](0004-analytics.md)                     | Plausible (EU, cookieless) for analytics                        | Accepted |
| [0005](0005-styling-and-component-library.md) | Tailwind with an owned shadcn/ui-based component library        | Accepted |
| [0006](0006-internationalisation.md)          | next-intl with Norwegian default and English parity             | Accepted |
| [0007](0007-transactional-email.md)           | EU-resident transactional email provider                        | Accepted |
| [0008](0008-admin-authentication-and-mfa.md)  | Admin authentication with TOTP multi-factor                     | Accepted |
| [0009](0009-maps.md)                          | MapLibre GL with OpenStreetMap for the neighbourhood map        | Accepted |
| [0010](0010-three-d-showpiece.md)             | React Three Fiber for the single 3D terrain showpiece only      | Accepted |
| [0011](0011-performance-budget.md)            | Performance budget enforced in CI                               | Accepted |
| [0012](0012-content-layer.md)                 | Database-backed content layer with ISR revalidation             | Accepted |
| [0013](0013-anti-abuse-and-rate-limiting.md)  | Anti-abuse for public forms                                     | Accepted |
| [0014](0014-secrets-and-configuration.md)     | Secrets via environment and platform secret manager             | Accepted |

Provider choices (database host, email provider, captcha) are recorded as the current EU-resident defaults and are confirmed with the developer before production; see OPEN-QUESTIONS.
