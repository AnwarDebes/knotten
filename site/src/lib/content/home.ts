import { BUDGET, EED, FACT, MEASURES, MEASURES_COMPARED, STATUS_SOLAR, fmt, fmtRound, type Lang, type Measure, type SourceId, type T } from "@/lib/facts";
import type { Plot } from "@/lib/types";

/**
 * What both front pages show (Klassisk at / and /english, Moderne at /no and /en), written once so the two designs say
 * the same things, each in its own look: the four facts under the headline, the project owner's photos, the energy
 * figures and the measures by verdict, where the project stands, and the plots with the most winter sun. Every
 * figure comes from src/lib/facts or is worked out from it; estimates say so. No Node or browser imports.
 */

/** One fact under the headline: the figure, how Klassisk counts it up, the words after it and its source. */
export type HomeFact = { big: string; count?: { value: number; prefix?: string; suffix?: string }; text: string; src: SourceId };

export function homeFacts(lang: Lang): HomeFact[] {
  const no = lang === "no";
  return [
    {
      big: no ? `Rundt ${FACT.plots}` : `About ${FACT.plots}`,
      count: { value: FACT.plots, prefix: no ? "Rundt " : "About " },
      text: no ? "tomter, ønsket er sjøutsikt fra alle" : "plots, the aim is a sea view from all",
      src: "sigve30",
    },
    {
      big: `${fmt(FACT.parcel_m2, lang)} m²`,
      count: { value: FACT.parcel_m2, suffix: " m²" },
      text: no ? `samlet for eiendommene gnr ${FACT.gnr} bnr ${FACT.bnr} og ${FACT.bnr_extra}` : `in total for the properties ${FACT.gnr}/${FACT.bnr} and ${FACT.gnr}/${FACT.bnr_extra}`,
      src: "areal",
    },
    {
      big: no ? `Maks ${FACT.road_grade_pct} %` : `Max ${FACT.road_grade_pct} %`,
      count: { value: FACT.road_grade_pct, prefix: no ? "Maks " : "Max ", suffix: " %" },
      text: no ? "stigning er målet for veien. På dagens terreng er den brattere, så planen må gi lengre sløyfer" : "grade is the aim for the road. On today's ground it is steeper, so the plan must give longer loops",
      src: "vei",
    },
    {
      big: no ? "Regulering" : "Zoning",
      text: no ? "ikke vedtatt ennå. Prosjektet starter før reguleringsplanen" : "not adopted yet. The project starts before the zoning plan",
      src: "regulering",
    },
  ];
}

/** The project owner's photos of the place as it is today (public/assets/incoming/web), with what each shows; `pos` keeps
 * the part the caption speaks of in the frame when the photo is cropped. */
export const OWNER_PHOTOS: { src: string; w: number; h: number; caption: T; pos?: string }[] = [
  { src: "/assets/incoming/web/photo_fjord_wide.webp", w: 721, h: 435, caption: { no: "Utsikten sørover mot Sniksfjorden og havet.", en: "The view south towards Sniksfjorden and the sea." } },
  { src: "/assets/incoming/web/photo_fjord_farm.webp", w: 1331, h: 1331, caption: { no: "Gårdene, veien og elva nedenfor feltet.", en: "The farms, the road and the river below the field." } },
  { src: "/assets/incoming/web/photo_sea_summer.webp", w: 649, h: 892, pos: "50% 85%", caption: { no: "Sommer over fjorden, med havet i glipen mellom åsene.", en: "Summer over the fjord, with the sea in the gap between the hills." } },
];

/** Where the photos were taken, as far as the project owner has said. */
export const PHOTOS_TEXT: T = {
  no: "Bilder fra prosjekteier. Utsiktsbildet er tatt fra nabotomten, litt lavere enn feltet; hvor sommerbildet er tatt, er ikke oppgitt.",
  en: "Photos from the project owner. The view photo was taken from the neighbouring plot, a little lower than the field; where the summer photo was taken is not stated.",
};

/** The journey through the model, in a few words for the section that holds it. */
export const JOURNEY_TEXT: T = {
  no: "Modellen er bygget fra målte data: Kartverkets laserskanning av terrenget på én meter, trærne funnet i det samme datasettet og solens ekte bane. Reisen går fra Sniksfjorden, inn over feltet, ned på en tomt og inn i stua i eksempelhuset, som viser én hustype og ikke er en tegnet bolig.",
  en: "The model is built from measured data: Kartverket's one-metre laser scan of the terrain, the trees found in the same dataset and the sun's real path. The journey runs from Sniksfjorden, over the field, down onto a plot and into the living room of the example house, which shows one house type and is not a designed home.",
};

/** Where the project stands, in the order it happens. Sale goes through an estate agent; no dates or prices are set. */
export const HOME_PHASES: { title: T; text: T; now?: boolean }[] = [
  {
    title: { no: "Regulering", en: "Zoning" },
    text: { no: "Reguleringsplanen er ikke vedtatt. Prosjektet starter før planen, så energikonsept og marked utvikles samtidig.", en: "The zoning plan is not adopted. The project starts before the plan, so the energy concept and the market are developed together." },
    now: true,
  },
  {
    title: { no: "Energikonsept", en: "Energy concept" },
    text: { no: "Energiregnskap, brønnpark og vurdering av tiltak finnes som foreløpig arbeidsgrunnlag. Den tekniske rapporten kommer.", en: "The energy budget, the borehole field and the assessment of measures exist as a provisional working basis. The technical report follows." },
  },
  {
    title: { no: "Salg gjennom megler", en: "Sale through an estate agent" },
    text: { no: "Tomtene er ikke lagt ut for salg, og ingen priser er satt. Tomter, priser og fremdrift oppgis når planen er vedtatt.", en: "The plots are not for sale, and no prices are set. Plots, prices and schedule are given when the plan is adopted." },
  },
  {
    title: { no: "Bygging og måling", en: "Building and measuring" },
    text: { no: "Ingen dato er satt. Faktisk ytelse publiseres når boligene står, målt mot de eksisterende byggene.", en: "No date is set. Actual performance is published once the homes stand, measured against the existing buildings." },
  },
];

