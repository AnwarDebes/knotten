# ADR-0007: EU-resident transactional email provider

## Status

Accepted, 2026-06-18.

## Context

Lead capture requires two outbound email flows:

1. Double opt-in confirmation to the prospective subscriber. No address enters the active list until the recipient confirms via a unique link.
2. Notification to the site administrator when a new lead is captured.

Both flows process personal data (email addresses, and in the admin notification any context the lead chose to submit). The project constraint is unambiguous: all data processors must be resident in the EU/EEA, consistent with the rest of the stack (analytics via Plausible EU, database in the EU/EEA). This avoids any transfer of personal data to a third country and keeps the processing record short and defensible.

A transactional email provider is preferred over running mail delivery in-house: deliverability (SPF, DKIM, DMARC alignment, reputation management, bounce and complaint handling) is operationally demanding, and getting it wrong means confirmation emails land in spam, which silently breaks the opt-in flow.

The provider sits in the data path as a processor, so a data processing agreement (DPA) is mandatory before any real personal data passes through it.

## Decision

Use an EU/EEA-resident transactional email provider for the double opt-in confirmation and the admin lead notification. The default candidate is Resend configured to its EU region, with the DPA on file before production use.

Emails carry no tracking pixels. There is no open-tracking beacon and no click-redirect wrapping for the purpose of behavioural measurement. The confirmation link is functional (it is the opt-in mechanism), not an analytics instrument. This keeps email consistent with the cookieless, no-banner posture used elsewhere on the site and avoids processing engagement data that serves no purpose here.

Region pinning is part of the decision, not an implementation detail: the provider must be configured so that message data is stored and processed within the EU/EEA. A provider that is "EU-headquartered" but routes message content through US infrastructure does not satisfy the constraint.

## Alternatives considered

**Resend (EU region), chosen.** Modern API, first-class EU region, clear DPA, straightforward DKIM/DMARC setup. Smaller and younger than the incumbents, so the dependency carries some vendor-maturity risk. Accepted because the EU region and the developer-facing API fit the stack with the least integration effort, and migration away is cheap (the integration surface is one outbound send call behind an interface).

**Postmark (EU data residency).** Strong transactional-email reputation and deliverability, mature tooling, EU data residency available. Viable and arguably the safest on deliverability track record. Not selected as default because it offers no decisive advantage over Resend for this small workload while being a heavier commercial relationship; it remains the primary fallback if Resend's EU residency or deliverability proves inadequate.

**Norwegian SMTP provider.** Keeps data in-country (the strongest possible residency story) and supports Norwegian-language support channels. Rejected as default because plain SMTP providers typically lack the transactional features that make double opt-in reliable (per-message event handling, suppression lists, structured bounce/complaint feedback), and offerings vary widely in deliverability engineering. A specific Norwegian provider that exposes a proper transactional API with a DPA would be reconsidered, but none was identified as clearly superior to the EU-region SaaS options.

**Self-hosted SMTP (own mail server).** Maximum control and no third-party processor at all. Rejected: operating a deliverable outbound mail server is a continuous burden (IP reputation, blocklist monitoring, DKIM/DMARC/SPF maintenance, TLS, abuse handling). For a low-volume lead flow this is disproportionate effort, and a fresh sending IP routinely lands confirmation mail in spam, which directly undermines the opt-in mechanism. The operational risk outweighs the residency and control benefits.

## Consequences

- A DPA with the chosen provider must be signed and recorded in the processing record before any real recipient is contacted. No DPA, no production send.
- During development, only test addresses are used. Real recipients are contacted only after the provider is fully configured (region pinned, DKIM/DMARC verified, DPA on file) and the configuration has been reviewed and approved.
- The processing record lists the email provider as a processor, with its role (transactional delivery: opt-in confirmation and admin notification), data categories (email address and submitted lead context), and EU/EEA processing location.
- No engagement metrics are collected from email. Open and click rates are not available, which is acceptable: the only signal that matters for the opt-in flow is whether the confirmation link was followed, which is observable from the subscription state, not from a tracking pixel.
- Deliverability now depends on a third party. This is the intended trade: the provider's reputation and feedback loops are the reason for choosing managed delivery over self-hosting.
- The integration is kept behind a single send abstraction so that switching to Postmark EU (or another EU/EEA provider) requires changing configuration and one adapter, not the calling code. This bounds the vendor-maturity risk taken on with Resend.
- Region misconfiguration is the principal residency risk and must be verified explicitly (provider dashboard plus, where available, a documented confirmation of the data region), not assumed from the account's billing country.
