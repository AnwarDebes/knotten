## PVGIS solar resource and PV yield: Roedberg, Lindesnes (~58 deg N)

### What PVGIS is and provides

PVGIS (Photovoltaic Geographical Information System) is a free tool from the European Commission Joint Research Centre (JRC), developed at JRC Ispra since 2001. For any location it estimates annual and monthly PV energy output, in-plane solar irradiation, optimal tilt and orientation, year-to-year variability (standard deviation), and a breakdown of system losses. It serves grid-connected PV, tracking systems, off-grid/battery systems, monthly and daily radiation, and typical meteorological year (TMY) data.

### Databases for Europe

The default radiation database for Europe in PVGIS 5.3 is PVGIS-SARAH3 (satellite-derived, 2005-2023, about 5 km resolution). PVGIS-SARAH2 (2005-2020) and the global reanalysis PVGIS-ERA5 (2005-2023, about 25 km) are also available; satellite data is preferred over reanalysis where coverage exists.

### How to query it

Use the interactive web tool (re.jrc.ec.europa.eu/pvg_tools/en/) or the non-interactive HTTP/JSON API. Entry points: PVGIS 5.3 at https://re.jrc.ec.europa.eu/api/v5_3/ and PVGIS 5.2 at .../v5_2/. Tools include PVcalc, seriescalc, MRcalc, DRcalc, tmy and printhorizon. Mandatory parameters are lat, lon, peakpower and loss; common options are angle, aspect, optimalangles, raddatabase and outputformat (json, csv or basic for PVcalc; the epw format is available only for the tmy tool, not for PVcalc). The rate limit is about 30 calls/second per IP.

### Indicative yield for the site (estimate)

A live PVGIS 5.3 PVcalc query for 58.02 deg N, 7.05 deg E (representative of Roedberg, Lindesnes), 1 kWp, 14% loss, PVGIS-SARAH3, returns:

- Optimal angles (slope 43 deg, azimuth 5 deg): about 1020 kWh/kWp/year (in-plane irradiation about 1239 kWh/m2/year).
- Fixed 35 deg tilt facing due south: about 1012 kWh/kWp/year.

A realistic indicative specific yield for southern Norway is therefore on the order of 1000-1020 kWh/kWp/year. This is an estimate only: actual output depends on exact coordinates, horizon shading, snow cover, module and inverter quality, soiling, degradation and the assumed losses.

### Licence and attribution

PVGIS material is reusable under the Creative Commons Attribution 4.0 International (CC BY 4.0) licence, per Commission Decision 2011/833/EU: reuse is allowed provided appropriate credit is given and changes are indicated. Attribute results to "PVGIS, European Commission Joint Research Centre (JRC)". No single mandatory citation string is published; confirm preferred wording with JRC-PVGIS@ec.europa.eu before public use.

## Kilder / Sources

Checked June 2026:

- https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/getting-started-pvgis/api-non-interactive-service_en
- https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/getting-started-pvgis/pvgis-user-manual_en
- https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/pvgis-background-information_en
- https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=58.02&lon=7.05&peakpower=1&loss=14&optimalangles=1&outputformat=json
- https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=58.02&lon=7.05&peakpower=1&loss=14&angle=35&aspect=0&outputformat=json
- https://commission.europa.eu/legal-notice_en

Note: PVGIS versions, default databases, API endpoints, licence terms and yield figures change and must be re-verified before public use.
