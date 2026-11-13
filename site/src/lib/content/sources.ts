import {
  ASSUMPTIONS_VERSION,
  BUDGET,
  EED,
  ENERGY_COST,
  FACT,
  PV_KWP_PER_HOME,
  SOURCES,
  STATUS_LABEL,
  STATUS_SOLAR,
  dateLong,
  fmt,
  fmtRound,
  type Lang,
  type Source,
  type SourceId,
  type Status,
  type T,
} from "@/lib/facts";

/**
 * "Kilder og forutsetninger" / "Sources and assumptions" in both designs: one row per number the website shows, with
 * its value, unit, status, who owns it and the source behind its chip. The rows bring together the figure cards
 * (ASSUMPTIONS) and the old Klassisk table (FIGURES), every value read from src/lib/facts, in both languages.
 * A figure added to a page gets a row here too.
 */

// ------------------------------------------------------------------ sources the facts module does not hold yet
const BUDGET_DOC = SOURCES.budsjett.doc;

/**
 * Two quotes from the energy budget for figures that the facts module's source list does not cover yet: the yearly
 * energy cost and the prices the sheet assumes. Word for word where they stand inside «», in the sheet's language.
 * (They can move into src/lib/facts/sources.ts as they are.)
 */
export const MORE_SOURCES = {
  kostnad: {
    quote: `Nøkkeltall for året, for «30 boliger + kontorbygg og lager»: «Netto energikostnad» ${fmt(ENERGY_COST.net_nok)} kr/år, «Referanse uten tiltak» ${fmt(ENERGY_COST.reference_nok)} kr/år og «Besparelse mot referanse» ${fmt(ENERGY_COST.saving_nok)} kr/år. Referansen: «alt varmebehov dekket med direkte elektrisk oppvarming, uten solceller, vindturbiner eller batteri.»`,
    doc: BUDGET_DOC,
  },
  priser: {
    quote: `«Spotpris strøm (årssnitt)» ${fmt(BUDGET.prices.spot_nok)} kr/kWh, merket «Svært usikker». «Nettleie (energiledd)» ${fmt(BUDGET.prices.grid_nok, "no", 2)} kr/kWh. «Sum kjøpspris strøm» ${fmt(BUDGET.prices.buy_nok, "no", 2)} kr/kWh. «Salgspris overskuddsstrøm» ${fmt(BUDGET.prices.sell_nok, "no", 2)} kr/kWh, merket «Usikker».`,
    doc: BUDGET_DOC,
  },
} as const satisfies Record<string, Source>;

/** Any source a chip can open: one from the facts module, or one of the two above. */
export type AnySourceId = SourceId | keyof typeof MORE_SOURCES;

export function sourceOf(id: AnySourceId): Source {
  return (MORE_SOURCES as Record<string, Source>)[id] ?? SOURCES[id as SourceId];
}

// ------------------------------------------------------------------ the table
export type SourceRow = { key: string; what: T; value: T; unit: T; status: Status; owner: T; src: AnySourceId };
export type SourceGroup = { id: string; title: T; note?: T; rows: SourceRow[] };

const n = (v: number, digits?: number): T => ({ no: fmt(v, "no", digits), en: fmt(v, "en", digits) });
const about = (v: number, step: number): T => ({ no: `ca. ${fmtRound(v, step)}`, en: `about ${fmtRound(v, step, "en")}` });
const same = (s: string): T => ({ no: s, en: s });

const OWNER: Record<string, T> = {
  po: { no: "Prosjekteier", en: "Project owner" },
  energy: { no: "Energisporet", en: "Energy track" },
  site: { no: "Nettsiden, fra energiregnskapet", en: "The website, from the energy budget" },
  model: { no: "Nettsidens modell", en: "The website's model" },
  kartverket: { no: "Kartverket og prosjekteier", en: "Kartverket and the project owner" },
  norgeskart: same("Norgeskart"),
  norkart: same("Norkart"),
  snl: same("Store norske leksikon"),
  ssb: { no: "SSB", en: "Statistics Norway" },
};
const U: Record<string, T> = {
  plots: { no: "tomter", en: "plots" },
  homes: { no: "boliger", en: "homes" },
  offices: { no: "kontorer", en: "offices" },
  panels: { no: "paneler", en: "panels" },
  masl: { no: "moh.", en: "m a.s.l." },
  kwhYear: { no: "kWh/år", en: "kWh/year" },
  krYear: { no: "kr/år", en: "kr/year" },
  kgYear: { no: "kg/år", en: "kg/year" },
  trees: { no: "trær", en: "trees" },
  people: { no: "personer", en: "people" },
};

