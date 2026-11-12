/**
 * Energy estimate for one configured house on its plot: a year of model figures.
 *
 * With the simulation's inputs (`sim`: the typical weather year, the NO2 prices and the household rhythm in
 * public/twin/energy.json) the house runs hour by hour through the same simulation as the energy pages
 * (src/lib/sim): its plot's roof pitch, direction and measured terrain horizon, the buyer's choices, and the energy
 * budget's household and heat. The house is counted on its own: no sharing with the neighbours, no shared plant.
 * Without `sim` (the first paint, before the page's worker answers) it is a quick overslag from the budget's own
 * figures, with the bill and the power cut left open. Every figure is provisional, and the method text says how
 * each choice is counted. The assumptions the budget does not have are in src/lib/facts/model.ts.
 */
import { BUDGET, CARPORT_PV, EV_CHARGING, FREE_COOLING, MODULE_KWP, OUTAGE_DRILL, QUICK_ESTIMATE, SIM_SETTINGS, fmt, type Lang } from "@/lib/facts";
import { PITCH_DEG, floorArea } from "@/lib/house/plan";
import { hourOf, type EnergyInputs, type Weather } from "@/lib/sim/inputs";
import { outage, runYear, type HomeSpec, type Scenario, type YearResult } from "@/lib/sim/run";
import { BUDGET_SCENARIO, homesOf } from "@/lib/sim/scenario";
import type { Plot } from "@/lib/types";
import { MODEL_MODULES } from "./palette";
import { resolved, type PlotFacts } from "./state";
import type { EnergyEstimate, EnergyOptions, HouseConfig, T2 } from "./types";

/** The simulation's inputs, loaded once (the page's worker, the server or a test passes them in). */
export type SimInputs = { inputs: EnergyInputs; weather: Weather };

type Prices = NonNullable<EnergyOptions["prices"]>;

/** What the energy model reads from a configuration: plain numbers, derived from the choices and the plot. */
export type HouseModel = {
  /** Plot id, or null for the reference roof (due south, the model's pitch, a flat horizon). */
  plot: string | null;
  roof: { tilt: number; azimuth: number; horizon: number[] };
  modules: number;
  integrated: boolean;
  carportModules: number;
  roofKwp: number;
  carportKwp: number;
  batteryKwh: number;
  backup: "essential" | "whole";
  reserve: number;
  cooling: boolean;
  control: "smart" | "home" | "safety";
  /** Cars charged at home (one per charging point). */
  cars: number;
  stove: "none" | "chimney" | "stove";
  /** The lower floor: none on this plot, or how it is used. */
  lower: "none" | "finished" | "three-bedrooms" | "rental" | "shell";
  /** Heated floor area in the model, m2, and the area of the house as the model draws it on this plot. */
  heatedM2: number;
  plotM2: number;
  /** Room heat against the energy budget's house on this plot (1 = as the budget). */
  roomHeat: number;
};

const round2 = (v: number) => Math.round(v * 100) / 100;
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = <T extends string>(v: unknown, ok: readonly T[], d: T): T => (ok.includes(v as T) ? (v as T) : d);

/** The configuration as the energy model sees it. Choices the plot cannot take fall back to the standard. */
export function houseModel(cfg: HouseConfig, plot: Plot | null, facts: PlotFacts | null = null): HouseModel {
  const c = resolved(cfg, facts);
  const p = (option: string) => c[option]?.params ?? {};
  const area = floorArea(true);
  const hasLower = !!facts?.lowerFloor;
  const lower = hasLower ? str(p("underetasje").lower, ["finished", "three-bedrooms", "rental", "shell"] as const, "finished") : "none";
  const modules = num(p("solceller").modules, MODEL_MODULES);
  const carportModules = p("parkering").parking === "carport-pv" ? CARPORT_PV.rows * CARPORT_PV.per_row : 0;
  const spec = plot ? homesOf([plot])[0] : null;
  return {
    plot: plot?.id ?? cfg.plot ?? null,
    roof: spec ? { tilt: spec.tilt, azimuth: spec.azimuth, horizon: spec.horizon } : { tilt: PITCH_DEG, azimuth: 180, horizon: new Array<number>(360).fill(0) },
    modules,
    integrated: p("solceller").integrated === true,
    carportModules,
    roofKwp: round2(modules * MODULE_KWP),
    carportKwp: round2(carportModules * MODULE_KWP),
    batteryKwh: num(p("batteri").batteryKwh, BUDGET.battery.per_home_kwh),
    backup: str(p("strombrudd").backup, ["essential", "whole"] as const, "essential"),
    reserve: num(p("strombrudd").reserve, SIM_SETTINGS.reserve),
    cooling: p("kjoling").cooling === true,
    control: str(p("styring").control, ["smart", "home", "safety"] as const, "smart"),
    cars: Math.max(0, Math.round(num(p("lading").chargers, 1))),
    stove: str(p("ildsted").stove, ["none", "chimney", "stove"] as const, "none"),
    lower,
    heatedM2: lower === "none" || lower === "shell" ? area.main : area.total,
    plotM2: hasLower ? area.total : area.main,
    // the budget's 15 000 kWh is the house as the model draws it on the plot; with the lower floor left
    // unfinished, only the main floor is heated and the room heat follows the area (hot water does not)
    roomHeat: lower === "shell" ? area.main / area.total : 1,
  };
}

