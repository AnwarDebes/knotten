# Research and source verification

Verified reference material for the Knotten platform and concept documents. Each note records the relevant Norwegian regulation, standard or data source with citations to primary or authoritative sources. Everything here was checked in June 2026.

Standing rule: rules, rates and licence terms change. Every figure used in public-facing copy or in a calculator must be re-verified against its primary source before go-live, and every public number must be labelled an estimate where appropriate, with its assumptions and source shown.

## Notes

- [plusskunde-og-energideling.md](plusskunde-og-energideling.md): prosumer (plusskunde) rules, grid-tariff treatment, and the energy-sharing scheme on one property.
- [byggteknisk-energistandard.md](byggteknisk-energistandard.md): TEK17 energy frames, NS 3031, passivhus (NS 3700/3701), plusshus, energimerking.
- [strompris-og-stotteordninger.md](strompris-og-stotteordninger.md): NO2 price zone, stroemstoette and Norgespris support schemes.
- [no2-spotpris-datakilder.md](no2-spotpris-datakilder.md): public data sources for NO2 spot prices (primary and fallback).
- [solenergi-pvgis.md](solenergi-pvgis.md): PVGIS solar resource and indicative PV yield at the site.
- [terreng-og-geodata.md](terreng-og-geodata.md): Kartverket elevation data, orthophoto licensing, OpenStreetMap.
- [personvern-og-analyse.md](personvern-og-analyse.md): Google Analytics transfer issues, cookieless analytics, cookie-consent reasoning.
- [enova-og-ssb-forbruk.md](enova-og-ssb-forbruk.md): Enova support schemes and SSB household energy-use baselines.
- [termisk-lagring-og-v2g.md](termisk-lagring-og-v2g.md): thermal/sand storage and vehicle-to-grid maturity.
- [nybygg-konvensjoner.md](nybygg-konvensjoner.md): Norwegian new-build marketing conventions and illustration/AI disclosure.
- [beliggenhet-rodberg-lindesnes.md](beliggenhet-rodberg-lindesnes.md): verified location facts for Roedberg, Sniksfjorden, Lindesnes.

## Key figures (verified June 2026, re-verify before publishing)

These are the headline numbers the calculators, the energy concept and the concept documents share, so they stay internally consistent.

| Topic | Figure | Notes and source |
|-------|--------|------------------|
| Price zone | NO2 (Soervest-Norge) | Lindesnes is in NO2; historically high and volatile. |
| Stroemstoette (2026) | State covers 90% of spot above 77 øre/kWh ex VAT (96.25 øre incl.), hourly per zone, up to 5000 kWh/month | The support scheme is decided to run through 31 Dec 2029, not 2026. |
| Norgespris | Fixed 50 øre/kWh incl. VAT (40 in VAT-exempt north), from 1 Oct 2025 | Optional, meter-bound through 31 Dec 2026 (then re-order); scheme decided through 2029. Caps: 5000 kWh/month home, 1000 fritidsbolig. |
| Plusskunde feed-in limit | At most 100 kW to the grid | No nettleie or levies on self-consumed kWh; no fastledd for innmating. |
| Energy sharing | Same property (gnr/bnr) since 1 Oct 2023; at most 1 MW (AC) per property; from 1 Jan 2026 also same business area | Shared self-produced kWh avoid energiledd and elavgift; fordelingsnoekkel equal or static. |
| Feed-in fastledd | 2.40 øre/kWh ex VAT (DSO, 2026), 1.40 (Statnett) | Applies only to innmatingskunder over 100 kW, NOT to plusskunder. 1.98 was the 2025 rate. |
| Passivhus | Net heating about 15 kWh/m2 per year (homes over 250 m2), airtightness n50 = 0.6, balanced ventilation about 80% heat recovery | NS 3700:2013 (homes), NS 3701:2012 (commercial). |
| TEK17 energy frames | Smaahus 100 + 1600/m2; boligblokk 95 kWh/m2; renewable-electricity allowance 10/20 kWh/m2 | TEK17 section 14-2; NS 3031:2014 method. |
| Energimerking | Scale A to G; passivhus typically reaches B; A generally needs solar or heat pump | Enova energimerking. |
| Solar yield (site) | About 1000 to 1020 kWh/kWp per year, indicative | PVGIS 5.3 PVcalc at about 58 deg N; estimate only. |
| Household baseline | About 14,700 kWh electricity / 17,200 kWh total per year (2024) | SSB; 2022 values 14,964 / 17,518. |
| Enova support | Solar PV 25% up to 2500 kr/kW; storage 25% up to 10,000 kr; smart water heater 25% up to 4000 kr | Verify current amounts at enova.no before citing. |
| Sand battery | Kankaanpaeae 200 kW / 8 MWh (60 to 75% efficiency); Pornainen 1 MW / 100 MWh | Heat output, not electricity; community-scale use is a concept requiring engineering study. |
| Terrain data | Kartverket Hoydedata DTM/DOM, CC BY 4.0, commercial use allowed | Orthophoto (Norge i bilder) is Geovekst-licensed, NOT open. OpenStreetMap is ODbL. |
| Analytics | Plausible (EU, cookieless) avoids the GA US-transfer issue and the cookie banner | DPF adequacy in force but under appeal (case C-703/25 P). |

## Corrections applied after the fact-check

The adversarial verification pass corrected several first-pass figures, now reflected in the notes above:
- Support schemes run through 2029, not 2026 (2026 is only the current Norgespris price period).
- The 2026 feed-in fastledd is 2.40 / 1.40 øre/kWh and applies only to large feed-in customers, not to plusskunder.
- The Kankaanpaeae sand battery runs at 60 to 75% efficiency, not 85%.
- In a nybygg prospekt, the technical description (leveransebeskrivelse/romskjema) governs over illustrations, not the floor plan.
