import type { T } from "./core";

/**
 * The assumptions of the website's energy model that are not in the energy budget: the hourly simulation's own
 * settings (src/lib/sim) and what the house configurator adds for one house on its plot (src/lib/configurator/energy.ts).
 * They are model assumptions, not project figures. Every result that uses them is a model estimate and is shown as
 * "foreløpig" / "provisional". A public source is named where a figure has one; the rest are stated assumptions.
 */

/** Where an assumption comes from: a public source (with its own words where it has them) or "modellantakelse". */
export type ModelSource = { doc: T; url?: string; quote?: string };

const ASSUMED: ModelSource = { doc: { no: "Modellantakelse, nettsidens energimodell", en: "Model assumption, the website's energy model" } };

/** The simulation's own settings, shared by the energy simulator, the portal's figures and the configurator. */
export const SIM_SETTINGS = {
  /** Part of each home's 15 000 kWh of heat that is hot water; the rest heats the rooms. */
  dhw_share: 0.2,
  /** What a home battery charges and delivers at most, kW. */
  battery_kw: 5,
  /** Share of the battery held back for a power cut in daily use (the energy simulator's default). */
  reserve: 0.3,
  /** In a power cut with "essential circuits": the heat pump runs at half, everything else at a third. */
  essential: { heat_pump: 0.5, rest: 0.33 },
  source: ASSUMED,
};

/** The model's solar module, 430 Wp (1.134 x 1.762 m, the module the 3D model lays on the roofs). */
export const MODULE_KWP = 0.43;

/** Home charging of an electric car in the configurator: kilometres a year times kWh per kilometre. */
export const EV_CHARGING = {
  /** Kilometres a year per car: the average for Norwegian passenger cars in 2025. */
  km_per_year: 11350,
  km_year: 2025,
  /** kWh per kilometre for home charging: Statens vegvesen's figure for mid-size SUVs, the highest of its three segments. */
  kwh_per_km: 0.1623,
  /** The charger's power and the hours the car is at home: the same as the portal's smart-control page (kW, local hours). */
  charger_kw: 3.6,
  home_from: 17,
  home_to: 7,
  sources: {
    km: {
      doc: { no: "SSB, Kjørelengder (statistikkbanken tabell 12575), oppdatert 8. april 2026", en: "Statistics Norway, Driving distances (Statbank table 12575), updated 8 April 2026" },
      url: "https://www.ssb.no/transport-og-reiseliv/statistikker/klreg",
      quote: "«Gjennomsnittlig kjørelengde for norske personbiler var 11 350 kilometer i 2025.»",
    },
    kwh: {
      doc: { no: "Statens vegvesen, Energipris per 100 km, sist oppdatert 17. august 2026", en: "Norwegian Public Roads Administration, Energy price per 100 km, last updated 17 August 2026" },
      url: "https://www.vegvesen.no/nn/koyretoy/eige-og-vedlikehalde/kjoretoy-og-drivstoff/energipris-per-100-km/",
      quote: "El hjemmelading: 15,70 kWh (kompaktklasse), 14,90 kWh (mellomklasse) og 16,23 kWh (SUV mellomklasse) per 100 km, «beregnet ut fra de tre mest solgte bilmodellene i fjor innen hvert segment».",
    },
    window: ASSUMED,
  } satisfies Record<string, ModelSource>,
};

/**
 * Solar panels on a carport roof: a model assumption until the carport is drawn. Two rows of five of the model's
 * modules on a roof of about 3 x 6 m, facing the same way as the house, at 15 degrees (the lowest pitch in the energy
 * track's range for roof solar, 15 to 40 degrees). The shade of the house itself on the carport is not counted.
 */
export const CARPORT_PV = { rows: 2, per_row: 5, roof_w_m: 3, roof_l_m: 6, tilt_deg: 15, source: ASSUMED };

/**
 * Free cooling from the borehole field: the simulation has no cooling load, so only the circulation pump is counted,
 * a small constant draw through the summer months (local months 6 to 8).
 */
export const FREE_COOLING = { pump_w: 40, months: [6, 7, 8], source: ASSUMED };

/**
 * The winter power cut the configurator reports: the grid goes at 17:00 on every day of December, January and
 * February in the typical year; the figure is the median of how many hours the chosen circuits stay on, counted up to
 * three days.
 */
export const OUTAGE_DRILL = { months: [12, 1, 2], start_hour: 17, max_hours: 72, source: ASSUMED };

/**
 * The configurator's first paint, before the hourly model has answered (a fraction of a second on the page): a rough
 * share of the solar power used in the house, larger with a larger battery. Replaced by the hourly model's figure.
 */
export const QUICK_ESTIMATE = { self_use_base: 0.4, self_use_per_battery_kwh: 0.022, self_use_max: 0.9, source: ASSUMED };
