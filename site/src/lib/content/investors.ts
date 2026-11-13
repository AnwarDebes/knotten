import { BUDGET, EED, ENERGY_COST, FACT, FINAL_PHASE, MEASURES, fmt, fmtRound, weeks, type Lang, type T } from "@/lib/facts";
import type { AnySourceId } from "./sources";

/**
 * "Investorer og samarbeid" / "Investors and partners" for both designs: the questions investors ask, answered with
 * the project's own figures (every number from src/lib/facts, marked provisional where it is an estimate), what the
 * data room holds, what the municipality and the University of Agder get, and how the project works with figures.
 * The investor questions are the five the project owner listed in his feedback of 28 August 2026, plus the view.
 */

const L = (no: string, en: string): T => ({ no, en });

export const INVESTORS_PAGE = {
  title: L("Investorer og samarbeid", "Investors and partners"),
  description: L(
    `Rundt ${FACT.plots} boliger på et eget eid felt, med ambisjon om å bli et nasjonalt referanseprosjekt for energi. Spørsmål og svar med tall og kilde, datarommet, og hva kommunen og Universitetet i Agder får.`,
    `About ${FACT.plots} homes on a self-owned field, with the ambition of becoming a national reference project for energy. Questions and answers with figures and sources, the data room, and what the municipality and the University of Agder get.`,
  ),
  lede: L(
    `Rundt ${FACT.plots} boliger på et eget eid felt, med ambisjon om å bli et nasjonalt referanseprosjekt for energi. Det krever at alt som sies kan dokumenteres, så tallene her står med kilde og dato. Investorer og samarbeidspartnere med tilgang finner tallene, scenarioene og dokumentene i datarommet i prosjektportalen.`,
    `About ${FACT.plots} homes on a self-owned field, with the ambition of becoming a national reference project for energy. That takes everything said being documented, so the figures here carry a source and a date. Investors and partners with access find the figures, the scenarios and the documents in the data room of the project portal.`,
  ),
  request: L("Be om investormateriale", "Request investor material"),
  dataRoom: L("Logg inn i datarommet", "Log in to the data room"),
};

/** The four figures at the top, by their key in ASSUMPTIONS, each with the source behind its chip. */
export const INVESTOR_FIGURES: { key: string; src: AnySourceId }[] = [
  { key: "homes", src: "budsjett" },
  { key: "parcel_m2", src: "areal" },
  { key: "saving_per_home", src: "besparelse" },
  { key: "co2_saved", src: "co2" },
];

// ------------------------------------------------------------------ the questions investors ask
export const QA_HEAD = {
  eyebrow: L("Spørsmål og svar", "Questions and answers"),
  title: L("Det investorer spør om", "What investors ask"),
  text: L(
    "Besparelsen, driftskostnadene over tid, om konseptet kan gjentas, innovasjonsverdien og bærekraften. Svarene er anslag med kilde og spenn, ikke løfter, til feltet står og kan måles.",
    "The saving, the running costs over time, whether the concept can be repeated, the innovation value and the sustainability. The answers are estimates with a source and a range, not promises, until the field stands and can be measured.",
  ),
};

const nb = (v: number, lang: Lang) => fmt(v, lang);
const k = (v: number, lang: Lang) => fmtRound(v, 1000, lang);
const millions = (v: number, lang: Lang) => fmt(Math.round(v / 10000) / 100, lang);
const perHome = ENERGY_COST.net_nok / BUDGET.homes;

