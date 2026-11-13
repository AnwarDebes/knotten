import { DOCS, EED as SIM, WIND_SCALE, dateLong, fmt } from "@/lib/facts";
import { MAP, mapIn, type MapKey } from "@/lib/content/maps";

/**
 * Maps and drawings from the project owner, and analysis images from the energy track. Shown at native size, never
 * upscaled. The maps themselves, in both languages, are src/lib/content/maps.ts (mapIn(key, "en") for English);
 * MAPS here is the Norwegian list the Klassisk pages have always read.
 */
export type MapImg = { src: string; w: number; h: number; alt: string; title: string; text: string; credit: string };

export const MAPS: Record<MapKey, MapImg> = Object.fromEntries((Object.keys(MAP) as MapKey[]).map((k) => [k, mapIn(k, "no")])) as Record<MapKey, MapImg>;

export const EED: Record<string, MapImg> = {
  grunnlast: {
    src: "/img/eed-grunnlast.png", w: 601, h: 1439,
    alt: "Earth Energy Designer, dialogen Base load med årlig varme, kjøling og tappevann",
    title: "Grunnlast",
    text: `Varme ${SIM.base_heat_mwh} MWh per år, kjøling ${SIM.base_cool_mwh} MWh, tappevann ${SIM.dhw_mwh} MWh med SPF ${fmt(SIM.dhw_spf, "no", 1)}. Netto varme hentet fra grunnen: ${Math.round(SIM.ground_net_mwh)} MWh.`,
    credit: "Energisporet, Earth Energy Designer",
  },
  bronn: {
    src: "/img/eed-bronn.png", w: 785, h: 1256,
    alt: `Earth Energy Designer, dialogen Borehole and heat exchanger med ${SIM.boreholes} brønner i ${SIM.grid} åpen rektangel`,
    title: "Brønnfeltet",
    text: `${SIM.boreholes} brønner i et åpent rektangel på ${SIM.grid}, ${Math.round(SIM.depth_m)} meter dype, ${SIM.spacing_m} meter mellom hver, ${SIM.diameter_mm} mm diameter, dobbel U-kollektor.`,
    credit: "Energisporet, Earth Energy Designer",
  },
  temperatur: {
    src: "/img/eed-temperatur.png", w: 2341, h: 1005,
    alt: `Earth Energy Designer, graf over væsketemperatur i brønnene over ${SIM.years} år`,
    title: `Temperatur over ${SIM.years} år`,
    text: `Grafen stabiliserer seg. Siste år er minimum ${fmt(SIM.fluid_min_c)} °C og maksimum ${fmt(SIM.fluid_max_c)} °C. Energisporet vurderer begge deler som bra.`,
    credit: "Energisporet, Earth Energy Designer",
  },
};

/** The energy track's list of what it studies next, written out (it was a screenshot of working notes). */
export const EED_NOTES = {
  title: "Hva som undersøkes videre",
  items: [
    `Vindkraft i klassen ${WIND_SCALE.kw[0]} til ${WIND_SCALE.kw[1]} kW`,
    "Hybride solceller og solfangere",
    "Varden skole i Bergen og Zero Village Bergen som referanseprosjekter",
    "Verktøyene TRNSYS og Winsun",
  ],
  credit: `Energisporet, ${dateLong(DOCS.measures.date)}`,
};
