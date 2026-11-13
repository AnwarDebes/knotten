import { DOCS, EED, WIND_SCALE, dateLong, fmt, type T } from "@/lib/facts";

/**
 * The energy track's borehole analysis in Earth Energy Designer, as four figures with captions: the fluid
 * temperature over the simulated years, the base load and the borehole field as entered in the program, and
 * the track's written list of what it studies next. One list for both designs and both languages; each page
 * draws them in its own look. The pictures are the analysis's own screenshots, cropped to the dialogs.
 */
export type EedFigure = {
  id: "temperatur" | "grunnlast" | "bronn";
  src: string;
  w: number;
  h: number;
  /** a wide picture spans the figure grid */
  wide?: boolean;
  alt: T;
  title: T;
  text: T;
  credit: T;
};

const CREDIT: T = { no: "Energisporet, Earth Energy Designer", en: "The energy track, Earth Energy Designer" };

export const EED_FIGURES: EedFigure[] = [
  {
    id: "temperatur",
    src: "/img/eed-temperatur.png", w: 2341, h: 1005, wide: true,
    alt: {
      no: `Graf fra Earth Energy Designer: væsketemperaturen i brønnene over ${EED.years} år. Den stabiliserer seg, og siste år ligger den mellom ${fmt(EED.fluid_min_c)} og ${fmt(EED.fluid_max_c)} °C.`,
      en: `Graph from Earth Energy Designer: the fluid temperature in the boreholes over ${EED.years} years. It settles, and in the last year it stays between ${fmt(EED.fluid_min_c, "en")} and ${fmt(EED.fluid_max_c, "en")} °C.`,
    },
    title: { no: `Temperatur over ${EED.years} år`, en: `Temperature over ${EED.years} years` },
    text: {
      no: `Grafen stabiliserer seg. Siste år er laveste væsketemperatur ${fmt(EED.fluid_min_c)} °C og høyeste ${fmt(EED.fluid_max_c)} °C. Energisporet vurderer begge deler som bra.`,
      en: `The curve settles. In the last year the lowest fluid temperature is ${fmt(EED.fluid_min_c, "en")} °C and the highest ${fmt(EED.fluid_max_c, "en")} °C. The energy track judges both to be good.`,
    },
    credit: CREDIT,
  },
  {
    id: "grunnlast",
    src: "/img/eed-grunnlast.png", w: 601, h: 1439,
    alt: {
      no: `Earth Energy Designer, dialogen for grunnlast: varme ${EED.base_heat_mwh} MWh og kjøling ${EED.base_cool_mwh} MWh i året fordelt på månedene, tappevann ${EED.dhw_mwh} MWh, netto ${fmt(EED.ground_net_mwh)} MWh hentet fra grunnen`,
      en: `Earth Energy Designer, the base load dialog: heating ${EED.base_heat_mwh} MWh and cooling ${EED.base_cool_mwh} MWh a year spread over the months, hot water ${EED.dhw_mwh} MWh, net ${fmt(EED.ground_net_mwh, "en")} MWh taken from the ground`,
    },
    title: { no: "Grunnlast", en: "Base load" },
    text: {
      no: `Varme ${EED.base_heat_mwh} MWh i året, kjøling ${EED.base_cool_mwh} MWh, tappevann ${EED.dhw_mwh} MWh med årsvarmefaktor ${fmt(EED.dhw_spf, "no", 1)}. Netto varme hentet fra grunnen: ${Math.round(EED.ground_net_mwh)} MWh.`,
      en: `Heating ${EED.base_heat_mwh} MWh a year, cooling ${EED.base_cool_mwh} MWh, hot water ${EED.dhw_mwh} MWh with a seasonal factor of ${fmt(EED.dhw_spf, "en", 1)}. Net heat taken from the ground: ${Math.round(EED.ground_net_mwh)} MWh.`,
    },
    credit: CREDIT,
  },
  {
    id: "bronn",
    src: "/img/eed-bronn.png", w: 785, h: 1256,
    alt: {
      no: `Earth Energy Designer, dialogen for brønn og kollektor: ${EED.boreholes} brønner i et åpent rektangel på ${EED.grid}, ${fmt(EED.depth_m)} m dype, ${EED.spacing_m} m mellom hver, ${EED.diameter_mm} mm, dobbel U-kollektor`,
      en: `Earth Energy Designer, the borehole and heat exchanger dialog: ${EED.boreholes} boreholes in an open rectangle of ${EED.grid}, ${fmt(EED.depth_m, "en")} m deep, ${EED.spacing_m} m apart, ${EED.diameter_mm} mm, double U collector`,
    },
    title: { no: "Brønnfeltet", en: "The borehole field" },
    text: {
      no: `${EED.boreholes} brønner i et åpent rektangel på ${EED.grid}, ${Math.round(EED.depth_m)} meter dype, ${EED.spacing_m} meter mellom hver, ${EED.diameter_mm} mm i diameter, med dobbel U-kollektor.`,
      en: `${EED.boreholes} boreholes in an open rectangle of ${EED.grid}, ${Math.round(EED.depth_m)} metres deep, ${EED.spacing_m} metres apart, ${EED.diameter_mm} mm across, with a double U collector.`,
    },
    credit: CREDIT,
  },
];

/** The energy track's list of what it studies next, written out (it was a screenshot of working notes). */
export const EED_NEXT: { title: T; items: T[]; credit: T } = {
  title: { no: "Hva som undersøkes videre", en: "What is studied next" },
  items: [
    { no: `Vindkraft i klassen ${WIND_SCALE.kw[0]} til ${WIND_SCALE.kw[1]} kW`, en: `Wind power in the ${WIND_SCALE.kw[0]} to ${WIND_SCALE.kw[1]} kW class` },
    { no: "Hybride solceller og solfangere", en: "Hybrid solar panels and solar collectors" },
    { no: "Varden skole i Bergen og Zero Village Bergen som referanseprosjekter", en: "Varden school in Bergen and Zero Village Bergen as reference projects" },
    { no: "Verktøyene TRNSYS og Winsun", en: "The TRNSYS and Winsun tools" },
  ],
  credit: { no: `Energisporet, ${dateLong(DOCS.measures.date)}`, en: `The energy track, ${dateLong(DOCS.measures.date, "en")}` },
};
