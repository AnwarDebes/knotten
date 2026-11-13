import { BUDGET, FACT, fmt, type Lang, type SourceId, type T } from "@/lib/facts";

/**
 * The buildings on the property, for the "Eksisterende bygg" pages of both designs: the office building and
 * the house that stand today, the office extension and the warehouse and workshop that are planned, with the
 * energy budget's working figures (and their range), the steps for connecting the meters, and the yearly
 * totals of published meter data. One text in both languages; each design draws it in its own look.
 */

export type BuildingStatus = "existing" | "planned";

export type BuildingCard = {
  id: "office" | "house" | "extension" | "storage";
  name: T;
  status: BuildingStatus;
  text: T;
  /** the working figure, or what stands in its place */
  figure: T;
  /** where the figure comes from, and how sure it is */
  note: T;
  /** a provisional figure (a working assumption that is replaced by measured data) */
  provisional?: boolean;
  source: SourceId;
};

export const BUILDING_STATUS: Record<BuildingStatus, T> = {
  existing: { no: "Står i dag", en: "Existing" },
  planned: { no: "Planlagt", en: "Planned" },
};

const range = `±${BUDGET.office_storage_range_pct} %`;
const extension = FACT.offices_after - FACT.offices_now;
const perYear = (v: number): T => ({ no: `${fmt(v)} kWh/år`, en: `${fmt(v, "en")} kWh/yr` });

export const BUILDINGS: BuildingCard[] = [
  {
    id: "office",
    name: { no: "Kontorbygget", en: "The office building" },
    status: "existing",
    text: {
      no: `Ved Rødbergsveien. ${FACT.offices_now} kontorer er ferdige i dag, ${FACT.offices_after} når utvidelsen står. Faktisk strømforbruk hentes inn for dagens bygg, regnes om per ferdig kontor og skaleres til ${FACT.offices_after}, med felleslaster som oppvarming og ventilasjon holdt for seg.`,
      en: `By Rødbergsveien. ${FACT.offices_now} offices are completed today, ${FACT.offices_after} when the extension stands. Actual consumption is to be collected for today's building, divided by completed offices and scaled to ${FACT.offices_after}, with shared loads such as heating and ventilation kept apart.`,
    },
    figure: perYear(BUDGET.office_kwh),
    note: { no: `Foreløpig arbeidsforutsetning i energiregnskapet, ${range}. Byttes ut med målt forbruk.`, en: `Provisional working assumption in the energy budget, ${range}. To be replaced by measured consumption.` },
    provisional: true,
    source: "kontor",
  },
  {
    id: "house",
    name: { no: "Bolighuset", en: "The house" },
    status: "existing",
    text: {
      no: "Ved Rødbergsveien, nederst på eiendommen. Tas inn i det samlede energibildet som energibruker og mulig energiflate. Forbruket er ikke hentet inn ennå, og blir et sammenligningsgrunnlag for de nye boligene.",
      en: "By Rødbergsveien, at the bottom of the property. It is part of the overall energy picture as a user of energy and a possible surface for energy. Its consumption has not been collected yet, and becomes a basis of comparison for the new homes.",
    },
    figure: { no: "Ikke tallfestet", en: "Not quantified" },
    note: { no: "Bolighuset har ingen egen rad i energiregnskapet ennå.", en: "The house has no row of its own in the energy budget yet." },
    source: "bygg",
  },
  {
    id: "extension",
    name: { no: "Tilbygg til kontoret", en: "Office extension" },
    status: "planned",
    text: {
      no: `Utvidelsen som tar kontorbygget fra ${FACT.offices_now} til ${FACT.offices_after} kontorer. Ligger i modellen ved vestenden av dagens bygg; plassering og størrelse er foreløpige.`,
      en: `The extension taking the office building from ${FACT.offices_now} to ${FACT.offices_after} offices. It sits in the model at the west end of today's building; position and size are provisional.`,
    },
    figure: { no: `${extension} kontorer`, en: `${extension} offices` },
    note: { no: "Planlagt, prosjekteier, september 2026.", en: "Planned, project owner, September 2026." },
    source: "bygg",
  },
  {
    id: "storage",
    name: { no: "Lager og verksted", en: "Warehouse and workshop" },
    status: "planned",
    text: {
      no: "Nytt bygg rett bak bolighuset. Ventes å bruke mindre strøm enn en bolig, men regnes som én bolig til målte tall finnes. Det er en tydelig merket antakelse som byttes ut med målerdata.",
      en: "A new building directly behind the house. Expected to use less power than a home, but counted as one home until measured figures exist. That is a clearly labelled assumption, to be replaced with meter data.",
    },
    figure: perYear(BUDGET.storage_kwh),
    note: { no: `Foreløpig arbeidsforutsetning i energiregnskapet, ${range}.`, en: `Provisional working assumption in the energy budget, ${range}.` },
    provisional: true,
    source: "lager",
  },
];

