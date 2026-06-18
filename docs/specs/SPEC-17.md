# SPEC-17: Fremdrift timeline and FAQ

## Purpose

A small groundwork contractor selling an energy-smart coastal development at Rødberg is asking buyers to commit interest in something that is still pre-regulering, pre-salgsstart and without final plot data. That gap breeds anxiety: when can I move in, who actually owns the shared battery, what happens if I sell, is the energideling story real. This spec answers those questions plainly. An honest fremdrift timeline sets expectations without overpromising dates, and a genuinely useful FAQ converts the energy concept from a sales claim into something a cautious buyer can verify. Both reduce the friction between interest and registration.

## Scope

Two admin-editable, public modules under the Verktøy hub and linked from relevant pages: (1) a fremdrift timeline showing the stages (regulering, bygging, innflytting) with the current stage marked and concrete next steps, and (2) a structured FAQ covering how energideling works, who owns and maintains the shared battery, what happens if you sell, garantier, and the Enova/Norgespris/strømstøtte angle. Both render in NO (default) and EN. Factual FAQ answers carry citations; forward-looking timeline dates carry a forbehold. A persistent Meld interesse CTA accompanies both.

## Dependencies

- SPEC-01 (design tokens, accessible accordion, timeline and badge components, motion signature).
- SPEC-02 (Verktøy hub, page shells, NO/EN catalogues, the "hva skjer videre" block and CTA pattern).
- SPEC-09 (admin-editable content layer: timeline stages and FAQ entries are CMS-lite content, not hardcoded).
- SPEC-10 (Din strømtrygghet) for cross-links from FAQ answers on strømstøtte and Norgespris.

## Data

- Timeline stages: data-driven from SPEC-09 (stage id, label, status, indicative dates, next-step text, NO/EN). Real fremdrift dates are UNKNOWN and held as marked placeholders; see docs/INPUTS-NEEDED.md.
- FAQ entries: SPEC-09 content (question, answer, optional citation, category, locale).
- Factual anchors for answers: energideling on one gnr/bnr since 1 Oct 2023, at most 1 MW (AC) per property, fordelingsnøkkel equal or static, extended to a business area from 1 Jan 2026; plusskunde feeds at most 100 kW and pays no nettleie or avgifter on self-consumed kWh; strømstøtte covers 90% of spot above 77 øre/kWh ex VAT (96.25 incl.), up to 5000 kWh/month, scheme decided through 31 Dec 2029; Norgespris 50 øre/kWh incl. VAT (40 in the north), meter-bound through 2026. Sources cited per docs/research/.
- No personal data of any kind.

## Acceptance criteria

- [ ] Timeline and FAQ are fully admin-editable through SPEC-09; nothing is hardcoded.
- [ ] Timeline shows regulering, bygging and innflytting with the current stage and next steps; dates are placeholders carrying a forbehold.
- [ ] Every factual FAQ answer (energideling, battery ownership and maintenance, selling, garantier, Enova/Norgespris/strømstøtte) is accurate and cited.
- [ ] Both modules render in NO and EN with parity.
- [ ] WCAG 2.2 AA: keyboard-operable accordion and timeline, visible focus, AA contrast, correct ARIA.
- [ ] Within the performance budget; demonstrably reduces buyer anxiety (clear next steps, plain answers, a CTA).

## Task checklist

1. Define the SPEC-09 content shapes for timeline stages and FAQ entries (NO/EN, status, citation field).
2. Build the timeline component (stage states, current marker, next-step copy) from design-system parts.
3. Build the FAQ as an accessible, categorised accordion with cited answers and SPEC-10 cross-links.
4. Author the factual answers from docs/research/ with inline citations and forbehold on forward-looking items.
5. Wire both into the Verktøy hub and relevant pages; place the Meld interesse CTA.
6. Accessibility pass (axe + manual keyboard), Lighthouse and bundle-budget check, NO/EN copy review.

## Guardrails

- Privacy: stateless, collects no personal data; any "email my results" routes only through the consented SPEC-06 flow; analytics is Plausible (EU, cookieless), no cookie banner.
- Honesty: every estimate or date is labelled indikativt and carries forbehold (ikke et tilbud); every factual answer is sourced; scheme answers note the through-2029 horizon and that rules can change.
- Performance: within the SPEC-08 budget (initial route JS at most about 120 KB gzip, LCP under 2.5 s, INP under 200 ms, CLS under 0.1, Lighthouse mobile at least 95); no 3D.
- Accessibility: WCAG 2.2 AA throughout; reduced-motion respected.

## Out of scope

- Live construction tracking, per-buyer milestones or notifications.
- Aktuelt news posts (SPEC-19) and the partner kit (SPEC-20).
- The admin editing surface itself (SPEC-09) and lead handling (SPEC-06, SPEC-07).
- Legal, financial or warranty advice; answers are informational and cite primary sources.