export function investorQA(lang: Lang): { q: string; a: string; src?: AnySourceId }[] {
  const no = lang === "no";
  const buy = fmt(BUDGET.prices.buy_nok, lang, 2);
  const sell = fmt(BUDGET.prices.sell_nok, lang, 2);
  return [
    {
      q: no ? "Hva er besparelsen?" : "What is the saving?",
      a: no
        ? `Energibehovet for hele feltet er regnet til ${nb(BUDGET.demand_total_kwh, lang)} kWh i året. Solstrøm fra takene, varme fra ${EED.boreholes} energibrønner og ${BUDGET.battery.total_kwh} kWh batteri dekker en stor del lokalt. Energiregnskapet anslår en besparelse på om lag ${k(BUDGET.results.saving_per_home_nok, lang)} kr per bolig i året mot direkte elektrisk oppvarming uten sol, vind eller batteri, fordelt likt på boligene. Foreløpig.`
        : `The energy demand for the whole field is computed at ${nb(BUDGET.demand_total_kwh, lang)} kWh a year. Solar from the roofs, heat from ${EED.boreholes} boreholes and ${BUDGET.battery.total_kwh} kWh of battery cover a large share locally. The energy budget estimates a saving of about ${k(BUDGET.results.saving_per_home_nok, lang)} kr per home a year against direct electric heating with no solar, wind or battery, split evenly over the homes. Provisional.`,
      src: "besparelse",
    },
    {
      q: no ? "Hva koster det å bo der?" : "What does it cost to live there?",
      a: no
        ? `Prisene på tomter og boliger er ikke satt ennå. Det som finnes, er energikostnaden i arbeidsversjonen av energiregnskapet: netto om lag ${k(ENERGY_COST.net_nok, lang)} kr i året for hele feltet, det vil si ${BUDGET.homes} boliger, kontorbygget og lageret, mot om lag ${millions(ENERGY_COST.reference_nok, lang)} millioner kr i en referanse med direkte elektrisk oppvarming uten sol, vind eller batteri. Delt likt på de ${BUDGET.homes} boligene blir det om lag ${k(perHome, lang)} kr per bolig i året, og besparelsen om lag ${k(BUDGET.results.saving_per_home_nok, lang)} kr. Den fordelingen er forenklet, fordi kontoret og lageret er regnet med. Regnskapet bruker ${buy} kr/kWh for kjøpt strøm og ${sell} kr/kWh for solgt overskudd. Foreløpig.`
        : `Prices for plots and homes are not set yet. What exists is the energy cost in the working energy budget: net about ${k(ENERGY_COST.net_nok, lang)} kr a year for the whole field, that is ${BUDGET.homes} homes, the office building and the storage building, against about ${millions(ENERGY_COST.reference_nok, lang)} million kr in a reference with direct electric heating and no solar, wind or battery. Split evenly over the ${BUDGET.homes} homes, that is about ${k(perHome, lang)} kr per home a year, and a saving of about ${k(BUDGET.results.saving_per_home_nok, lang)} kr. The split is simplified, because the office and the storage building are counted in. The budget uses ${buy} kr/kWh for power bought and ${sell} kr/kWh for surplus sold. Provisional.`,
      src: "kostnad",
    },
    {
      q: no ? "Kan det gjentas?" : "Can it be repeated?",
      a: no
        ? "Det stedegne, som utsikten og det målte terrenget, skilles fra det som kan brukes om igjen: energikonseptet, delingen, robustheten og plattformen. Om det kan brukes på neste felt, er et av spørsmålene prosjektet skal belyse."
        : "What belongs to the place, such as the view and the measured terrain, is kept apart from what can be used again: the energy concept, the sharing, the resilience and the platform. Whether it can be used for the next field is one of the questions the project will look into.",
    },
    {
      q: no ? "Hva er innovasjonsverdien?" : "What is the innovation value?",
      a: no
        ? `En digital tvilling bygget på målt terreng, der sol og sikt er regnet for hver av de ${FACT.plots} tomtene i modellen, forberedelse for energideling, robusthet ved strømbrudd som mål, et samarbeid med studenter fra Universitetet i Agder, og ambisjonen om et nasjonalt referanseprosjekt.`
        : `A digital twin built on measured terrain, with sun and view computed for each of the ${FACT.plots} plots in the model, preparation for energy sharing, resilience in power cuts as a goal, a collaboration with University of Agder students, and the ambition of a national reference project.`,
      src: "modell",
    },
    {
      q: no ? "ESG og bærekraft?" : "ESG and sustainability?",
      a: no
        ? `Spart CO₂ er anslått til om lag ${k(BUDGET.results.co2_saved_kg, lang)} kg i året for hele feltet, regnet med ${nb(BUDGET.prices.co2_kg_per_kwh, lang)} kg per kWh nettstrøm. Selvforsyningen med strøm er ${nb(BUDGET.results.self_sufficiency_pct, lang)} % i arbeidsversjonen av energiregnskapet, og ventes å gå ned når solproduksjonen korrigeres. Foreløpig.`
        : `CO₂ saved is estimated at about ${k(BUDGET.results.co2_saved_kg, lang)} kg a year for the whole field, computed at ${nb(BUDGET.prices.co2_kg_per_kwh, lang)} kg per kWh of grid power. Self-sufficiency in power is ${nb(BUDGET.results.self_sufficiency_pct, lang)} % in the working energy budget, and is expected to fall when the solar figure is corrected. Provisional.`,
      src: "co2",
    },
    {
      q: no ? "Er utsikten ekte?" : "Is the view real?",
      a: no
        ? "Utsiktsbildet er tatt fra nabotomten, litt lavere enn feltet, og modellen kan sammenlignes med fotografiet fra samme punkt. Ønsket er sjøutsikt fra alle tomtene, men det er ikke sikkert at det går fra alle; i modellens forslag ser alle vann."
        : "The view photo was taken from the neighbouring plot, a little lower than the field, and the model can be compared with the photograph from the same point. The aim is a sea view from every plot, but it is not certain every plot will get one; in the model's proposal all see water.",
      src: "foto",
    },
  ];
}

