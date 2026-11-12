import { FACT, WORK_PLAN, cap, weeks, type Lang, type SourceId, type T } from "@/lib/facts";

/**
 * Where the project stands and what is not decided yet, for the "Status og spørsmål" pages of both designs.
 * Only what the sources say: the work plan with its weeks, the zoning plan that is not adopted, and the open
 * questions the project material names. No dates are given where none exist.
 */

/**
 * The status line under both front pages' headline, until the administrator writes one in the portal
 * (Innstillinger). Stored as the "release note", which the plot pages and Knotten AI show as well.
 */
export const RELEASE_NOTE: T = {
  no: "Tomtene er ikke lagt ut for salg ennå. Meld interesse, så hører du fra oss først.",
  en: "The plots are not for sale yet. Register your interest and you will hear from us first.",
};

/** The stage of the project as a whole, in the order it happens. `now` marks where it is today. */
export const STAGES: { title: T; text: T; now?: boolean; src?: SourceId }[] = [
  {
    title: { no: "Regulering", en: "Zoning" },
    text: { no: "Reguleringsplanen er ikke vedtatt. Prosjektet startet før planen, så energi, boliger og marked kan planlegges sammen fra start.", en: "The zoning plan is not adopted. The project started before the plan, so energy, homes and market can be planned together from the start." },
    now: true,
    src: "regulering",
  },
  {
    title: { no: "Energikonsept og marked", en: "Energy concept and market" },
    text: { no: "Energiregnskap, brønnpark og vurdering av tiltak finnes som foreløpig arbeidsgrunnlag. Den tekniske rapporten og markedsrapporten er sluttleveranser i arbeidsplanen.", en: "The energy budget, the borehole field and the assessment of measures exist as a provisional working basis. The technical report and the market report are final deliverables in the work plan." },
    now: true,
    src: "tiltak",
  },
  {
    title: { no: "Salg", en: "Sale" },
    text: { no: "Tomtene er ikke lagt ut for salg, og ingen priser er satt. Tomtegrenser og priser avhenger av reguleringen.", en: "The plots are not for sale, and no prices are set. Plot boundaries and prices depend on the zoning." },
  },
  {
    title: { no: "Bygging og måling", en: "Building and measuring" },
    text: { no: "Ingen dato er satt. Når boligene står, er planen å måle faktisk ytelse mot de eksisterende byggene.", en: "No date is set. Once the homes stand, the plan is to measure actual performance against the existing buildings." },
  },
];

/** One line per phase of the work plan (tracks 1 and 2); names and weeks come from WORK_PLAN in the facts. */
const PHASE_TEXT: T[] = [
  { no: "Avklare data, målgrupper og nettsidestruktur", en: "Settle the data, the audiences and the website structure" },
  { no: "Sol, terreng, bygg og energiflater på stedet", en: "Sun, terrain, buildings and energy surfaces on site" },
  { no: "Energibehov, produksjon, lagring, investorer og referanser", en: "Energy demand, production, storage, investors and references" },
  { no: "Alternative energikonsepter og markedsvinkling", en: "Alternative energy concepts and the market angle" },
  { no: "Antakelser kontrolleres, budskap spisses", en: "Assumptions are checked, the message sharpened" },
  { no: "Teknisk rapport, markedsrapport og ferdig nettside", en: "Technical report, market report and the finished website" },
];

export function workPlan(lang: Lang): { name: string; when: string; text: string }[] {
  return WORK_PLAN.map((p, i) => ({ name: p.name[lang], when: cap(weeks(p.weeks, lang)), text: PHASE_TEXT[i]?.[lang] ?? "" }));
}

/** What the project has not decided yet, each with the source that says so. */
export const OPEN_QUESTIONS: { title: T; text: T; src?: SourceId }[] = [
  {
    title: { no: "Byggestandard", en: "Building standard" },
    text: { no: "Det er ikke bestemt om boligene bygges etter TEK17, TEK17 med tilleggskrav, passivhus eller plusshus. Alle energitall er derfor foreløpige.", en: "It is not decided whether the homes are built to TEK17, TEK17 with extra requirements, passive house or plus house. Every energy figure is therefore provisional." },
    src: "tiltak",
  },
  {
    title: { no: "Hustype og størrelse", en: "House type and size" },
    text: { no: "Hustype, størrelse og antall etasjer er ikke bestemt. Huset i 3D-modellen viser hvordan én hustype kan tilpasses terrenget; det er en illustrasjon, ikke en tegning.", en: "House type, size and number of floors are not decided. The house in the 3D model shows how one house type can adapt to the ground; it is an illustration, not a design." },
  },
  {
    title: { no: "Priser", en: "Prices" },
    text: { no: "Ingen priser er satt, verken for tomter eller boliger.", en: "No prices are set, for plots or for homes." },
  },
  {
    title: { no: "Tidsplan", en: "Timeline" },
    text: { no: "Det er ikke satt dato for salgsstart, byggestart eller innflytting. Reguleringsplanen må vedtas først.", en: "No date is set for the start of sales, building or moving in. The zoning plan has to be adopted first." },
    src: "regulering",
  },
];

/** "30 tomter i fire rekker" from the facts, for the page's lede. */
export const fieldLine = (lang: Lang) => (lang === "no" ? `rundt ${FACT.plots} tomter` : `about ${FACT.plots} plots`);
