# SPEC-25: Concept deliverables

## Purpose
Sigve Simonsen AS is a small groundwork contractor, not an energy or property-marketing firm. The website proves the idea works; this spec produces the documents that let the contractor act on it: pitch the kommune, brief partners and investors, decide what to actually build, and sell. The deliverables turn the platform's models and copy into board-ready artefacts in plain Norwegian, every number traceable back to a source, so the contractor can stand behind them in a meeting without an engineer present.

## Scope
A coherent set of exported deliverables, all sharing the platform's numbers and wording:
- Energikonsept (docx): the technical and energy concept (passivhus, sol, lagring, deling, V2G/V2H, robusthet).
- Feasibility briefs, one per option (solar, wind, geothermal, storage, shared base/energy sharing, V2G/V2H), each with assumptions, sources and a verification note.
- An editable energy model (xlsx, PVGIS-sourced) the contractor can adjust as plot count and design firm up.
- Reguleringsplan recommendations (energy- and infrastructure-relevant input to the planning process).
- Robusthet og beredskap (resilience and preparedness rationale).
- Markedsstrategi og GTM plus prospekt content.
- A kommune/partner deck (pptx), minimal and self-explanatory.
- A privacy policy (NO/EN) drafted for the contractor's legal review.
- A non-technical Norwegian overview tying it together for Sigve Simonsen AS.

## Dependencies
- SPEC-02 (NO/EN content, IA: the prose and catalogs the docs draw from).
- SPEC-03 (energy concept experience: the narrative source for Energikonsept).
- SPEC-05 (tested calc modules: demand, solar yield, self-sufficiency, feeding the xlsx).
- SPEC-06 (consent engine: the privacy policy must match the actual lead flow).
- SPEC-08 (analytics: privacy policy reflects Plausible, cookieless).
- SPEC-10, SPEC-11 (price-resilience and månedskostnad figures the prospekt cites).
- SPEC-20 (kommune/partner kit: the deck and downloads live here).

## Data
- Energy figures reuse SPEC-05 outputs: solar about 1000-1020 kWh/kWp/year (PVGIS, indicative), SSB baseline about 14,700 kWh electricity / 17,200 kWh total per year, passivhus net heating about 15 kWh/m2/year.
- The xlsx carries inputs (plot count, m2, kWp, battery, profile) as editable cells with documented formulas, not hard-coded results.
- PLACEHOLDER: plot/unit count is UNKNOWN ("8" was internship positions, not homes); no per-plot consumption, gnr/bnr or site photography exists. Every document is parameterised against these placeholders and the gaps are recorded in INPUTS-NEEDED.

## Acceptance criteria
- [ ] Professional, presentable artefacts in the stated formats (docx, xlsx, pptx, NO/EN policy).
- [ ] Internally consistent: numbers match across docs, the site, the tools and the spreadsheet.
- [ ] Every estimate is labelled, sourced and dated; nothing unverified is presented as fact.
- [ ] Each feasibility brief states its assumptions, sources and a verification note.
- [ ] Decks are minimal and self-explanatory; the lay overview needs no engineer to read.
- [ ] Privacy policy reflects the real data flow and is marked for legal review.

## Task checklist
- [ ] Build a single shared figures source so every export reads the same numbers as the site.
- [ ] Author the Energikonsept (docx) from SPEC-03.
- [ ] Write the six feasibility briefs with per-brief assumptions, sources and verification notes.
- [ ] Build the editable, PVGIS-sourced energy model (xlsx) with documented formulas.
- [ ] Draft reguleringsplan recommendations and robusthet og beredskap.
- [ ] Write markedsstrategi/GTM and prospekt content; assemble the kommune/partner deck (pptx).
- [ ] Draft the NO/EN privacy policy for legal review and the non-technical Norwegian overview.
- [ ] Cross-check all figures against the site and tools; verify formats open cleanly.

## Guardrails
- Privacy: the deliverables are buyer-facing reference material, stateless, and contain no personal data; the privacy policy describes the consented SPEC-06 flow and Plausible (cookieless, EU/EEA only) and is sent for legal review, not relied on as final.
- Honesty: every estimate is labelled an indikativt estimat, carries its source and date, and states "ikke en garanti, krever profesjonell verifikasjon"; placeholders are shown as placeholders; no invented site photos or plot counts.
- Performance: where these are downloadable from the site (SPEC-20), they sit within the §8 budget (initial route JS at most about 120 KB gzip; LCP under 2.5 s, INP under 200 ms, CLS under 0.1; Lighthouse mobile at least 95) and load behind a link, not in the bundle.
- Accessibility: download pages and any in-page rendering meet WCAG 2.2 AA (keyboard, contrast, labels); the lay overview is written in plain language.

## Out of scope
- Legal sign-off of the privacy policy and any binding planning or regulatory submission.
- Final, committed figures: all numbers stay indicative until plot count, design and site data are confirmed.
- Print production, branding collateral beyond the deck, and third-party financial modelling.
- Real site photography or renders presented as final (honest placeholders only).