/** One of the energy budget's key figures, with what it covers and how sure it is. */
export type EnergyKey = { key: string; value: string; unit: string; label: string; note: string; src?: SourceId };

/** The energy budget's four key figures for the whole field. All of them are a provisional working basis. */
export function energyKeys(lang: Lang): EnergyKey[] {
  const no = lang === "no";
  const year = no ? "kWh/år" : "kWh/yr";
  return [
    {
      key: "demand",
      value: `${no ? "ca." : "about"} ${fmtRound(BUDGET.demand_total_kwh, 1000, lang)}`,
      unit: year,
      label: no ? "Energibehov, hele feltet" : "Energy demand, whole field",
      note: no ? `${BUDGET.homes} boliger, kontor og lager, med et spenn på ±${BUDGET.demand_range_pct} %` : `${BUDGET.homes} homes, office and storage, with a range of ±${BUDGET.demand_range_pct} %`,
      src: "budsjett",
    },
    {
      key: "solar",
      value: fmt(BUDGET.pv.annual_kwh, lang),
      unit: year,
      label: no ? "Solstrøm fra takene" : "Solar from the roofs",
      note: no
        ? `Energiregnskapet, som selv sier at tallet er om lag 30 % for høyt. Statusoppsummeringen anslår om lag ${fmtRound(STATUS_SOLAR.annual_kwh, 1000, lang)} fra ${fmt(STATUS_SOLAR.area_m2, lang)} m²`
        : `The energy budget, which itself says the figure is about 30 % too high. The status summary estimates about ${fmtRound(STATUS_SOLAR.annual_kwh, 1000, lang)} from ${fmt(STATUS_SOLAR.area_m2, lang)} m²`,
      src: "sol",
    },
    {
      key: "bedrock",
      value: fmt(BUDGET.bedrock.delivered_kwh, lang),
      unit: year,
      label: no ? "Varme fra berget" : "Heat from the bedrock",
      note: no ? `${EED.boreholes} brønner, ca. ${fmt(Math.round(EED.depth_m), lang)} m dype, årsvarmefaktor ${fmt(BUDGET.bedrock.scop, lang)}` : `${EED.boreholes} boreholes, about ${fmt(Math.round(EED.depth_m), lang)} m deep, seasonal factor ${fmt(BUDGET.bedrock.scop, lang)}`,
      src: "budsjett",
    },
    {
      key: "battery",
      value: fmt(BUDGET.battery.total_kwh, lang),
      unit: "kWh",
      label: no ? "Batteri i feltet" : "Battery in the field",
      note: no ? `${BUDGET.battery.per_home_kwh} kWh i hver bolig, valgt inndata i energiregnskapet` : `${BUDGET.battery.per_home_kwh} kWh in every home, a chosen input in the energy budget`,
    },
  ];
}

/** The measures by verdict (yes, maybe, no), in the order of the facts. */
export function measuresByVerdict(): { verdict: Measure["verdict"]; label: T; items: Measure[] }[] {
  return [
    { verdict: "yes", label: { no: "Ja", en: "Yes" }, items: MEASURES.filter((m) => m.verdict === "yes") },
    { verdict: "maybe", label: { no: "Kanskje", en: "Maybe" }, items: MEASURES.filter((m) => m.verdict === "maybe") },
    { verdict: "no", label: { no: "Nei", en: "No" }, items: MEASURES.filter((m) => m.verdict === "no") },
  ];
}

/** "17 tiltak, 16 sammenlignet av energisporet": how many measures there are and how many the energy track compared. */
export function measuresLine(lang: Lang): string {
  const all = MEASURES.length;
  return lang === "no"
    ? `${all} tiltak, ${MEASURES_COMPARED} av dem sammenlignet av energisporet og ett fra prosjekteiers retning`
    : `${all} measures, ${MEASURES_COMPARED} of them compared by the energy track and one from the project owner's direction`;
}

/** The plots with the most sun on 21 December (ties go to the wider view of the water). */
export function mostWinterSun(plots: Plot[], n = 3): Plot[] {
  return [...plots].sort((a, b) => b.sun.dec21.hours - a.sun.dec21.hours || b.view.water_visible_deg - a.view.water_visible_deg).slice(0, n);
}

/** The degrees of latitude, for "58 grader nord". */
export const LATITUDE = Math.floor(Number(FACT.lat));

/** The sun passport in a sentence, for the section that shows the three plots with the most winter sun. */
export const WINTER_SUN_TEXT: T = {
  no: `Solpasset er regnet ut fra terrenget rundt hver tomt den 21. desember, i stuehøyde. Det er tallet en kjøper på ${LATITUDE} grader nord faktisk lurer på.`,
  en: `The sun passport is computed from the terrain around each plot on 21 December, at living-room height. It is the number a buyer at ${LATITUDE} degrees north actually wonders about.`,
};

/** The Klassisk plot page of a plot: "plot-07" -> "/tomtene/07" (add the language with kHref). */
export const klassiskPlotPath = (id: string) => `/tomtene/${id.replace(/^plot-/, "")}`;