/** kWh a year of home charging for the cars in the model (kilometres a year times kWh per km). */
export function evKwhYear(cars: number) {
  return cars * EV_CHARGING.km_per_year * EV_CHARGING.kwh_per_km;
}

/** Days in a month of the typical year (a year without 29 February, like the weather year). */
const daysIn = (month: number) => new Date(Date.UTC(2025, month, 0)).getUTCDate();

/** Hours in the months a constant pump runs. */
function hoursIn(months: number[]) {
  return months.reduce((s, m) => s + daysIn(m) * 24, 0);
}

/** The house's year through the hourly simulation, on its own (no sharing, no shared plant, no wind). */
export function houseYear(m: HouseModel, prices: Prices, sim: SimInputs): YearResult {
  const home: HomeSpec = {
    id: m.plot ?? "reference",
    tilt: m.roof.tilt,
    azimuth: m.roof.azimuth,
    horizon: m.roof.horizon,
    opts: {
      // the energy budget's average household, not a random draw
      size: 1,
      insul: 1,
      shift: 0,
      roomHeat: m.roomHeat,
      planes: m.carportKwp > 0 ? [{ kwp: m.carportKwp, tilt: CARPORT_PV.tilt_deg, azimuth: m.roof.azimuth, horizon: m.roof.horizon }] : undefined,
      ev: m.cars > 0 ? { kwhYear: evKwhYear(m.cars), kw: m.cars * EV_CHARGING.charger_kw, from: EV_CHARGING.home_from, to: EV_CHARGING.home_to } : undefined,
      cooling: m.cooling ? { kw: FREE_COOLING.pump_w / 1000, months: FREE_COOLING.months } : undefined,
    },
  };
  const sc: Scenario = { ...BUDGET_SCENARIO, pvPerHomeKwp: m.roofKwp, officePvKwp: 0, parkKwp: 0, windKw: 0, batteryKwh: m.batteryKwh, reserve: m.reserve, sharing: false, prices };
  return runYear(sim.inputs, sim.weather, [home], sc, { elPerHome: BUDGET.el_per_home_kwh, heatPerHome: BUDGET.heat_per_home_kwh, officeKwh: 0, workshopKwh: 0 });
}

/**
 * How long the chosen circuits stay on in a winter power cut: the grid goes at the drill's hour on every day of the
 * drill's months; the median of the hours until the house goes dark, counted up to the drill's maximum.
 */
export function winterOutageHours(y: YearResult, year: number, essential: boolean): number {
  const out: number[] = [];
  for (const month of OUTAGE_DRILL.months) {
    for (let d = 1; d <= daysIn(month); d++) {
      const r = outage(y, hourOf(year, month, d, OUTAGE_DRILL.start_hour), OUTAGE_DRILL.max_hours, essential);
      out.push(r.firstDark < 0 ? OUTAGE_DRILL.max_hours : r.firstDark);
    }
  }
  out.sort((a, b) => a - b);
  const mid = out.length >> 1;
  return out.length % 2 ? out[mid] : (out[mid - 1] + out[mid]) / 2;
}