export const SOURCE_GROUPS: SourceGroup[] = [
  {
    id: "feltet",
    title: { no: "Feltet og eiendommen", en: "The field and the property" },
    rows: [
      { key: "plots", what: { no: "Antall tomter", en: "Number of plots" }, value: { no: `rundt ${FACT.plots}`, en: `about ${FACT.plots}` }, unit: U.plots, status: "foreløpig", owner: OWNER.po, src: "sigve30" },
      { key: "homes", what: { no: "Boliger i energiregnskapet", en: "Homes in the energy budget" }, value: n(BUDGET.homes), unit: U.homes, status: "fastsatt", owner: OWNER.energy, src: "budsjett" },
      { key: "parcel", what: { no: "Samlet areal for eiendommene", en: "Total area of the properties" }, value: n(FACT.parcel_m2), unit: same("m²"), status: "fastsatt", owner: OWNER.kartverket, src: "areal" },
      { key: "road", what: { no: "Maks stigning på veien, målet", en: "Maximum road grade, the aim" }, value: n(FACT.road_grade_pct), unit: same("%"), status: "foreløpig", owner: OWNER.po, src: "vei" },
      { key: "profile_m", what: { no: "Terrengprofil, lengde", en: "Terrain profile, length" }, value: n(FACT.profile_m), unit: same("m"), status: "fastsatt", owner: OWNER.norgeskart, src: "profil" },
      { key: "profile_h", what: { no: "Terrengprofil, høyde", en: "Terrain profile, height" }, value: { no: `0 til ${FACT.knotten_m}`, en: `0 to ${FACT.knotten_m}` }, unit: U.masl, status: "fastsatt", owner: OWNER.norgeskart, src: "profil" },
      { key: "lokkeheia", what: { no: "Løkkeheia bak feltet, høyde", en: "Løkkeheia behind the field, height" }, value: n(FACT.lokkeheia_m), unit: U.masl, status: "fastsatt", owner: OWNER.norkart, src: "hoyder" },
      { key: "offices_now", what: { no: "Kontorer ferdig i dag", en: "Offices completed today" }, value: n(FACT.offices_now), unit: U.offices, status: "fastsatt", owner: OWNER.po, src: "kontor" },
      { key: "offices_after", what: { no: "Kontorer etter utvidelsen", en: "Offices after the extension" }, value: n(FACT.offices_after), unit: U.offices, status: "fastsatt", owner: OWNER.po, src: "kontor" },
    ],
  },
  {
    id: "energi",
    title: { no: "Energiregnskapet", en: "The energy budget" },
    note: { no: "Arbeidsversjonen fra energisporet, september 2026. Byggestandarden er ikke fastsatt, så alle tallene er foreløpige.", en: "The energy track's working version, September 2026. The building standard is not fixed, so every figure is provisional." },
    rows: [
      { key: "demand", what: { no: "Samlet energibehov, boliger, kontor og lager", en: "Total energy demand, homes, office and storage" }, value: { no: `${about(BUDGET.demand_total_kwh, 10000).no} ±${BUDGET.demand_range_pct} %`, en: `${about(BUDGET.demand_total_kwh, 10000).en} ±${BUDGET.demand_range_pct} %` }, unit: U.kwhYear, status: "foreløpig", owner: OWNER.energy, src: "budsjett" },
      { key: "self", what: { no: "Selvforsyning med strøm", en: "Self-sufficiency in power" }, value: n(BUDGET.results.self_sufficiency_pct), unit: same("%"), status: "foreløpig", owner: OWNER.energy, src: "selvforsyning" },
      { key: "pv_budget", what: { no: "Solstrøm i energiregnskapet", en: "Solar power in the energy budget" }, value: n(BUDGET.pv.annual_kwh), unit: U.kwhYear, status: "foreløpig", owner: OWNER.energy, src: "sol" },
      { key: "pv_status", what: { no: `Solstrøm fra ${fmt(STATUS_SOLAR.area_m2)} m², statusoppsummeringen`, en: `Solar power from ${fmt(STATUS_SOLAR.area_m2, "en")} m², the status summary` }, value: about(STATUS_SOLAR.annual_kwh, 1000), unit: U.kwhYear, status: "foreløpig", owner: OWNER.energy, src: "sol" },
      { key: "pv_home", what: { no: "Solceller per bolig", en: "Solar per home" }, value: { no: `ca. ${PV_KWP_PER_HOME}`, en: `about ${PV_KWP_PER_HOME}` }, unit: same("kWp"), status: "beregnet", owner: OWNER.site, src: "budsjett" },
      { key: "battery_home", what: { no: "Batteri per bolig", en: "Battery per home" }, value: n(BUDGET.battery.per_home_kwh), unit: same("kWh"), status: "foreløpig", owner: OWNER.energy, src: "budsjett" },
      { key: "battery_total", what: { no: "Batterikapasitet samlet", en: "Battery capacity in total" }, value: n(BUDGET.battery.total_kwh), unit: same("kWh"), status: "foreløpig", owner: OWNER.energy, src: "budsjett" },
      { key: "boreholes", what: { no: "Energibrønner, antall og dybde", en: "Boreholes, number and depth" }, value: same(`${EED.boreholes} x ${Math.round(EED.depth_m)}`), unit: { no: "stk x m", en: "no. x m" }, status: "beregnet", owner: OWNER.energy, src: "eed" },
      { key: "panels", what: { no: "Felles solanlegg, første scenario", en: "Shared solar plant, first scenario" }, value: about(FACT.panels, 1), unit: U.panels, status: "foreløpig", owner: OWNER.po, src: "paneler" },
      { key: "saving_home", what: { no: "Besparelse per bolig, forenklet fordeling", en: "Saving per home, simplified split" }, value: about(BUDGET.results.saving_per_home_nok, 1000), unit: U.krYear, status: "foreløpig", owner: OWNER.energy, src: "besparelse" },
      { key: "net_cost", what: { no: "Netto energikostnad, hele feltet med kontor og lager", en: "Net energy cost, the whole field with office and storage" }, value: about(ENERGY_COST.net_nok, 1000), unit: U.krYear, status: "foreløpig", owner: OWNER.energy, src: "kostnad" },
      { key: "price_buy", what: { no: "Strømpris ved kjøp, med nettleie", en: "Power price when buying, with grid tariff" }, value: n(BUDGET.prices.buy_nok, 2), unit: same("kr/kWh"), status: "foreløpig", owner: OWNER.energy, src: "priser" },
      { key: "price_sell", what: { no: "Strømpris ved salg av overskudd", en: "Power price when selling surplus" }, value: n(BUDGET.prices.sell_nok, 2), unit: same("kr/kWh"), status: "foreløpig", owner: OWNER.energy, src: "priser" },
      { key: "co2", what: { no: "CO₂ spart per år, hele feltet", en: "CO₂ saved a year, the whole field" }, value: about(BUDGET.results.co2_saved_kg, 1000), unit: U.kgYear, status: "foreløpig", owner: OWNER.energy, src: "co2" },
    ],
  },
  {
    id: "modellen",
    title: { no: "Nettsidens modell", en: "The website's model" },
    note: { no: "Regnet ut for det foreløpige utlegget v6, et beregnet forslag og ikke prosjekteiers plan.", en: "Computed for the provisional layout v6, a computed proposal and not the project owner's plan." },
    rows: [
      { key: "plots_model", what: { no: "Tomter i modellen", en: "Plots in the model" }, value: n(FACT.plots), unit: U.plots, status: "beregnet", owner: OWNER.model, src: "modell" },
      { key: "sea_view", what: { no: "Tomter med sjøutsikt i modellen", en: "Plots with a sea view in the model" }, value: n(FACT.plots), unit: U.plots, status: "beregnet", owner: OWNER.model, src: "modell" },
      { key: "open_sea", what: { no: "Tomter med åpent hav i sikt, i modellen", en: "Plots with open sea in view, in the model" }, value: n(FACT.open_sea_plots), unit: U.plots, status: "beregnet", owner: OWNER.model, src: "modell" },
      { key: "corridor", what: { no: "Siktkorridor mot åpent hav", en: "Corridor to open sea" }, value: n(FACT.sea_corridor_deg), unit: same("°"), status: "beregnet", owner: OWNER.model, src: "modell" },
      { key: "trees", what: { no: "Trær funnet i laserdata på 1 km²", en: "Trees found in laser data on 1 km²" }, value: n(FACT.trees_detected), unit: U.trees, status: "beregnet", owner: OWNER.model, src: "modell" },
      { key: "trees_cleared", what: { no: "Trær som ryddes i modellens forslag", en: "Trees cleared in the model's proposal" }, value: n(FACT.trees_cleared), unit: U.trees, status: "beregnet", owner: OWNER.model, src: "modell" },
    ],
  },
  {
    id: "omradet",
    title: { no: "Området rundt", en: "The surrounding area" },
    rows: [
      { key: "audna", what: { no: "Audna, lengde", en: "The Audna, length" }, value: n(FACT.audna_km), unit: same("km"), status: "verifisert", owner: OWNER.snl, src: "audna" },
      { key: "vigeland", what: { no: `Vigeland, innbyggere ${FACT.vigeland_pop_year}`, en: `Vigeland, population ${FACT.vigeland_pop_year}` }, value: n(FACT.vigeland_pop), unit: U.people, status: "verifisert", owner: OWNER.ssb, src: "vigeland" },
    ],
  },
];

