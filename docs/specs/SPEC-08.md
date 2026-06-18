# SPEC-08: Privacy-first analytics and interest measurement

## Purpose
Sigve Simonsen AS is a small groundwork contractor with no in-house marketing function, selling an energy-smart coastal development that is pre-salgsstart and pre-regulering. The platform's job is credible interest capture, so the one question the owner must be able to answer at any time is: how many people are interested, and where do they come from. This spec delivers that answer without surveilling visitors, without a cookie banner, and without exposing the firm to the legal risk that sank standard Google Analytics in Norway (Datatilsynet, Google Analytics-saken). Measurement here is a sales and credibility instrument the owner can read unaided, not an analytics project.

## Scope
- Integrate Plausible Cloud (EU, cookieless) across the NO and EN site.
- Track page views and referral sources.
- Define and fire goals: interest-form completion, prospekt download, and each buyer-value tool's use (savings, price-resilience, månedskostnad, sun, resilience, configurator).
- Surface a simple interest view for the client, or document how to read the Plausible dashboard in a runbook the owner can follow.
- Document the no-cookie-banner conclusion and its legal basis.

## Dependencies
- SPEC-00 (foundation, CI, performance budget, env handling).
- SPEC-02 (site IA and the pages where goals fire).
- SPEC-06 (interest form; its success state triggers the completion goal).
- SPEC-09 (prospekt and tool surfaces emit download and tool-use goals).

## Data
- No personal data. Plausible aggregates page views, sources and goal counts only; unique visitors derive from a salt rotated and deleted every 24 hours, with no raw IP or User-Agent stored, all data in the EU.
- Goal names and the analytics domain are configuration, kept in env (placeholder until the Plausible account and final domain are confirmed; recorded in INPUTS-NEEDED).
- Account ownership (developer vs Sigve Simonsen AS) is a placeholder pending the owner's decision.

## Acceptance criteria
- [ ] Analytics is cookieless and EU-hosted; no analytics cookies set, no consent prompt.
- [ ] Every defined goal fires reliably on NO and EN (verified in the live dashboard).
- [ ] The owner can answer "how many are interested and from where" via the interest view or the documented runbook.
- [ ] The no-cookie-banner conclusion is written down with its legal basis and DPF caveat.
- [ ] No personal data reaches Plausible; the script is in the bundle budget; passes the QA gate.

## Task checklist
- [ ] Add the Plausible script (deferred, self-hostable proxy optional) without blocking LCP.
- [ ] Wire goal events at the interest-form success, prospekt download, and each tool entry point.
- [ ] Configure goals in the Plausible account; smoke-test each in NO and EN.
- [ ] Build or document the interest view (top sources, goal trend over time).
- [ ] Write the no-banner conclusion into docs/privacy and a short owner runbook.
- [ ] Add a Data Processing Agreement reference for Plausible to the processing record.

## Guardrails
- Honesty: any count or trend shown to a visitor is labelled as an indicative measure, sourced to Plausible, and never presented as a sales figure.
- Privacy: the buyer-value tools stay stateless and collect no personal data; analytics carry no name, e-post, telefon or free text into goal properties; all data stays in the EU/EEA. The no-banner basis is the conservative one: no device storage (ekomlov paragraf 3-15) and no personal data (GDPR), so no consent is required; if residual data is ever judged personal, a fresh assessment follows.
- Performance: the analytics script stays out of the critical path and within the §8 budget (initial route JS at most about 120 KB gzip; LCP under 2.5 s, INP under 200 ms, CLS under 0.1).
- Accessibility: any interest view meets WCAG 2.2 AA (keyboard, contrast, non-colour-only encoding of trends).

## Out of scope
- Cross-site or cross-device tracking, A/B testing, heatmaps, session recording, advertising pixels (never GA or Meta Pixel).
- Personal-level reporting on individual visitors or attribution of a lead to a specific session.
- The lead store and consent records themselves (SPEC-06, SPEC-07).