const pctOf = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** The hourly estimate for a house model. */
export function simulateHouse(m: HouseModel, prices: Prices, sim: SimInputs): EnergyEstimate {
  const y = houseYear(m, prices, sim);
  const T = y.totals;
  const pvKwh = T.pvRoofs;
  return {
    pvKwp: round2(m.roofKwp + m.carportKwp),
    pvKwh: Math.round(pvKwh),
    householdKwh: Math.round(T.homesEl),
    heatElKwh: Math.round(T.heatPumpEl),
    evKwh: Math.round(T.ev),
    useKwh: Math.round(T.demand),
    selfUsePct: pctOf(pvKwh - T.exp, pvKwh),
    selfSufficiencyPct: pctOf(T.demand - T.imp, T.demand),
    importKwh: Math.round(T.imp),
    exportKwh: Math.round(T.exp),
    costNok: Math.round(T.cost),
    referenceCostNok: Math.round(T.refCost),
    outageHours: Math.round(winterOutageHours(y, sim.inputs.year, m.backup === "essential")),
    provisional: true,
    method: method(m, prices, true),
  };
}

/** The quick overslag from the energy budget's own figures, before the hourly model has run. */
export function quickEstimate(m: HouseModel, prices: Prices): EnergyEstimate {
  const pvKwp = m.roofKwp + m.carportKwp;
  // the budget's own yield per kWp and system efficiency
  const pvKwh = pvKwp * BUDGET.pv.yield_kwh_per_kwp * (BUDGET.pv.system_eff_pct / 100);
  const heat = BUDGET.heat_per_home_kwh * (SIM_SETTINGS.dhw_share + (1 - SIM_SETTINGS.dhw_share) * m.roomHeat);
  const heatElKwh = heat / BUDGET.bedrock.scop + (m.cooling ? (FREE_COOLING.pump_w / 1000) * hoursIn(FREE_COOLING.months) : 0);
  const householdKwh = BUDGET.el_per_home_kwh;
  const evKwh = evKwhYear(m.cars);
  const useKwh = householdKwh + heatElKwh + evKwh;
  // a rough share used at home, larger with a larger battery; the hourly model replaces it within a moment
  const selfUse = Math.min(QUICK_ESTIMATE.self_use_max, QUICK_ESTIMATE.self_use_base + QUICK_ESTIMATE.self_use_per_battery_kwh * m.batteryKwh);
  const used = Math.min(pvKwh * selfUse, useKwh);
  return {
    pvKwp: round2(pvKwp),
    pvKwh: Math.round(pvKwh),
    householdKwh: Math.round(householdKwh),
    heatElKwh: Math.round(heatElKwh),
    evKwh: Math.round(evKwh),
    useKwh: Math.round(useKwh),
    selfUsePct: pctOf(used, pvKwh),
    selfSufficiencyPct: pctOf(used, useKwh),
    importKwh: Math.round(useKwh - used),
    exportKwh: Math.round(pvKwh - used),
    costNok: null,
    referenceCostNok: null,
    outageHours: null,
    provisional: true,
    method: method(m, prices, false),
  };
}

/**
 * The estimate for a configured house on its plot. Pass the loaded simulation inputs as `sim` for the hourly
 * model; without them the answer is the quick overslag (costs and the power cut left open).
 */
export function estimateEnergy(cfg: HouseConfig, plot: Plot | null, facts: PlotFacts | null = null, opts: EnergyOptions = {}, sim?: SimInputs): EnergyEstimate {
  const m = houseModel(cfg, plot, facts);
  const prices: Prices = opts.prices === "spot2025" ? "spot2025" : "budget";
  return sim ? simulateHouse(m, prices, sim) : quickEstimate(m, prices);
}

// ------------------------------------------------------------------ the method text