// ------------------------------------------------------------------ the data room
export const DATA_ROOM = {
  title: L("I datarommet", "In the data room"),
  items: [
    L("Nøkkeltallene investorer spør om: besparelse, driftskostnader, skalerbarhet, innovasjon og ESG, med kilde", "The figures investors ask about: saving, running costs, scalability, innovation and ESG, with sources"),
    L("Scenarioutforsker, og spørsmål og svar direkte med prosjekteier", "A scenario explorer, and questions and answers directly with the project owner"),
    L("Energiregnskap med forutsetninger, regneark og utskrift", "The energy budget with its assumptions, spreadsheet and print"),
    L(`EED-simulering av brønnparken, ${EED.years} år`, `EED simulation of the borehole field, ${EED.years} years`),
    L(`Vurdering av ${MEASURES.length} tiltak med robusthet ved strømbrudd`, `Assessment of ${MEASURES.length} measures with outage resilience`),
    L("Tomtedata: sol, sikt, terreng og horisont for hver tomt", "Plot data: sun, view, terrain and horizon for every plot"),
    L("Eiendom fra Matrikkelen og veinett med stigning", "The parcel from the cadastre and the road network with grades"),
    L("Arbeidsopplegg, retning fra prosjekteier og møtenotater", "The work structure, the project owner's direction and meeting notes"),
  ],
  reports: L(
    `De offentlige dokumentene ligger allerede i dokumentbanken. Den tekniske energirapporten og markeds- og investorrapporten legges til når de leveres i sluttfasen, ${weeks(FINAL_PHASE.weeks)}.`,
    `The public documents are already in the document bank. The technical energy report and the market and investor report are added when they are delivered in the final phase, ${weeks(FINAL_PHASE.weeks, "en")}.`,
  ),
};

// ------------------------------------------------------------------ the municipality and the University of Agder
export const PUBLIC_PARTNERS = {
  title: L("For kommunen og Universitetet i Agder", "For the municipality and the University of Agder"),
  items: [
    L("Underlag til reguleringsprosessen, samlet på ett sted", "Material for the zoning process, gathered in one place"),
    L("Forbruk og effekttopper, og hva det betyr for lokalnettet", "Consumption and power peaks, and what they mean for the local grid"),
    L("Robusthet ved strømbrudd for boliger og næring", "Resilience in power cuts for homes and businesses"),
    L("Et datasett fra de eksisterende byggene, når målingene er hentet inn", "A dataset from the existing buildings, once the readings are in"),
    L("Studentarbeid og rapporter i dokumentbanken", "Student work and reports in the document bank"),
  ],
  note: L(
    "Kommunen og forskerne ved Universitetet i Agder får egne områder i prosjektportalen, med reguleringsgrunnlag og datasett.",
    "The municipality and the researchers at the University of Agder get their own areas in the project portal, with the zoning basis and datasets.",
  ),
  access: L("Be om tilgang", "Request access"),
};

// ------------------------------------------------------------------ how the project works with figures
export const FIGURES_PRINCIPLE = {
  eyebrow: L("Slik jobber vi med tall", "How we work with figures"),
  title: L("Ingen påstander uten kilde", "No claims without a source"),
  text: L(
    "Hvert tall på nettsiden står med kilde, status og hvem som eier det. Det som er anslag, står som foreløpig, og byttes ut når rapportene er levert og feltet kan måles.",
    "Every figure on the website carries its source, its status and who owns it. What is an estimate is marked provisional, and is replaced when the reports are delivered and the field can be measured.",
  ),
  sources: L("Se kildelisten", "See the list of sources"),
};

/** What a visitor can check for themselves; answers the owner's question of what investors should experience. */
export const CHECK_IT = {
  title: L("Det du kan etterprøve selv", "What you can check for yourself"),
  text: L(
    "Et felt som er målt før det er tegnet. En tomt du kan stå på i modellen og se fjorden fra. Et energikonsept med tall som kan etterprøves. Og en plattform som følger feltet fra salg til drift, med målt forbruk fra de eksisterende byggene som sammenligning underveis.",
    "A field measured before it is drawn. A plot you can stand on in the model and see the fjord from. An energy concept with figures that can be checked. And a platform that follows the field from sale to operation, with measured consumption from the existing buildings as a comparison along the way.",
  ),
  energy: L("Energikonseptet", "The energy concept"),
  documents: L("Dokumentbanken", "The document bank"),
};
