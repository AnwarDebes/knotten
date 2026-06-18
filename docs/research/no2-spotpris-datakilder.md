## NO2 spot price data sources

This note evaluates public sources for NO2 (and other Norwegian zone) electricity spot prices, both historical and live, for a price-resilience tool. Values were checked in June 2026.

### Recommendation

Use **hvakosterstrommen.no** as the primary source and the **ENTSO-E Transparency Platform** as the fallback and upstream cross-check.

### Primary: hvakosterstrommen.no public API

A free, key-less JSON API returns hourly day-ahead prices per bidding zone (NO1-NO5):

```
GET https://www.hvakosterstrommen.no/api/v1/prices/[YEAR]/[MM]-[DD]_[AREA].json
```

A live fetch of `2026/06-18_NO2.json` returned 24 hourly records, each with `NOK_per_kWh`, `EUR_per_kWh`, `EXR` (Norges Bank EUR-NOK rate), `time_start` and `time_end` (ISO 8601). Prices exclude VAT. History runs from 1 December 2021; next-day prices appear around 13:00 the previous day. The underlying data is ENTSO-E, converted to NOK using Norges Bank rates.

Cost: free, for any use. The provider requests (rather than strictly mandates) a visible credit, either the text link below or an image badge it offers:

> Strompriser levert av Hva koster strommen.no

linking to https://www.hvakosterstrommen.no. No formal rate limit is published, so cache the daily files (they change at most once per day) and treat availability as best-effort.

### Fallback: ENTSO-E Transparency Platform

The authoritative pan-European source (and the upstream feed behind the primary). Registration is free; a RESTful API token is requested by emailing transparency@entsoe.eu with subject "Restful API access" and is typically issued within about three working days. It returns XML day-ahead prices per bidding zone (NO2 included) with longer history. A defined list of open data is offered under CC-BY 4.0 with attribution to ENTSO-E; the exact wording and scope should be confirmed on the live Legal Terms and Conditions before public reuse. EUR/MWh values must be converted to NOK/kWh in-app.

### Not recommended

**Nord Pool** is the original market operator but its data API is a paid, licensed product (API account around EUR 350/year; redistribution licences from several thousand EUR/year), so it is not license-clean for free public republishing. **Statnett/Elhub** mainly expose system and consumption data rather than a clean public spot-price feed; useful for context, not as the price source.

### Build notes

Display `NOK_per_kWh` as the spot component, and add VAT (25%), grid tariff (nettleie) and any support scheme separately for a consumer total. Keep the ENTSO-E path implemented so the tool degrades gracefully if the primary source is unavailable.

## Kilder / Sources

All URLs checked June 2026:
- https://www.hvakosterstrommen.no/strompris-api
- https://www.hvakosterstrommen.no/api/v1/prices/2026/06-18_NO2.json
- https://transparency.entsoe.eu/
- https://transparencyplatform.zendesk.com/hc/en-us/articles/40921911218961-Legal-Terms-and-Conditions
- https://www.amsleser.no/blog/post/21-obtaining-api-token-from-entso-e
- https://www.nordpoolgroup.com/en/services/power-market-data-services/
- https://www.statnett.no/en/for-stakeholders-in-the-power-industry/data-from-the-power-system/

Note: rules, rates and licence terms change and must be re-verified before public use.
