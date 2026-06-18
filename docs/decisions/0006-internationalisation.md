# ADR-0006: next-intl with Norwegian default and English parity

## Status

Accepted, 2026-06-18.

## Context

The site must ship in full Norwegian/English parity. Norwegian is the primary audience: copy must read as native Norwegian (correct æ/ø/å, idiomatic phrasing, domain terms like nettleie, fastledd, plusskunde, strømstøtte, Norgespris, energimerking), not as machine-translated English. English exists for non-Norwegian readers and must carry the same information, not a reduced subset.

The content is data-driven and largely provisional. Several public-facing figures are estimates and must be labelled as such: solar yield at the site is roughly 1000 to 1020 kWh/kWp per year (PVGIS, indicative), the SSB household baseline is about 14,700 kWh electricity / 17,200 kWh total per year, and passivhus net heating is about 15 kWh/m² per year for homes over 250 m². The unit/plot count is unknown (the figure "8" referred to student internship positions, not homes), and no real site photography exists yet, only honest placeholders. Project facts (Rødberg, Sniksfjorden, Lindesnes kommune in Agder, at the outlet of the Audna river, price zone NO2) and regulatory details (strømstøtte at 90% of spot above 77 øre/kWh ex VAT, Norgespris at 50 øre/kWh incl. VAT, plusskunde and energy-sharing limits) recur across pages and will be revised as data firms up.

Because copy is both bilingual and volatile, hard-coding strings into components would force parallel edits across two languages on every change, invite drift between locales, and make the estimate/placeholder status hard to audit. The chosen framework must keep all copy in a single editable surface per locale, drive routing and metadata from the active locale, and emit correct hreflang and canonical signals so search engines serve the right language without treating the two versions as duplicates.

The frontend is Next.js (App Router). Analytics is Plausible (EU, cookieless), so no locale choice introduces cookie-consent obligations; data and email stay in the EU/EEA.

## Decision

Use next-intl for internationalisation.

- Norwegian is the default locale, served under the `/no` path prefix; English is served under `/en`. Both locales use an explicit prefix (no implicit, prefix-less default) so every URL is unambiguous and self-describing.
- All user-facing copy lives in message catalogs (one per locale: `no`, `en`). Components reference message keys; they never embed display strings.
- Routing is locale-aware via next-intl middleware: locale negotiation, redirects, and link generation flow through the locale segment.
- Metadata is locale-aware: `<title>`, descriptions, Open Graph, and other head content are produced per locale from the catalogs and locale context.
- Each localized page emits `hreflang` alternates for `no` and `en` plus `x-default`, and a self-referential canonical URL, so the two language versions are linked as alternates rather than competing as duplicates.
- Estimate and placeholder labelling is encoded in the message text itself (for example, "indikativt"/"indicative", "anslag"/"estimate"), so the qualifier travels with the copy in both locales and cannot be lost when a string is reused.

## Alternatives considered

- next-i18next: mature and widely used, but its design center is the Pages Router and the broader i18next runtime. On the App Router it adds an adapter layer and a heavier dependency surface for capabilities (server components, locale-aware metadata, middleware routing) that next-intl provides natively. Rejected to avoid carrying i18next's runtime and configuration overhead for a two-locale App Router site.

- Hand-rolled i18n (custom message loading, a bespoke `t()` helper, manual routing and hreflang): maximum control and zero framework lock-in, but it reimplements locale negotiation, fallback, message loading, and head-tag generation that next-intl already handles correctly. The hreflang/canonical logic in particular is easy to get subtly wrong, and the maintenance burden is permanent. Rejected: the cost is ongoing and the upside over an established library is negligible at this scale.

- Single-language site with a client-side translation widget (for example a browser/Google translate overlay): cheapest to build, but it cannot deliver native Norwegian copy or a real English version. Machine output mistranslates domain terms (nettleie, fastledd, plusskunde) and regulatory wording, produces no per-locale URLs, and emits no hreflang, so search engines see one language. This directly fails the parity and "reads natively" requirements. Rejected.

## Consequences

- No hard-coded UI strings. Every display string is a message key resolved from the active locale's catalog; adding or changing copy means editing the catalogs, and a missing key in either locale is detectable rather than silently English.
- Parity is enforceable. The `no` and `en` catalogs are diffable, so gaps between locales surface as missing keys; Norwegian remains the source of truth for tone and terminology while English stays complete.
- Routing and metadata are locale-aware. URLs carry an explicit `/no` or `/en` prefix, navigation preserves the locale, and head content (title, descriptions, Open Graph) is generated per locale.
- hreflang and canonical URLs are generated. Each page links its `no`, `en`, and `x-default` alternates and declares its own canonical, giving search engines correct language targeting and avoiding duplicate-content penalties.
- Estimate and placeholder discipline is preserved across languages. Because qualifiers live in the message text, indicative figures (solar yield, SSB baseline, passivhus heating) and placeholders (unit count, imagery) stay labelled in both locales when copy is updated or reused.
- Operational cost: every new feature must add both catalog entries, and writers need Norwegian-language competence for the source copy rather than relying on translation. This is accepted as the price of genuine parity.
- Plausible (cookieless, EU) is unaffected by the locale split, so the bilingual routing introduces no consent or data-residency obligations.
