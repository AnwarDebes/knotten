import { FACT, fmt, word, type Lang, type SourceId, type T } from "@/lib/facts";

/**
 * The eight maps behind the plan, once, for both designs and both languages: the project owner's maps and the
 * terrain map made for the website. The map journeys on both front pages, the Klassisk maps page (/kart) and the
 * maps on the Moderne area page (/no/omradet#kart) all read this list. One file per map, the originals in
 * public/img, shown at their own size and never upscaled.
 */
export type MapKey = "siktlinje" | "terreng" | "eiendom" | "omrade" | "bygg" | "skisse" | "profil" | "grillbu";

export type SharedMap = { key: MapKey; src: string; w: number; h: number; alt: T; title: T; text: T; credit: T; source: SourceId };

const OWNER: T = { no: "Prosjekteier", en: "Project owner" };
const OWNER_NORKART: T = { no: "Prosjekteier, kartgrunnlag Norkart", en: "Project owner, base map Norkart" };
const NORGESKART: T = { no: "Norgeskart, Kartverket", en: "Norgeskart, Kartverket" };
const n = (v: number, lang: Lang) => fmt(v, lang);

export const MAP: Record<MapKey, SharedMap> = {
  siktlinje: {
    key: "siktlinje",
    src: "/img/kart-siktlinje.png", w: 445, h: 369,
    alt: { no: "Regionkart med stiplet linje fra byggefeltet ved Raudberg sørover forbi Snig til åpent hav", en: "Regional map with a dashed line from the building site at Raudberg south past Snig to open sea" },
    title: { no: "Siktlinjen til havet", en: "The sight line to the sea" },
    text: {
      no: "Prosjekteiers kart: «Stiplet linje er inn til byggefeltet og sikt linjen ut til åpent hav.» Linjen går fra Raudberg forbi Snig og ut Sniksfjorden. Det er den retningen feltet ser.",
      en: "The project owner's map: the dashed line runs in to the building site, and the sight line runs out to open sea. It goes from Raudberg past Snig and out Sniksfjorden. That is the direction the field faces.",
    },
    credit: OWNER,
    source: "sikt",
  },
  terreng: {
    key: "terreng",
    src: "/img/kart-terreng-1km.png", w: 1000, h: 1000,
    alt: { no: "Terrengkart over 1 km rundt Knotten med 5 m høydekoter, veier og bygg, laget fra Kartverkets høydemodell", en: "Terrain map of 1 km around Knotten with 5 m contours, roads and buildings, made from Kartverket's elevation model" },
    title: { no: "Terrenget rundt Knotten", en: "The terrain around Knotten" },
    text: {
      no: `En kilometer rundt feltet, tegnet for nettsiden fra Kartverkets høydemodell med 1 m oppløsning og 5 m koter. Det røde krysset er posisjonen ${FACT.lat}, ${FACT.lon}. Åsene bak stiger til over 190 meter, mens flaten ved elva ligger nær havnivå.`,
      en: `One kilometre around the field, drawn for the website from Kartverket's elevation model at 1 m resolution with 5 m contours. The red cross is the position ${FACT.lat}, ${FACT.lon}. The hills behind rise to over 190 metres, while the flat by the river lies close to sea level.`,
    },
    credit: { no: "Laget for nettsiden: Kartverket DTM 1 m (CC BY 4.0), veier og bygg fra OpenStreetMap (ODbL)", en: "Made for the website: Kartverket DTM 1 m (CC BY 4.0), roads and buildings from OpenStreetMap (ODbL)" },
    source: "posisjon",
  },
  eiendom: {
    key: "eiendom",
    src: "/img/kart-eiendom.png", w: 928, h: 703,
    alt: {
      no: `Eiendomskart fra Norgeskart for ${FACT.property_address}, gnr ${FACT.gnr} bnr ${FACT.bnr}, ${n(FACT.parcel_bnr10_m2, "no")} m²`,
      en: `Property map from Norgeskart for ${FACT.property_address}, cadastral unit ${FACT.gnr}/${FACT.bnr}, ${n(FACT.parcel_bnr10_m2, "en")} m²`,
    },
    title: { no: "Eiendommen", en: "The property" },
    text: {
      no: `${FACT.property_address}, ${FACT.postcode}. Gnr ${FACT.gnr} bnr ${FACT.bnr}, ${n(FACT.parcel_bnr10_m2, "no")} m². Sammen med bnr ${FACT.bnr_extra} er arealet ${n(FACT.parcel_m2, "no")} m².`,
      en: `${FACT.property_address}, ${FACT.postcode}. Cadastral unit ${FACT.gnr}/${FACT.bnr}, ${n(FACT.parcel_bnr10_m2, "en")} m². Together with ${FACT.gnr}/${FACT.bnr_extra} the area is ${n(FACT.parcel_m2, "en")} m².`,
    },
    credit: NORGESKART,
    source: "areal",
  },
  omrade: {
    key: "omrade",
    src: "/img/kart-omrade.png", w: 832, h: 856,
    alt: {
      no: `Kart der prosjektområdet er markert med blå strek langs eiendomsgrensen, med Løkkeheia ${n(FACT.lokkeheia_m, "no")} moh, Knotten og Rødbergsveien`,
      en: `Map with the project area marked by a blue line along the property boundary, with Løkkeheia at ${n(FACT.lokkeheia_m, "en")} m above sea level, Knotten and Rødbergsveien`,
    },
    title: { no: "Prosjektområdet", en: "The project area" },
    text: {
      no: `Området er markert i blått langs den røde eiendomsgrensen. Det dekker knausen Knotten og en smalere del ned til Rødbergsveien ved husnummer 121 og 123. Løkkeheia bak feltet ligger ${n(FACT.lokkeheia_m, "no")} moh. Prosjekteier sier at tomter nede på flaten ikke får sjøutsikt.`,
      en: `The area is marked in blue along the red property boundary. It covers the knoll Knotten and a narrower part down to Rødbergsveien by house numbers 121 and 123. Løkkeheia behind the field is ${n(FACT.lokkeheia_m, "en")} m above sea level. The project owner says plots down on the flat will not have a sea view.`,
    },
    credit: OWNER_NORKART,
    source: "flat",
  },
  bygg: {
    key: "bygg",
    src: "/img/kart-bygg.png", w: 451, h: 426,
    alt: { no: "Kartutsnitt med høydekurver over Knotten, eksisterende bygg i oransje og to planlagte bygg i grønt", en: "Map detail with contours over Knotten, existing buildings in orange and two planned buildings in green" },
    title: { no: "Byggene i dag og de som er planlagt", en: "The buildings today and those planned" },
    text: {
      no: "Oransje bygg finnes i dag. De to grønne er planlagt: en utvidelse av kontorbygget og et lager- og verkstedbygg rett bak bolighuset.",
      en: "The orange buildings stand today. The two green ones are planned: an extension of the office building and a warehouse and workshop building directly behind the house.",
    },
    credit: OWNER_NORKART,
    source: "bygg",
  },
  skisse: {
    key: "skisse",
    src: "/img/skisse-situasjonsplan.png", w: 1234, h: 777,
    alt: {
      no: `Skisse over flyfoto: rekker med boliger langs en vei i hårnålssvinger, merket Stigning på veien max ${FACT.road_grade_pct} % og Gang sti`,
      en: `Sketch over an aerial photo: rows of homes along a road in hairpin bends, marked with a road gradient of at most ${FACT.road_grade_pct} % and a footpath`,
    },
    title: { no: "Skissen til situasjonsplan", en: "The site plan sketch" },
    text: {
      no: `Prosjekteiers første skisse: rekker av hus langs én vei som svinger seg oppover feltet i hårnålssvinger, gangstier mellom rekkene, og de to planlagte byggene i grønt nederst til høyre. Skissen setter maks ${FACT.road_grade_pct} prosent stigning som mål; på dagens terreng er veien brattere, så reguleringsplanen må gi lengre sløyfer. Modellen legger ${word(FACT.rows)} rekker inn i det målte terrenget innenfor eiendomsgrensen: A, B og C over hverandre i sørhellingen og D på knausen Knotten.`,
      en: `The project owner's first sketch: rows of houses along one road that hairpins up the field, footpaths between the rows, and the two planned buildings in green at the lower right. The sketch sets at most ${FACT.road_grade_pct} percent gradient as the aim; on today's ground the road is steeper, so the zoning plan must give longer loops. The model puts ${word(FACT.rows, "en")} rows into the measured terrain inside the property boundary: A, B and C one above the other on the south slope and D on the knoll Knotten.`,
    },
    credit: OWNER,
    source: "vei",
  },
  profil: {
    key: "profil",
    src: "/img/kart-terrengprofil.png", w: 830, h: 675,
    alt: {
      no: `Terrengprofil i Norgeskart fra punkt A ved Spangereidveien til punkt B ved Knotten, ${n(FACT.profile_m, "no")} m, 0 til ${FACT.knotten_m} moh`,
      en: `Terrain profile in Norgeskart from point A by Spangereidveien to point B at Knotten, ${n(FACT.profile_m, "en")} m, 0 to ${FACT.knotten_m} m above sea level`,
    },
    title: { no: "Terrengprofilen", en: "The terrain profile" },
    text: {
      no: `Fra vannet ved Spangereidveien (A) til Knotten (B) er det ${n(FACT.profile_m, "no")} meter. Profilen er flat over elvesletta og stiger bratt opp knausen, fra 0 til ${FACT.knotten_m} meter over havet. Den flate delen ved veien er der kontorbygget og bolighuset står i dag.`,
      en: `From the water by Spangereidveien (A) to Knotten (B) is ${n(FACT.profile_m, "en")} metres. The profile is flat across the river plain and rises steeply up the knoll, from 0 to ${FACT.knotten_m} metres above sea level. The flat part by the road is where the office building and the house stand today.`,
    },
    credit: NORGESKART,
    source: "profil",
  },
  grillbu: {
    key: "grillbu",
    src: "/img/kart-grillbu.png", w: 713, h: 494,
    alt: { no: "Kart med pil til naboens grillbu øst for Knotten, der utsiktsbildet er tatt", en: "Map with an arrow to the neighbour's grill hut east of Knotten, where the view photo was taken" },
    title: { no: "Der utsiktsbildet er tatt", en: "Where the view photo was taken" },
    text: {
      no: "«Nabo grillbu med utsikten som vist i bildet.» Grillbua ligger på skrenten øst for Knotten, på nabotomten, litt lavere enn feltet.",
      en: "The project owner's note on the map: the neighbour's grill hut, with the view shown in the photo. The hut sits on the ledge east of Knotten, on the neighbouring plot, a little lower than the field.",
    },
    credit: OWNER_NORKART,
    source: "foto",
  },
};

/** The order to read them in, from the coast down to the plot: the map journeys and the maps pages follow it. */
export const MAP_ORDER: MapKey[] = ["siktlinje", "terreng", "eiendom", "omrade", "bygg", "skisse", "profil", "grillbu"];

/** One map in one language, in the shape the Klassisk pages have always read (src/lib/klassisk/maps.ts). */
export type LocalMap = { src: string; w: number; h: number; alt: string; title: string; text: string; credit: string };

export function mapIn(key: MapKey, lang: Lang): LocalMap {
  const m = MAP[key];
  return { src: m.src, w: m.w, h: m.h, alt: m.alt[lang], title: m.title[lang], text: m.text[lang], credit: m.credit[lang] };
}

/** "Kart 3 av 8" / "Map 3 of 8". */
export const mapCount = (i: number, lang: Lang) => (lang === "no" ? `${i + 1} av ${MAP_ORDER.length}` : `${i + 1} of ${MAP_ORDER.length}`);

/** The heading of the maps in both designs (vocabulary: Kart og terreng / Maps and terrain). */
export const MAPS_TITLE: T = { no: "Kart og terreng", en: "Maps and terrain" };
