# ADR-0004: Plausible (EU, cookieless) for analytics

## Status

Accepted, 2026-06-18.

## Context

The client needs to answer two questions about the site: how many people are interested, and where they come from. This is a marketing and lead-qualification need, not a behavioural-profiling one. The data we actually need is aggregate: page-view counts, traffic sources (search, referral, direct, campaign), and a small number of conversion events.

The default tool for this job, Google Analytics, carries a known legal problem in our jurisdiction. Several EU data protection authorities (Austria, France, and Italy among them) have ruled that standard Google Analytics deployments are non-compliant with the GDPR, because the service transfers personal data (IP addresses, identifiers) to the United States without adequate safeguards. Even after the 2023 EU-US Data Privacy Framework, the legal position remains contested and exposed to challenge. For a project where the client is a Norwegian/EEA actor and the public copy already commits to keeping email and database in the EU/EEA only, importing this risk for the sake of a visitor counter is not a defensible trade.

The project is also still in a data-driven, placeholder state: unit and plot counts are unknown, there is no real site photography, and every public figure is labelled as an estimate. Analytics here serves to measure interest in that placeholder material, not to track named prospects.

## Decision

Use Plausible Cloud (EU region) as the single analytics tool for the site.

Scope of what is collected:
- Page views.
- Traffic sources.
- Goal events: interest-form completion, prospekt download, and each tool use (one goal per interactive tool).

Plausible is cookieless and stores no personal data; visitor counting is done without persistent identifiers. Data is processed and hosted in the EU.

Google Analytics and the Meta Pixel are excluded. This is not a default-until-reconsidered choice: neither tool is to be added to this site.

## Alternatives considered

- **Google Analytics.** Rejected. It meets the feature need easily and is free, but it is the specific tool that EU supervisory authorities have found non-compliant, and it relies on cookies and US data transfer. Adopting it would contradict the EU-only data commitment and would force a cookie-consent banner. The legal exposure outweighs the convenience.

- **Self-hosted Umami.** A credible privacy-first, cookieless option that would keep data fully under our control. Rejected for now on operational grounds: it adds a server, a database, patching, backups, and uptime responsibility to a project that is still pre-launch and placeholder-driven. The marginal control benefit over Plausible Cloud (EU) does not justify standing up and maintaining additional infrastructure at this stage. Worth revisiting if hosting consolidates or if data-residency requirements tighten beyond "EU region".

- **No analytics.** Rejected. It is the strongest privacy posture and zero maintenance, but it leaves the client's two core questions (how many, from where) unanswerable, which defeats a stated purpose of the site.

## Consequences

- **No cookie-consent banner is required.** Because Plausible is cookieless and stores no personal data, the site avoids the consent banner that Google Analytics would have forced. This rationale is documented in the privacy work so the position is defensible and traceable.

- **Interest is measurable.** The three goals (interest-form completion, prospekt download, and each tool use) give a direct read on conversion and engagement, and source data answers the "from where" question. This is the intended payoff of choosing analytics at all.

- **No personal data leaves the EU.** The choice is consistent with keeping email and database in the EU/EEA only, and it removes the US-transfer exposure that made Google Analytics non-compliant.

- **Recurring cost.** Plausible Cloud is a paid subscription, unlike free Google Analytics. This is accepted as the price of compliance and is modest at the expected traffic level.

- **Less granular data.** Cookieless, aggregate measurement means no cross-session user journeys, no individual-level funnels, and no demographic enrichment. For the stated questions this is sufficient; if deeper behavioural analysis is ever needed, it must be designed to stay within the same cookieless, EU-only constraints rather than by reaching for the excluded tools.

- **Vendor dependency.** We rely on Plausible's EU hosting and continuity. The Umami path remains the documented fallback if self-hosting becomes preferable, and because the goal set is small and standard, migration would be low-cost.