/** Every row, in table order. */
export const SOURCE_ROWS: SourceRow[] = SOURCE_GROUPS.flatMap((g) => g.rows);

// ------------------------------------------------------------------ the page around the table
/** The four statuses, in the order the legend explains them. */
export const STATUS_ORDER: Status[] = ["fastsatt", "foreløpig", "beregnet", "verifisert"];

export const STATUS_TEXT: Record<Status, T> = {
  fastsatt: { no: "Målt eller vedtatt: eiendomskartet, byggene som finnes, antallet boliger i prosjektet.", en: "Measured or decided: the property map, the buildings that exist, the number of homes in the project." },
  foreløpig: { no: "Anslag fra arbeidsdokumentene. Avrundes og får et spenn, og byttes ut når bedre tall finnes.", en: "Estimates from the working documents. Rounded and given a range, and replaced when better figures exist." },
  beregnet: { no: "Regnet ut av energisporet eller av nettsidens modell, med metoden beskrevet i kilden.", en: "Computed by the energy track or by the website's model, with the method described in the source." },
  verifisert: { no: "Sjekket mot offentlige kilder på nett, med lenke og dato for når de ble lest.", en: "Checked against public sources online, with a link and the date they were read." },
};

export const statusLabel = (s: Status, lang: Lang) => STATUS_LABEL[s][lang];

