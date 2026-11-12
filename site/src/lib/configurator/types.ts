/**
 * The house configurator's shared vocabulary. The catalogue (catalog.ts), the URL state (state.ts), the 3D
 * preview (components/configurator/ConfiguratorScene.tsx), the energy estimate (energy.ts), the server store
 * (lib/server/configurations.ts), the API routes under /api/configurator and the pages in both designs all
 * speak in these types.
 *
 * A choice never carries a price: prices are set by an administrator in the portal and are read from the
 * store (PriceTable). Until a price is set, the page says "Pris på forespørsel" / "Price on request".
 */

export type Lang = "no" | "en";
export type T2 = { no: string; en: string };

/** The steps, in the order the buyer walks through them. */
export type StepId = "tomt" | "hus" | "fasade" | "energi" | "interior" | "ute";
export const STEP_ORDER: StepId[] = ["tomt", "hus", "fasade", "energi", "interior", "ute"];

/** What a choice changes, so each part of the app knows which options it must react to. */
export type Effect = "exterior" | "interior" | "energy" | "plan";

/** Values the 3D preview and the energy model read. Plain data, no UI text. */
export type Params = Record<string, number | string | boolean>;

export type Choice = {
  /** Stable, URL-safe (a-z, 0-9 and "-"). Never rename: stored configurations and shared links use it. */
  id: string;
  label: T2;
  /** One short line under the label. */
  note?: T2;
  /** Part of the standard delivery (shown as "Inkludert" / "Included"). Exactly one per option. */
  standard?: boolean;
  /**
   * Colour swatch as #rrggbb. Leave it out on a "modell" choice: that colour differs per house and comes from
   * modelLook(plotIndex) in palette.ts.
   */
  swatch?: string;
  params?: Params;
  /** Only offered when the plot can take it (for example a lower floor). */
  needs?: "lowerFloorPlot";
};

export type OptionDef = {
  /** Stable, URL-safe. Never rename. */
  id: string;
  step: StepId;
  label: T2;
  help?: T2;
  kind: "colour" | "choice";
  effects: Effect[];
  choices: Choice[];
  /** Key in lib/facts/sources (the "Kilde" chip) when the option comes from the project material. */
  source?: string;
};

export type StepDef = { id: StepId; label: T2; intro: T2 };

/** One buyer's house. Only the plot and the choices; everything else is derived. */
export type HouseConfig = {
  v: 1;
  /** Plot id as in public/data/plots.json, for example "plot-07"; null until chosen. */
  plot: string | null;
  /** optionId to choiceId. Missing options mean the standard choice. */
  sel: Record<string, string>;
};

/** Prices in NOK incl. VAT, keyed `${optionId}:${choiceId}`, plus "house:base". null or missing: on request. */
export type PriceTable = Record<string, number | null>;

/** A row of the summary, ready to print in either design. */
export type SummaryRow = {
  step: StepId;
  option: string;
  choice: string;
  optionLabel: string;
  choiceLabel: string;
  standard: boolean;
  /** NOK for the choice; 0 for standard; null when the administrator has not set it (on request). */
  price: number | null;
};

/** What the energy estimate returns for one configured house on its plot (per year, model figures). */
export type EnergyEstimate = {
  pvKwp: number;
  /** Solar production on this house, kWh a year. */
  pvKwh: number;
  /** Household electricity (appliances, lights), kWh a year. */
  householdKwh: number;
  /** Electricity for heating and hot water (heat pump input), kWh a year. */
  heatElKwh: number;
  /** Electric car charging, kWh a year (0 without a charger). */
  evKwh: number;
  /** Total electricity use of the house, kWh a year. */
  useKwh: number;
  /** Share of the solar production used in the house, percent. */
  selfUsePct: number;
  /** Share of the house's use covered by its own panels and battery, percent. */
  selfSufficiencyPct: number;
  importKwh: number;
  exportKwh: number;
  /** Electricity bill for the year at the chosen price model, NOK; null when not computed. */
  costNok: number | null;
  /** The same house without solar, battery and heat pump (direct electric heat), NOK; null when not computed. */
  referenceCostNok: number | null;
  /** Hours the chosen backup (essential circuits or whole house) keeps running in a winter power cut; null when not computed. */
  outageHours: number | null;
  /** True: every figure is a model estimate and provisional (the page shows "foreløpig" / "provisional"). */
  provisional: true;
  /** Short explanation for the "how it is calculated" fold, both languages. */
  method: T2;
};

/** Options for the energy estimate that are settings of the calculation, not choices for the house. */
export type EnergyOptions = {
  /** "budget": the energy budget's prices; "spot2025": hourly NO2 spot prices for 2025 (both exist in src/lib/sim). */
  prices?: "budget" | "spot2025";
};

/** A configuration a logged-in person has saved (shown on Min side). */
export type SavedConfig = { id: string; name: string; config: HouseConfig; created: string; updated: string };

/** GET /api/configurator/prices */
export type PricesResponse = {
  prices: PriceTable;
  /** Plot status and price as the administrator set them (the same data the plot pages show). */
  plots: Record<string, { status: "unreleased" | "available" | "reserved" | "sold"; price_nok: number | null; note: string | null }>;
};

/** POST /api/configurator/send : send the configuration to Sigve Simonsen AS (creates or updates a lead). */
export type SendPayload = {
  config: HouseConfig;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  /** Only the boxes the person ticked; ids from lib/consent.ts. Contact about this request needs no box. */
  consents: Partial<Record<"updates" | "plot_alerts", boolean>>;
  design: "klassisk" | "moderne";
  locale: Lang;
  /** Honeypot, must be empty. */
  website?: string;
  /** Milliseconds the form was open (spam brake: very fast submissions are refused). */
  elapsed?: number;
};
export type SendResponse = { ok: true; id: string } | { ok: false; error: string };

/** GET, POST and DELETE /api/configurator/saved (login required; 401 otherwise). */
export type SavedListResponse = { items: SavedConfig[] };
export type SavePayload = { name: string; config: HouseConfig; id?: string };
export type SaveResponse = { ok: true; item: SavedConfig } | { ok: false; error: string };