const t2 = (no: string, en: string): T2 => ({ no, en });
const f = (n: number, lang: Lang, digits?: number) => fmt(n, lang, digits);
const pct = (share: number, lang: Lang) => `${f(Math.round(share * 100), lang)} %`;
const clock = (h: number) => String(h).padStart(2, "0");
const MONTH: Record<Lang, string[]> = {
  no: ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
function months(list: number[], lang: Lang) {
  const names = list.map((m) => MONTH[lang][m - 1]);
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} ${lang === "no" ? "og" : "and"} ${names[names.length - 1]}` : names[0] ?? "";
}

/** How the figures are worked out, for the "slik er det regnet" fold: only what applies to this house. */
function method(m: HouseModel, prices: Prices, hourly: boolean): T2 {
  const parts: T2[] = [];
  const both = (fn: (l: Lang) => string): T2 => ({ no: fn("no"), en: fn("en") });
  const plotNo = m.plot ? String(Number(m.plot.replace("plot-", ""))) : null;

  parts.push(hourly
    ? (plotNo
      ? t2(`Foreløpig modellberegning, time for time gjennom et typisk værår på Knotten (PVGIS), for huset alene på tomt ${plotNo}.`, `Provisional model estimate, hour by hour through a typical weather year at Knotten (PVGIS), for the house on its own on plot ${plotNo}.`)
      : t2("Foreløpig modellberegning, time for time gjennom et typisk værår på Knotten (PVGIS). Ingen tomt er valgt ennå, så taket er regnet rett mot sør med flat horisont.", "Provisional model estimate, hour by hour through a typical weather year at Knotten (PVGIS). No plot is chosen yet, so the roof faces due south with a flat horizon."))
    : both((l) => l === "no"
      ? `Foreløpig overslag fra energiregnskapets egne tall (solcellene med regnskapets ${f(BUDGET.pv.yield_kwh_per_kwp, l)} kWh per kWp og ${f(BUDGET.pv.system_eff_pct, l)} % systemvirkningsgrad). Strømregningen og strømbruddet regnes bare i modellberegningen time for time.`
      : `Provisional quick estimate from the energy budget's own figures (the panels at the budget's ${f(BUDGET.pv.yield_kwh_per_kwp, l)} kWh per kWp and ${f(BUDGET.pv.system_eff_pct, l)} % system efficiency). The bill and the power cut are only worked out in the hourly model.`));

  parts.push(both((l) => {
    const no = l === "no";
    const roof = no
      ? `Solceller: ${m.modules} moduler à ${f(MODULE_KWP, l, 2)} kWp på taket mot utsikten, ${f(m.roofKwp, l, 2)} kWp med ${f(Math.round(m.roof.tilt * 10) / 10, l, 1)} graders helning${m.plot ? ", tomtens retning og den målte horisonten" : ""}.`
      : `Solar: ${m.modules} modules of ${f(MODULE_KWP, l, 2)} kWp on the roof facing the view, ${f(m.roofKwp, l, 2)} kWp at ${f(Math.round(m.roof.tilt * 10) / 10, l, 1)} degrees${m.plot ? ", the plot's direction and its measured horizon" : ""}.`;
    const integrated = m.integrated ? (no ? " Et integrert solcelletak er regnet med de samme modulene." : " An integrated solar roof is counted with the same modules.") : "";
    const carport = m.carportKwp > 0
      ? no
        ? ` Carporten: ${m.carportModules} moduler, ${f(m.carportKwp, l, 2)} kWp, en modellantakelse: ${CARPORT_PV.rows} rader à ${CARPORT_PV.per_row} på et tak på om lag ${CARPORT_PV.roof_w_m} x ${CARPORT_PV.roof_l_m} m, ${CARPORT_PV.tilt_deg} graders helning og samme retning som huset. Husets skygge på carporten er ikke regnet med.`
        : ` The carport: ${m.carportModules} modules, ${f(m.carportKwp, l, 2)} kWp, a model assumption: ${CARPORT_PV.rows} rows of ${CARPORT_PV.per_row} on a roof of about ${CARPORT_PV.roof_w_m} x ${CARPORT_PV.roof_l_m} m, pitched ${CARPORT_PV.tilt_deg} degrees and facing the same way as the house. The house's own shade on the carport is not counted.`
      : "";
    return roof + integrated + carport;
  }));

  parts.push(both((l) => {
    const no = l === "no";
    const base = no
      ? `Forbruk som i energiregnskapet: ${f(BUDGET.el_per_home_kwh, l)} kWh husholdningsstrøm og ${f(BUDGET.heat_per_home_kwh, l)} kWh varme i året (${pct(1 - SIM_SETTINGS.dhw_share, l)} rom, ${pct(SIM_SETTINGS.dhw_share, l)} varmtvann), med varmepumpe på årsvarmefaktor ${f(BUDGET.bedrock.scop, l)}. Energiregnskapet har ett varmetall per bolig, uten husstørrelse; modellen bruker det for huset slik det står på tomten, om lag ${f(Math.round(m.plotM2), l)} m².`
      : `Use as in the energy budget: ${f(BUDGET.el_per_home_kwh, l)} kWh of household electricity and ${f(BUDGET.heat_per_home_kwh, l)} kWh of heat a year (${pct(1 - SIM_SETTINGS.dhw_share, l)} rooms, ${pct(SIM_SETTINGS.dhw_share, l)} hot water), with a heat pump at a seasonal factor of ${f(BUDGET.bedrock.scop, l)}. The budget has one heat figure per home, with no house size; the model uses it for the house as it stands on the plot, about ${f(Math.round(m.plotM2), l)} m².`;
    const lower = m.lower === "shell"
      ? no
        ? ` Uinnredet underetasje: bare hovedplanet varmes, om lag ${f(Math.round(m.heatedM2), l)} av ${f(Math.round(m.plotM2), l)} m², så romvarmen er skalert ned med arealet. Varmtvannet er det samme.`
        : ` Unfinished lower floor: only the main floor is heated, about ${f(Math.round(m.heatedM2), l)} of ${f(Math.round(m.plotM2), l)} m², so the room heat is scaled down with the area. Hot water is the same.`
      : m.lower === "rental"
        ? no ? " Utleiedelen: leietakerens egen strøm og varmtvann er ikke regnet med." : " The rental unit: the tenant's own electricity and hot water are not counted."
        : "";
    return base + lower;
  }));

  parts.push(both((l) => l === "no"
    ? `Batteri ${f(m.batteryKwh, l)} kWh som lader og leverer inntil ${f(SIM_SETTINGS.battery_kw, l)} kW, ${f(BUDGET.battery.round_trip_pct, l)} % virkningsgrad tur-retur; ${pct(m.reserve, l)} holdes av for strømbrudd og fylles fra nettet om det trengs.`
    : `A ${f(m.batteryKwh, l)} kWh battery that charges and delivers up to ${f(SIM_SETTINGS.battery_kw, l)} kW, ${f(BUDGET.battery.round_trip_pct, l)} % round trip; ${pct(m.reserve, l)} is held back for a power cut and topped up from the grid when needed.`));

  parts.push(both((l) => {
    const no = l === "no";
    const ctl = no
      ? `Smart styring: batteriet lader av overskuddssol og dekker underskudd${m.cars ? ", og bilen lades i timene med sol til overs, ellers de billigste, mens den står hjemme" : ""}.`
      : `Smart control: the battery charges from spare solar power and covers shortfalls${m.cars ? ", and the car charges in hours with spare sun, otherwise the cheapest, while it is at home" : ""}.`;
    const extra = m.control !== "smart" ? (no ? " Smarthus Pluss og trygghetspakken gir ingen ekstra energieffekt i modellen." : " Smart home plus and the safety package have no extra energy effect in the model.") : "";
    return ctl + extra;
  }));

  parts.push(both((l) => {
    const no = l === "no";
    if (!m.cars) return no ? "Bare klargjort for lader: ingen bil lades hjemme i modellen." : "Prepared for a charger only: no car is charged at home in the model.";
    const kwh = f(Math.round(evKwhYear(m.cars)), l);
    return no
      ? `Elbil: ${m.cars === 1 ? "én bil" : `${m.cars} biler`}, ${f(EV_CHARGING.km_per_year, l)} km i året hver (SSB: snittet for personbiler i ${EV_CHARGING.km_year}) og ${f(EV_CHARGING.kwh_per_km, l, 2)} kWh per km (Statens vegvesen, hjemmelading), til sammen ${kwh} kWh, ladet hjemme mellom kl. ${clock(EV_CHARGING.home_from)} og ${clock(EV_CHARGING.home_to)} med inntil ${f(EV_CHARGING.charger_kw, l)} kW per lader. Energiregnskapet har ikke med elbillading, så dette kommer i tillegg.`
      : `Electric car: ${m.cars === 1 ? "one car" : `${m.cars} cars`}, ${f(EV_CHARGING.km_per_year, l)} km a year each (Statistics Norway: the average for passenger cars in ${EV_CHARGING.km_year}) at ${f(EV_CHARGING.kwh_per_km, l, 2)} kWh per km (Norwegian Public Roads Administration, home charging), ${kwh} kWh in all, charged at home between ${clock(EV_CHARGING.home_from)}:00 and ${clock(EV_CHARGING.home_to)}:00 at up to ${f(EV_CHARGING.charger_kw, l)} kW per charger. The energy budget has no car charging, so this comes on top.`;
  }));

  if (m.cooling) {
    const kwh = Math.round((FREE_COOLING.pump_w / 1000) * hoursIn(FREE_COOLING.months));
    parts.push(both((l) => l === "no"
      ? `Frikjøling: simuleringen har ingen kjølelast, så bare sirkulasjonspumpen er regnet med, ${f(FREE_COOLING.pump_w, l)} W hele døgnet i ${months(FREE_COOLING.months, l)}, om lag ${f(kwh, l)} kWh, lagt til strømmen for varmeanlegget.`
      : `Free cooling: the simulation has no cooling load, so only the circulation pump is counted, ${f(FREE_COOLING.pump_w, l)} W round the clock in ${months(FREE_COOLING.months, l)}, about ${f(kwh, l)} kWh, added to the heating plant's electricity.`));
  }

  if (m.stove !== "none") {
    parts.push(m.stove === "stove"
      ? t2("Vedovnen endrer ikke strømtallene. Ved strømbrudd gir den varme uten strøm, også når batteriet er tomt.", "The wood stove does not change the electricity figures. In a power cut it gives heat without power, also when the battery is empty.")
      : t2("Pipa endrer ikke strømtallene.", "The chimney does not change the electricity figures."));
  }

  if (hourly) {
    parts.push(both((l) => {
      const no = l === "no";
      const what = m.backup === "essential"
        ? no ? `viktige kurser (varmepumpen på ${pct(SIM_SETTINGS.essential.heat_pump, l)}, resten på en tredel)` : `the essential circuits (the heat pump at ${pct(SIM_SETTINGS.essential.heat_pump, l)}, the rest at a third)`
        : no ? "hele huset" : "the whole house";
      return no
        ? `Strømbrudd: nettet faller ut kl. ${clock(OUTAGE_DRILL.start_hour)} en vinterkveld. Tallet er medianen for alle dager i ${months(OUTAGE_DRILL.months, l)}: hvor mange timer batteriet og solcellene holder ${what} i gang, inntil ${f(OUTAGE_DRILL.max_hours, l)} timer. Bilen lades ikke mens strømmen er borte.`
        : `Power cut: the grid goes at ${clock(OUTAGE_DRILL.start_hour)}:00 on a winter evening. The figure is the median over every day in ${months(OUTAGE_DRILL.months, l)}: how many hours the battery and the panels keep ${what} running, up to ${f(OUTAGE_DRILL.max_hours, l)} hours. The car is not charged while the grid is down.`;
    }));
    parts.push(both((l) => {
      const no = l === "no";
      const price = prices === "budget"
        ? no ? `Pris: energiregnskapets ${f(BUDGET.prices.buy_nok, l, 2)} kr/kWh for kjøp og ${f(BUDGET.prices.sell_nok, l, 2)} kr/kWh for salg.` : `Prices: the energy budget's ${f(BUDGET.prices.buy_nok, l, 2)} kr/kWh to buy and ${f(BUDGET.prices.sell_nok, l, 2)} kr/kWh to sell.`
        : no ? `Pris: spotprisen i NO2 time for time i 2025, pluss ${f(BUDGET.prices.grid_nok, l, 2)} kr/kWh i nettleie ved kjøp, spotpris ved salg, uten mva og avgifter.` : `Prices: the NO2 spot price hour by hour in 2025, plus ${f(BUDGET.prices.grid_nok, l, 2)} kr/kWh grid fee to buy, the spot price to sell, without VAT and taxes.`;
      const ref = no
        ? " Sammenligningen er det samme huset med direkte elektrisk oppvarming og uten solceller og batteri."
        : " The comparison is the same house with direct electric heating and no panels or battery.";
      return price + ref;
    }));
  }

  parts.push(t2("Huset regnes for seg selv: deling med naboene, fellesanlegget for sol og vind er ikke med.", "The house is counted on its own: sharing with the neighbours, the shared solar plant and wind are not included."));
  return { no: parts.map((p) => p.no).join(" "), en: parts.map((p) => p.en).join(" ") };
}