export const SOURCES_PAGE = {
  title: { no: "Kilder og forutsetninger", en: "Sources and assumptions" } as T,
  lede: {
    no: "Én rad per tall som brukes på nettsiden: hva det er, verdien, hvor sikker den er, hvem som eier den og hvor den kommer fra. Trykk på kilden for å lese den.",
    en: "One row for every number the website uses: what it is, the value, how certain it is, who owns it and where it comes from. Press the source to read it.",
  } as T,
  description: {
    no: "Hvert tall på nettsiden med verdi, status og kilde: fastsatt, foreløpig, beregnet eller verifisert.",
    en: "Every number on the website with its value, status and source: fixed, provisional, computed or verified.",
  } as T,
  version: (lang: Lang) => (lang === "no" ? `Tallene slik de står per ${dateLong(ASSUMPTIONS_VERSION)} (foreløpig).` : `The figures as they stand on ${dateLong(ASSUMPTIONS_VERSION, "en")} (provisional).`),
  principle: {
    no: "Hvert tall som publiseres på nettsiden, skal kunne spores tilbake til dokumenterte forutsetninger. Et tall som ikke står her, hører ikke hjemme på siden.",
    en: "Every number published on the website must be traceable to documented assumptions. A number that is not listed here does not belong on the site.",
  } as T,
  legendTitle: { no: "Slik leser du statusen", en: "How to read the status" } as T,
  columns: {
    what: { no: "Hva", en: "What" },
    value: { no: "Verdi", en: "Value" },
    unit: { no: "Enhet", en: "Unit" },
    status: { no: "Status", en: "Status" },
    owner: { no: "Ansvarlig", en: "Owner" },
    source: { no: "Kilde", en: "Source" },
  } as Record<"what" | "value" | "unit" | "status" | "owner" | "source", T>,
};
