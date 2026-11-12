/**
 * What a buyer can choose for a home at Knotten, step by step.
 *
 * Honesty rules (the pages say them too):
 * - The house is the model's example house: an illustration, not a design. Size, plan, supplier and building
 *   standard are not decided yet. The choices are wishes the buyer passes on to Sigve Simonsen AS; nothing here
 *   is an offer, and price and delivery are agreed in a contract.
 * - The energy step follows the project owner's direction (4 Sep 2026) and the energy track's measures table;
 *   those options carry a source key (the "Kilde" chip).
 * - No prices here. An administrator sets them in the portal; until then a choice says "Pris på forespørsel".
 * - Every option's standard choice reproduces today's 3D picture exactly ("som i modellen").
 * - Curated, not open-ended: a few meaningful choices, like the tilvalg lists of Norwegian developers.
 *
 * Ids are stable and URL-safe: never rename one, stored configurations and shared links use them.
 */
import { FACADES, FACADE_NAMES, FRAME, MAX_MODULES, MODEL_MODULES } from "./palette";
import type { Choice, OptionDef, StepDef, T2 } from "./types";

export const STEPS: StepDef[] = [
  { id: "tomt", label: { no: "Tomt", en: "Plot" }, intro: { no: "Velg tomten. Sol, utsikt og høyde er målt for hver av de 30 tomtene.", en: "Choose the plot. Sun, view and height are measured for each of the 30 plots." } },
  { id: "hus", label: { no: "Hus", en: "House" }, intro: { no: "Huset i modellen er et eksempelhus, en illustrasjon. Her sier du hvordan du vil bruke det.", en: "The house in the model is an example house, an illustration. Here you say how you would use it." } },
  { id: "fasade", label: { no: "Fasade og tak", en: "Facade and roof" }, intro: { no: "Kledning, farger og tak. Endelige farger avklares mot reguleringsplanen.", en: "Cladding, colours and roof. Final colours are settled against the zoning plan." } },
  { id: "energi", label: { no: "Energi", en: "Energy" }, intro: { no: "Kjernen i Knotten. Valgene følger prosjekteierens retning og energisporets vurderinger.", en: "The heart of Knotten. The choices follow the project owner's direction and the energy track's assessment." } },
  { id: "interior", label: { no: "Interiør", en: "Interior" }, intro: { no: "Gulv, kjøkken, vegger og bad. Du ser valgene inne i huset.", en: "Floors, kitchen, walls and bathroom. You see the choices inside the house." } },
  { id: "ute", label: { no: "Ute", en: "Outdoors" }, intro: { no: "Terrasse, rekkverk og parkering.", en: "Terrace, railing and parking." } },
];

/** Part of every house, shown as "Inkludert i alle hus" / "Included in every house"; not a choice. */
export const INCLUDED: { id: string; label: T2; note: T2; source?: string }[] = [
  { id: "bergvarme", label: { no: "Bergvarme fra felles brønnpark", en: "Ground-source heat from a shared borehole field" }, note: { no: "Varmepumpe i teknisk rom, brønnfeltet simulert av energisporet. Foreløpig.", en: "A heat pump in the plant room; the borehole field simulated by the energy track. Provisional." }, source: "eed" },
  { id: "gulvvarme", label: { no: "Vannbåren gulvvarme", en: "Waterborne underfloor heating" }, note: { no: "Lav turtemperatur passer varmepumpen.", en: "A low supply temperature suits the heat pump." } },
  { id: "ventilasjon", label: { no: "Balansert ventilasjon med varmegjenvinning", en: "Balanced ventilation with heat recovery" }, note: { no: "Minst 80 % gjenvinning, som byggeforskriften krever.", en: "At least 80 % recovery, as the building code requires." }, source: "tek17" },
  { id: "gravann", label: { no: "Varme fra dusjvannet", en: "Heat from shower water" }, note: { no: "Energisporet: «Ja, kan spare en del energi».", en: "Energy track: \"Yes, can save some energy\"." }, source: "tiltak" },
  { id: "energiskjerm", label: { no: "Energiskjerm og måleravlesning", en: "Energy screen and meter reading" }, note: { no: "Forbruk, produksjon og pris i sanntid.", en: "Use, production and price in real time." }, source: "tiltak" },
];

