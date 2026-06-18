# SPEC-26: Deployment, observability, handover and demo

## Purpose

Sigve Simonsen AS is a small contractor selling an energy-smart coastal development at Rødberg, Sniksfjorden (Lindesnes, Agder), with no IT department. The platform is worthless if it cannot be deployed safely, watched while it runs, and operated by a non-developer once the build session ends. This spec puts the site live (still gated until go-live approval), proves it is monitored and recoverable, hands the owner plain runbooks for every routine task, and equips a five-minute walkthrough that lets Sigve himself show the work to partners and Lindesnes kommune with confidence.

## Scope

- Production deployment: frontend on Vercel; PostgreSQL in the EU/EEA; Plausible (EU, cookieless) analytics; transactional email in the EU/EEA. Site access-gated and `noindex` until go-live approval.
- Production configuration and secrets documented (never committed), provisioned via the platform secret stores.
- Observability: error tracking with PII scrubbing, an external uptime check, structured application logging, and alerting to the owner.
- Database backups with a documented and tested restore.
- Runbooks for: deploy, rotate secrets, restore the database, handle a DSAR or erasure, use the admin and content layer, and incident response.
- A handover README and a five-minute demo walkthrough script for Sigve Simonsen.

## Dependencies

- SPEC-00 (engineering baseline, CI gate, EU database, email provider, secret handling).
- SPEC-23 (security hardening and threat model: headers, CSP, secret hygiene).
- SPEC-22 (SEO, performance and accessibility budgets verified in production).
- SPEC-06 and SPEC-07 (consent engine and admin: the DSAR, erasure and audit surfaces the runbooks operate).
- SPEC-08 (Plausible analytics) and SPEC-09 (admin-editable content layer).

## Data

- No new client personal data. Error traces and application logs are PII-scrubbed; backups inherit EU/EEA residency and the SPEC-10 retention rules.
- Configuration values (controller identity, provider keys, alert recipient, go-live date) are read from secrets and config, with PLACEHOLDER entries recorded in `docs/INPUTS-NEEDED.md` until supplied.

## Acceptance criteria

- [ ] A working production deployment, access-gated and `noindex` until go-live approval.
- [ ] Error tracking (PII-scrubbed), uptime check, logging and alerting are active and verified.
- [ ] A database backup is restored in a test and the restore is documented.
- [ ] A non-developer can deploy, rotate secrets, restore the database, action a DSAR/erasure, edit content and follow incident response from the runbooks alone.
- [ ] The handover README is complete; the five-minute demo script lands the wow.
- [ ] §8 performance budget and WCAG 2.2 AA hold in production.

## Task checklist

- [ ] Provision Vercel, EU PostgreSQL, Plausible and EU email; wire production config and secrets (not committed).
- [ ] Apply the access gate and `noindex` until approval; document the go-live flip.
- [ ] Stand up error tracking with PII scrubbing, the uptime check, structured logging and owner alerting.
- [ ] Enable scheduled backups; perform and document a full test restore.
- [ ] Write the six runbooks under `docs/runbooks/` and the handover README.
- [ ] Write and rehearse the demo walkthrough script for Sigve Simonsen.

## Guardrails

- Privacy: personal data and email stay in the EU/EEA; error traces and logs are PII-scrubbed; backups follow SPEC-10 retention and erasure. The public buyer-value tools remain stateless and collect no personal data; any "email my results" routes only through the consented SPEC-06 flow.
- Honesty: every estimate on the live site is labelled, sourced and disclaimed as indikativt; placeholders stay visibly marked until real client data lands.
- Performance: within the §8 budget in production (initial route JS at most about 120 KB gzip, LCP under 2.5 s, INP under 200 ms, CLS under 0.1), measured on a mid-range mobile device.
- Accessibility: WCAG 2.2 AA verified on the deployed site, including the access gate and admin entry.

## Out of scope

- Multi-region or high-availability infrastructure and CDN beyond the Vercel default.
- A CI/CD redesign beyond the SPEC-00 pipeline; load and penetration testing (SPEC-23/24).
- Paid on-call, a managed SOC, or third-party uptime SLAs.
- Domain purchase, DNS ownership transfer and final brand assets from the developer.