/** The opening text of both pages. */
export const BUILDINGS_LEDE: T = {
  no: "To bygg står på eiendommen i dag, kontorbygget og bolighuset, og to er planlagt: et tilbygg til kontoret og et lager- og verkstedbygg. Alle tas inn i energibildet for hele feltet, og målt forbruk gir virkelige tall å måle konseptet mot og å sammenligne de nye boligene med.",
  en: "Two buildings stand on the property today, the office building and the house, and two are planned: an extension to the office and a warehouse and workshop. All of them are part of the energy picture for the whole field, and measured consumption gives real figures to test the concept against and to compare the new homes with.",
};

/** Said in place of the meter panels while no measured data is published. */
export const NOT_MEASURED: T = {
  no: "Målt strømforbruk for byggene er ikke hentet inn ennå. Historikk, tiltak og virkning vises her når prosjekteier har lagt inn målingene.",
  en: "Measured consumption for the buildings has not been collected yet. History, upgrades and their effect are shown here once the project owner has added the readings.",
};

/** The name a building's meter data is shown under (the vocabulary's, whatever the record calls it). */
const METER_NAMES: Record<string, T> = {
  office: { no: "Kontorbygget", en: "The office building" },
  house: { no: "Bolighuset", en: "The house" },
};
export function meterName(b: { id: string; name: T }, lang: Lang): string {
  return (METER_NAMES[b.id] ?? b.name)[lang];
}

/** How the meters get connected, in four steps. */
export const METER_STEPS: { title: T; steps: T[]; note: T; reading: T } = {
  title: { no: "Slik kobles målingene til", en: "How the meters get connected" },
  steps: [
    { no: "Målepunkt-ID (Elhub) for begge bygg, og samtykke til å vise aggregerte tall.", en: "Metering-point IDs (Elhub) for both buildings, and consent to show aggregated figures." },
    { no: "Historikk per time så langt tilbake som mulig, og tiltak med dato (varmepumpe, isolasjon, solceller).", en: "Hourly history as far back as possible, and upgrades with dates (heat pump, insulation, solar panels)." },
    { no: "Graddagskorrigering, så vær ikke forveksles med besparelse.", en: "Degree-day correction, so weather is not mistaken for saving." },
    { no: "Målt forbruk mot modellen: grunnlaget for å sammenligne med de nye boligene.", en: "Measured consumption against the model: the basis for comparing with the new homes." },
  ],
  note: { no: "Målingene legges inn i prosjektportalen og vises her når prosjekteier velger det.", en: "The readings are added in the project portal and shown here when the project owner chooses to." },
  reading: { no: "Målingene leses fra strømmålernes HAN-port eller hentes fra Elhub. Nettsiden viser data, den styrer ingenting i byggene.", en: "The readings come from the meters' HAN port or from Elhub. The website shows data; it controls nothing in the buildings." },
};

/** A year of readings: the total, how many months it has, and kWh per m² for a full year when the area is known. */
export type YearTotal = { year: string; months: number; kwh: number; perM2: number | null };

/** The yearly totals of a building's monthly readings, oldest first (as the portal's meter view shows them). */
export function yearTotals(b: { readings: { month: string; kwh: number }[]; area_m2?: number }): YearTotal[] {
  const years = [...new Set(b.readings.map((r) => r.month.slice(0, 4)))].sort();
  return years.map((year) => {
    const rows = b.readings.filter((r) => r.month.startsWith(year));
    const kwh = rows.reduce((a, r) => a + r.kwh, 0);
    return { year, months: rows.length, kwh, perM2: b.area_m2 && rows.length === 12 ? kwh / b.area_m2 : null };
  });
}