/** The six claddings of the model, offered by name; "modell" keeps the house's own one. */
const MODEL_COLOURS: Choice[] = FACADES.map((hex, i) => ({
  id: ["kull", "vaergra", "kvit", "lerk", "morkgronn", "lysgra"][i],
  label: FACADE_NAMES[i],
  swatch: hex,
  params: { facade: hex },
}));

export const OPTIONS: OptionDef[] = [
  // ---------------------------------------------------------------- house
  {
    id: "speilvendt", step: "hus", kind: "choice", effects: ["exterior", "interior", "plan"],
    label: { no: "Planløsning", en: "Floor plan" },
    help: { no: "Speilvendt gir den andre gavlen mot naboen, veien eller kveldssola.", en: "Mirrored turns the other gable towards the neighbour, the road or the evening sun." },
    choices: [
      { id: "modell", standard: true, label: { no: "Som i feltplanen", en: "As in the field plan" }, params: { mirror: "model" } },
      { id: "speilvendt", label: { no: "Speilvendt", en: "Mirrored" }, params: { mirror: "flip" } },
    ],
  },
  {
    id: "underetasje", step: "hus", kind: "choice", effects: ["interior", "plan"],
    label: { no: "Underetasje", en: "Lower floor" },
    help: { no: "Bare på tomter der terrenget gir plass til en underetasje i modellen (18 av 30).", en: "Only on plots where the ground leaves room for a lower floor in the model (18 of 30)." },
    choices: [
      { id: "innredet", standard: true, needs: "lowerFloorPlot", label: { no: "Allrom og to soverom, som i modellen", en: "Family room and two bedrooms, as in the model" }, params: { lower: "finished" } },
      { id: "tre-soverom", needs: "lowerFloorPlot", label: { no: "Tre soverom", en: "Three bedrooms" }, note: { no: "Allrommet blir et soverom", en: "The family room becomes a bedroom" }, params: { lower: "three-bedrooms" } },
      { id: "utleie", needs: "lowerFloorPlot", label: { no: "Utleiedel", en: "Rental unit" }, note: { no: "Egen inngang og eget kjøkken. Må godkjennes.", en: "Own entrance and kitchen. Needs approval." }, params: { lower: "rental" } },
      { id: "uinnredet", needs: "lowerFloorPlot", label: { no: "Uinnredet", en: "Unfinished" }, note: { no: "Klargjort for senere, brukes som bod", en: "Prepared for later, used as storage" }, params: { lower: "shell" } },
    ],
  },

  // ---------------------------------------------------------------- facade and roof
  {
    id: "kledning", step: "fasade", kind: "choice", effects: ["exterior"],
    label: { no: "Kledning", en: "Cladding" },
    choices: [
      { id: "modell", standard: true, label: { no: "Stående tømmermannskledning, som i modellen", en: "Vertical board on board, as in the model" }, params: { pattern: "board-on-board" } },
      { id: "dobbeltfals", label: { no: "Stående dobbeltfals", en: "Vertical tongue and groove" }, params: { pattern: "vertical-flush" } },
      { id: "liggende", label: { no: "Liggende", en: "Horizontal" }, params: { pattern: "horizontal" } },
    ],
  },
  {
    id: "farge", step: "fasade", kind: "colour", effects: ["exterior"],
    label: { no: "Fasadefarge", en: "Facade colour" },
    help: { no: "Fargene er illustrasjoner og vises gjennom modellens lys. Listverket følger fasaden.", en: "Colours are illustrations, shown in the model's light. The trim follows the facade." },
    choices: [
      { id: "modell", standard: true, label: { no: "Som i modellen", en: "As in the model" }, params: { facade: "model" } },
      ...MODEL_COLOURS,
      { id: "fjordbla", label: { no: "Fjordblå", en: "Fjord blue" }, swatch: "#2f5f78", params: { facade: "#2f5f78" } },
    ],
  },
  {
    id: "vinduer", step: "fasade", kind: "colour", effects: ["exterior"],
    label: { no: "Vinduer og dører", en: "Windows and doors" },
    choices: [
      { id: "modell", standard: true, label: { no: "Mørk grå, som i modellen", en: "Dark grey, as in the model" }, swatch: FRAME, params: { frame: "model" } },
      { id: "kvit", label: { no: "Kvite karmer", en: "White frames" }, swatch: "#f2f1ec", params: { frame: "#f2f1ec" } },
      { id: "sort", label: { no: "Sorte karmer", en: "Black frames" }, swatch: "#17181a", params: { frame: "#17181a" } },
      { id: "tre", label: { no: "Tre og aluminium", en: "Wood and aluminium" }, swatch: "#8a6a4a", params: { frame: "#8a6a4a" } },
    ],
  },
  {
    id: "tak", step: "fasade", kind: "choice", effects: ["exterior"],
    label: { no: "Tak", en: "Roof" },
    help: { no: "Sørtaket holdes enkelt og uten ark, så solcellene får mest mulig flate.", en: "The south roof is kept simple, without dormers, so the panels get as much surface as possible." },
    source: "retning",
    choices: [
      { id: "modell", standard: true, label: { no: "Falset stål, som i modellen", en: "Standing-seam steel, as in the model" }, params: { roof: "model" } },
      { id: "takstein", label: { no: "Betongtakstein, sort", en: "Concrete tiles, black" }, params: { roof: "tile", roofColour: "#202224" } },
      { id: "sedum", label: { no: "Grønt tak på nordsiden", en: "Green roof on the north side" }, note: { no: "Sedum holder på regnvann", en: "Sedum holds rainwater" }, params: { roof: "sedum-north" } },
    ],
  },

  // ---------------------------------------------------------------- energy (sourced)
  {
    id: "solceller", step: "energi", kind: "choice", effects: ["exterior", "energy"],
    label: { no: "Solceller", en: "Solar panels" },
    help: { no: "Energiregnskapet regner med solceller på hvert hus. Tallene er foreløpige.", en: "The energy budget counts solar panels on every house. The figures are provisional." },
    source: "sol",
    choices: [
      { id: "modell", standard: true, label: { no: `${MODEL_MODULES} paneler, som i energiregnskapet`, en: `${MODEL_MODULES} panels, as in the energy budget` }, params: { modules: MODEL_MODULES } },
      { id: "hele", label: { no: `Hele sørtaket, ${MAX_MODULES} paneler`, en: `The whole south roof, ${MAX_MODULES} panels` }, note: { no: "Mer produksjon, mest om sommeren", en: "More production, mostly in summer" }, params: { modules: MAX_MODULES } },
      { id: "integrert", label: { no: "Integrert solcelletak", en: "Integrated solar roof" }, note: { no: "Panelene er taket, helt sort tak. Vurderes av prosjektet.", en: "The panels are the roof, all black. Being assessed by the project." }, params: { modules: MAX_MODULES, integrated: true } },
    ],
  },
  {
    id: "batteri", step: "energi", kind: "choice", effects: ["energy"],
    label: { no: "Hjemmebatteri", en: "Home battery" },
    help: { no: "Prosjekteieren vil at hver bolig i utgangspunktet får eget batteri og energistyring.", en: "The project owner wants every home to start with its own battery and energy management." },
    source: "batteri",
    choices: [
      { id: "14", standard: true, label: { no: "14 kWh, som i energiregnskapet", en: "14 kWh, as in the energy budget" }, params: { batteryKwh: 14 } },
      { id: "10", label: { no: "10 kWh", en: "10 kWh" }, params: { batteryKwh: 10 } },
      { id: "20", label: { no: "20 kWh", en: "20 kWh" }, note: { no: "Lenger strøm ved strømbrudd", en: "Power for longer in an outage" }, params: { batteryKwh: 20 } },
    ],
  },
  {
    id: "strombrudd", step: "energi", kind: "choice", effects: ["energy"],
    label: { no: "Ved strømbrudd", en: "In a power cut" },
    help: { no: "Robusthet ved strømbrudd er et av prosjektets mål. Batteriet holder av en reserve.", en: "Robustness in a power cut is one of the project's goals. The battery keeps a reserve." },
    source: "tiltak",
    choices: [
      { id: "viktige", standard: true, label: { no: "Viktige kurser", en: "Essential circuits" }, note: { no: "Varmepumpe, kjøl og frys, lys og internett; 30 % av batteriet holdes av", en: "Heat pump, fridge and freezer, light and internet; 30 % of the battery kept back" }, params: { backup: "essential", reserve: 0.3 } },
      { id: "hele", label: { no: "Hele huset", en: "The whole house" }, params: { backup: "whole", reserve: 0.3 } },
      { id: "reserve", label: { no: "Større reserve, 50 %", en: "Larger reserve, 50 %" }, params: { backup: "essential", reserve: 0.5 } },
    ],
  },
  {
    id: "kjoling", step: "energi", kind: "choice", effects: ["energy"],
    label: { no: "Frikjøling om sommeren", en: "Free cooling in summer" },
    help: { no: "Brønnfeltet kan kjøle huset om sommeren og lagre varmen til vinteren.", en: "The borehole field can cool the house in summer and store the heat for winter." },
    source: "eed",
    choices: [
      { id: "nei", standard: true, label: { no: "Nei", en: "No" }, params: { cooling: false } },
      { id: "ja", label: { no: "Ja, gjennom gulvene", en: "Yes, through the floors" }, params: { cooling: true } },
    ],
  },
  {
    id: "styring", step: "energi", kind: "choice", effects: ["energy"],
    label: { no: "Styring og trygghet", en: "Control and safety" },
    source: "tiltak",
    choices: [
      { id: "smart", standard: true, label: { no: "Smart energistyring", en: "Smart energy control" }, note: { no: "Batteri, varmtvann og lading etter pris og sol", en: "Battery, hot water and charging by price and sun" }, params: { control: "smart" } },
      { id: "smarthus", label: { no: "Smarthus Pluss", en: "Smart home plus" }, note: { no: "I tillegg varme per rom, lys og vannstopp", en: "Also room heating, lighting and a water shut-off" }, params: { control: "home" } },
      { id: "trygghet", label: { no: "Smarthus og trygghetspakke", en: "Smart home and safety package" }, note: { no: "I tillegg alarm og varsel om røyk, vann og strømbrudd", en: "Also an alarm and alerts for smoke, water and power cuts" }, params: { control: "safety" } },
    ],
  },
  {
    id: "lading", step: "energi", kind: "choice", effects: ["energy", "exterior"],
    label: { no: "Elbillading", en: "EV charging" },
    choices: [
      { id: "en", standard: true, label: { no: "Én smart lader, som i modellen", en: "One smart charger, as in the model" }, params: { chargers: 1 } },
      { id: "to", label: { no: "To ladepunkter", en: "Two charging points" }, params: { chargers: 2 } },
      { id: "klargjort", label: { no: "Bare klargjort for lader", en: "Prepared for a charger only" }, params: { chargers: 0 } },
    ],
  },

  // ---------------------------------------------------------------- interior
  {
    id: "gulv", step: "interior", kind: "colour", effects: ["interior"],
    label: { no: "Gulv", en: "Floors" },
    choices: [
      { id: "modell", standard: true, label: { no: "Eik, som i modellen", en: "Oak, as in the model" }, swatch: "#cba87e", params: { floor: "model" } },
      { id: "lys", label: { no: "Lys eik, ettstavs", en: "Light oak, single plank" }, swatch: "#dcc5a3", params: { floor: "#dcc5a3", plank: "wide" } },
      { id: "hvitpigmentert", label: { no: "Hvitpigmentert eik", en: "White-pigmented oak" }, swatch: "#e6ddd0", params: { floor: "#e6ddd0" } },
      { id: "rokt", label: { no: "Røkt eik, ettstavs", en: "Smoked oak, single plank" }, swatch: "#7a5d45", params: { floor: "#7a5d45", plank: "wide" } },
    ],
  },
  {
    id: "vegger", step: "interior", kind: "colour", effects: ["interior"],
    label: { no: "Veggfarge", en: "Wall colour" },
    help: { no: "Hele rom, ingen tapet.", en: "Whole rooms, no wallpaper." },
    choices: [
      { id: "modell", standard: true, label: { no: "Hvit, som i modellen", en: "White, as in the model" }, swatch: "#f7f6f2", params: { wall: "model" } },
      { id: "brukket", label: { no: "Brukket hvit", en: "Off-white" }, swatch: "#ece7dc", params: { wall: "#ece7dc" } },
      { id: "varmgra", label: { no: "Varm grå", en: "Warm grey" }, swatch: "#cfcac1", params: { wall: "#cfcac1" } },
      { id: "salvie", label: { no: "Salviegrønn", en: "Sage green" }, swatch: "#b9c2b0", params: { wall: "#b9c2b0" } },
    ],
  },
  {
    id: "kjokken", step: "interior", kind: "colour", effects: ["interior"],
    label: { no: "Kjøkkenfronter", en: "Kitchen fronts" },
    choices: [
      { id: "modell", standard: true, label: { no: "Som i modellen", en: "As in the model" }, params: { kitchen: "model" } },
      { id: "kvit", label: { no: "Kvit matt", en: "Matt white" }, swatch: "#efede8", params: { kitchen: "#efede8" } },
      { id: "gronn", label: { no: "Furugrønn", en: "Pine green" }, swatch: "#4c6352", params: { kitchen: "#4c6352" } },
      { id: "eik", label: { no: "Eikefinér", en: "Oak veneer" }, swatch: "#a8835c", params: { kitchen: "#a8835c" } },
      { id: "sort", label: { no: "Sort", en: "Black" }, swatch: "#222324", params: { kitchen: "#222324" } },
    ],
  },
  {
    id: "benkeplate", step: "interior", kind: "colour", effects: ["interior"],
    label: { no: "Benkeplate", en: "Worktop" },
    choices: [
      { id: "modell", standard: true, label: { no: "Mørk laminat, som i modellen", en: "Dark laminate, as in the model" }, swatch: "#3a3c3d", params: { worktop: "model" } },
      { id: "lys", label: { no: "Lys kompaktlaminat", en: "Light compact laminate" }, swatch: "#dedbd4", params: { worktop: "#dedbd4" } },
      { id: "stein", label: { no: "Naturstein", en: "Natural stone" }, swatch: "#9a968f", params: { worktop: "#9a968f" } },
      { id: "eik", label: { no: "Heltre eik", en: "Solid oak" }, swatch: "#b08a60", params: { worktop: "#b08a60" } },
    ],
  },
  {
    id: "bad", step: "interior", kind: "choice", effects: ["interior"],
    label: { no: "Bad", en: "Bathroom" },
    choices: [
      { id: "modell", standard: true, label: { no: "Lyse fliser, som i modellen", en: "Light tiles, as in the model" }, params: { bath: "model" } },
      { id: "store", label: { no: "Store fliser, 60 x 60", en: "Large tiles, 60 x 60" }, params: { bath: "large" } },
      { id: "mork", label: { no: "Mørke fliser", en: "Dark tiles" }, swatch: "#3a3c3e", params: { bath: "#3a3c3e" } },
    ],
  },
  {
    id: "ildsted", step: "interior", kind: "choice", effects: ["interior", "exterior", "energy"],
    label: { no: "Ildsted", en: "Stove" },
    help: { no: "Gulvvarmen gjør pipe valgfritt. En vedovn gir varme ved strømbrudd.", en: "The underfloor heating makes a chimney optional. A wood stove gives heat in a power cut." },
    choices: [
      { id: "ingen", standard: true, label: { no: "Ingen, som i modellen", en: "None, as in the model" }, params: { stove: "none" } },
      { id: "pipe", label: { no: "Pipe klargjort for ovn", en: "Chimney prepared for a stove" }, params: { stove: "chimney" } },
      { id: "vedovn", label: { no: "Pipe og rentbrennende vedovn", en: "Chimney and clean-burning wood stove" }, params: { stove: "stove" } },
    ],
  },

  // ---------------------------------------------------------------- outdoors
  {
    id: "terrasse", step: "ute", kind: "choice", effects: ["exterior"],
    label: { no: "Terrasse", en: "Terrace" },
    choices: [
      { id: "modell", standard: true, label: { no: "3 meter dyp, som i modellen", en: "3 metres deep, as in the model" }, params: { terrace: "model" } },
      { id: "stor", label: { no: "4,5 meter dyp", en: "4.5 metres deep" }, params: { terrace: "large" } },
    ],
  },
  {
    id: "rekkverk", step: "ute", kind: "choice", effects: ["exterior"],
    label: { no: "Rekkverk", en: "Railing" },
    choices: [
      { id: "modell", standard: true, label: { no: "Glass, som i modellen", en: "Glass, as in the model" }, note: { no: "Holder utsikten fri", en: "Keeps the view clear" }, params: { railing: "model" } },
      { id: "tre", label: { no: "Spiler i tre", en: "Timber balusters" }, params: { railing: "timber" } },
      { id: "stal", label: { no: "Spiler i stål", en: "Steel balusters" }, params: { railing: "steel" } },
    ],
  },
  {
    id: "terrassebord", step: "ute", kind: "colour", effects: ["exterior"],
    label: { no: "Terrassebord", en: "Decking" },
    choices: [
      { id: "modell", standard: true, label: { no: "Som i modellen", en: "As in the model" }, params: { deck: "model" } },
      { id: "modifisert", label: { no: "Modifisert tre", en: "Modified wood" }, note: { no: "Lite vedlikehold i kystklima", en: "Low upkeep in a coastal climate" }, swatch: "#5b4636", params: { deck: "#5b4636" } },
      { id: "kompositt", label: { no: "Kompositt, grå", en: "Composite, grey" }, swatch: "#6f6c66", params: { deck: "#6f6c66" } },
    ],
  },
  {
    id: "parkering", step: "ute", kind: "choice", effects: ["exterior", "energy"],
    label: { no: "Parkering og bod", en: "Parking and storage" },
    help: { no: "Plasseres mot adkomstveien der tomten gir plass.", en: "Placed towards the access road where the plot has room." },
    choices: [
      { id: "modell", standard: true, label: { no: "Biloppstillingsplass, som i modellen", en: "Parking space, as in the model" }, params: { parking: "space" } },
      { id: "carport", label: { no: "Carport med bod", en: "Carport with storage" }, params: { parking: "carport" } },
      { id: "carport-sol", label: { no: "Carport med bod og solceller på taket", en: "Carport with storage and solar roof" }, params: { parking: "carport-pv" } },
    ],
  },
];

export const OPTION_BY_ID: Record<string, OptionDef> = Object.fromEntries(OPTIONS.map((o) => [o.id, o]));
