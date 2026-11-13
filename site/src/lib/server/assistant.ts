import { loadCommercial, loadNews, loadPlots, loadSettings } from "@/lib/data";
import { BUDGET, CONTACT, EED, FACT, PV_KWP_PER_HOME, dateLong } from "@/lib/facts";
import { faq, type FaqItem } from "@/lib/content/faq";
import type { Design } from "@/lib/design";
import { kHref } from "@/lib/klassisk/locale";
import { current, hourly, osloDate, osloHourNow, spotPrices, symbolText, weather } from "./live";

/**
 * Knotten AI: answers visitors' questions from the project's own data, never from guesses. The
 * common questions (plots, sun, view, release, energy, the price and the weather right now,
 * location, road, trees, documents, contact) are answered directly from the data the site is
 * built on, with links to where it is shown, in the design and the language the question came from
 * (Klassisk's own pages, under /english in English; Moderne's under /no and /en). The questions the
 * status pages answer (lib/content/faq.ts) get the very same answers. When a language model is
 * configured (ANTHROPIC_API_KEY and KNOTTEN_AI_MODEL), other questions go to it with the same facts and
 * the instruction to say so when the answer is not in them. Without both, Knotten AI answers from the data only.
 */
export type Link = { href: string; label: string };
export type Answer = { text: string; links: Link[]; source: "data" | "ai" | "none"; intent: string };

type L = "no" | "en";
const T = (lang: L, no: string, en: string) => (lang === "no" ? no : en);
const nf = (v: number, lang: L, d = 0) => v.toLocaleString(lang === "no" ? "nb-NO" : "en-GB", { maximumFractionDigits: d, minimumFractionDigits: 0 });
const plotNo = (id: string) => Number(id.slice(5));

const has = (q: string, re: RegExp) => re.test(q);

// ------------------------------------------------------------------ where the answers link to
type PageKey = "plots" | "energy" | "area" | "view" | "project" | "investor" | "documents" | "contact" | "interest" | "news" | "status" | "privacy";

/** Each page's address in each design (Klassisk's path before the language, Moderne's after it). */
const PAGES: Record<PageKey, { klassisk: string; moderne: string }> = {
  plots: { klassisk: "/tomtene", moderne: "/tomter" },
  energy: { klassisk: "/energi", moderne: "/energi" },
  area: { klassisk: "/kart", moderne: "/omradet" },
  view: { klassisk: "/galleri", moderne: "/utsikt" },
  project: { klassisk: "/prosjektet", moderne: "/prosjektet" },
  investor: { klassisk: "/investorer", moderne: "/investor" },
  documents: { klassisk: "/dokumentbank", moderne: "/dokumenter" },
  contact: { klassisk: "/kontakt", moderne: "/kontakt" },
  // Klassisk's contact page holds the interest form as well
  interest: { klassisk: "/kontakt", moderne: "/interesse" },
  news: { klassisk: "/nyheter", moderne: "/nyheter" },
  status: { klassisk: "/status", moderne: "/status" },
  privacy: { klassisk: "/personvern", moderne: "/personvern" },
};

/** The names the site gives these pages, the same in both designs (Klassisk shows its maps and photos on pages of their own). */
const NAMES: Record<PageKey, { no: string; en: string; klassisk?: { no: string; en: string } }> = {
  plots: { no: "Tomtene", en: "Plots" },
  energy: { no: "Energi og teknologi", en: "Energy and technology" },
  area: { no: "Området", en: "The area", klassisk: { no: "Kart og terreng", en: "Maps and terrain" } },
  view: { no: "Utsikten", en: "The view", klassisk: { no: "Bilder", en: "Photos" } },
  project: { no: "Om prosjektet", en: "About the project" },
  investor: { no: "Investorer og samarbeid", en: "Investors and partners" },
  documents: { no: "Dokumentbank", en: "Document bank" },
  contact: { no: "Kontakt", en: "Contact" },
  interest: { no: "Meld interesse", en: "Register interest" },
  news: { no: "Nyheter", en: "News" },
  status: { no: "Status og spørsmål", en: "Status and questions" },
  privacy: { no: "Personvern", en: "Privacy" },
};

/** Builds the links of one answer for the design and the language it is asked from. */
function linker(design: Design, lang: L) {
  const at = (path: string) => (design === "klassisk" ? kHref(path, lang) : `/${lang}${path}`);
  const page = (key: PageKey, query = ""): Link => {
    const n = (design === "klassisk" && NAMES[key].klassisk) || NAMES[key];
    return { href: at(PAGES[key][design] + query), label: n[lang] };
  };
  // one plot: Klassisk /tomtene/07, Moderne /no/tomter/plot-07
  const plot = (id: string): Link => ({ href: at(design === "klassisk" ? `/tomtene/${id.slice(5)}` : `/tomter/${id}`), label: T(lang, `Tomt ${plotNo(id)}`, `Plot ${plotNo(id)}`) });
  const interestFor = (id: string): Link => page("interest", design === "klassisk" ? `?tomt=${id.slice(5)}` : `?plot=${id}`);
  return { at, page, plot, interestFor };
}

// ------------------------------------------------------------------ the questions the status pages answer
type FaqId = FaqItem["id"];
/** What each question sounds like, in both languages. Checked in this order. */
const FAQ_PATTERNS: [FaqId, RegExp][] = [
  ["plot-or-house", /tomt eller (et |ei )?hus|hus eller (en |ei )?tomt|kjøper (jeg|man|vi) (en |ei )?(tomt|hus|bolig)|tomt(a|en)? med hus|ferdighus|nøkkelferdig|plot or (a )?house|house or (a )?plot|plot with a house|turnkey|do i buy (a )?(plot|house|home)/],
  ["when", /når kan (jeg|man|vi) (kjøpe|flytte|bygge)|salgsstart|byggestart|innflytting|flytte inn|når (starter|begynner) (salget|byggingen)|when can (i|we|you|one) (buy|move|build)|start of (the )?(sales?|building|construction)|move in|construction start|when (does|will) (the )?(sale|building|construction) start/],
  ["price", /(hva|hvor mye) koster (en |ei |et )?(tomt|tomta|tomten|tomtene|tomter|bolig|boligen|boligene|hus|huset|husene)|tomtepris|boligpris|pris(en|ene)? på (en |ei |et )?(tomt|tomta|tomten|tomtene|tomter|bolig|boligene|hus|husene)|what (does|do|will) (a |the )?(plots?|houses?|homes?) cost|how much (is|are|does|do|will) (a |the )?(plots?|houses?|homes?)|price of (a |the )?(plots?|houses?|homes?)|(plot|house|home) prices?/],
  ["for-sale", /til salgs|lagt ut for salg|slippes|sluppet|når slipp|for sale|on sale|\breleased?\b|release date/],
  ["zoning-plan", /reguleringsplan|regulering|zoning|planning permission/],
  ["interest", /meld(e|er|t)? interesse|interessemelding|register(ing)? (my |your |an |)interest|registration of interest/],
  ["who", /hvem står bak|hvem (er|eier) (utbygger|prosjekteier|prosjektet)|utbygger|hvem bygger|who is behind|who('s| is) the developer|\bdeveloper\b|who owns|who (builds|is building)/],
];
const ALL_SEA_VIEW = (q: string) => has(q, /\b(alle|hver|samtlige|every|all|each)\b/) && has(q, /sjøutsikt|havutsikt|utsikt|sea view|view of the sea|\bviews?\b/);

/**
 * The topic each answer is counted under in the owner's statistics (portal/admin/statistikk names these): the status
 * page's questions are counted with the subject they belong to.
 */
const FAQ_INTENT: Record<FaqId, string> = { "for-sale": "release", when: "release", "plot-or-house": "release", price: "release", "sea-view": "view", "zoning-plan": "news", interest: "contact", who: "contact" };

/**
 * `allowModel` is asked right before a question would go to the language model (the daily budget in /api/ask);
 * when it says no, the answer comes from the data only. `design` decides where the links go (default Moderne).
 */
export async function answer(question: string, lang: L, { allowModel, design = "moderne" }: { allowModel?: () => Promise<boolean>; design?: Design } = {}): Promise<Answer> {
  const q = question.toLowerCase().normalize("NFC").replace(/\s+/g, " ").trim();
  const go = linker(design, lang);
  const { plots } = await loadPlots();

  // one plot by number: "tomt 7", "plot 12"
  const m = q.match(/\b(?:tomt(?:en|a)?|plot)\s*(?:nr\.?\s*|nummer\s*|number\s*)?(\d{1,2})\b/);
  if (m) {
    const id = `plot-${m[1].padStart(2, "0")}`;
    const p = plots.find((x) => x.id === id);
    if (!p) return { text: T(lang, `Modellen har ${FACT.plots} tomter, nummerert 1 til ${FACT.plots}.`, `The model has ${FACT.plots} plots, numbered 1 to ${FACT.plots}.`), links: [go.page("plots")], source: "data", intent: "plot" };
    const c = (await loadCommercial())[id];
    const status = { unreleased: T(lang, "ikke sluppet for salg ennå", "not released for sale yet"), available: T(lang, "ledig", "available"), reserved: T(lang, "reservert", "reserved"), sold: T(lang, "solgt", "sold") }[c.status];
    return {
      text: T(lang,
        `Tomt ${plotNo(id)} ligger i rekke ${p.row_label ?? p.row}, om lag ${nf(p.local.z_ground, lang)} moh. Den får ${nf(p.sun.dec21.hours, lang, 1)} timer direkte sol på taket 21. desember og ${nf(p.sun.jun21.hours, lang, 1)} timer 21. juni. Vannet er i sikt over ${p.view.water_visible_deg} grader av horisonten${p.view.open_sea_visible ? ", med åpent hav" : ""}. Tomten er ${status}${c.price_nok ? `, pris ${nf(c.price_nok, lang)} kr` : ""}. Utlegget er modellens forslag, ikke en vedtatt plan.`,
        `Plot ${plotNo(id)} is in row ${p.row_label ?? p.row}, about ${nf(p.local.z_ground, lang)} m above sea level. It gets ${nf(p.sun.dec21.hours, lang, 1)} hours of direct sun on the roof on 21 December and ${nf(p.sun.jun21.hours, lang, 1)} hours on 21 June. Water is in view over ${p.view.water_visible_deg} degrees of the horizon${p.view.open_sea_visible ? ", with open sea" : ""}. The plot is ${status}${c.price_nok ? `, price ${nf(c.price_nok, lang)} kr` : ""}. The layout is the model's proposal, not an adopted plan.`),
      links: [go.plot(id), go.interestFor(id)],
      source: "data", intent: "plot",
    };
  }

  // the power price right now
  if (has(q, /strømpris|spotpris|koster strømmen|strømmen koster|pris på strøm|prisen på strøm|power price|electricity price|price of (power|electricity)|spot price|(power|electricity) costs?|cost of (power|electricity)/)) {
    const today = await spotPrices(osloDate());
    if (!today) return { text: T(lang, "Strømprisene svarer ikke akkurat nå. Prøv igjen om litt.", "The power prices are not answering right now. Try again shortly."), links: [], source: "data", intent: "price_now" };
    const h = hourly(today);
    const now = h.find((x) => x.hour === Math.floor(osloHourNow()));
    const lo = h.reduce((a, b) => (b.nok < a.nok ? b : a)), hi = h.reduce((a, b) => (b.nok > a.nok ? b : a));
    const kr = (v: number) => v.toFixed(2).replace(".", lang === "no" ? "," : ".");
    return {
      text: T(lang,
        `Strømprisen i NO2, som Lindesnes ligger i, er ${now ? `${kr(now.nok)} kr per kWh nå` : "ikke tilgjengelig for denne timen"}, uten mva og nettleie. I dag går den fra ${kr(lo.nok)} kr klokka ${String(lo.hour).padStart(2, "0")} til ${kr(hi.nok)} kr klokka ${String(hi.hour).padStart(2, "0")}. Boligene på Knotten er tenkt med batteri og smart styring som flytter forbruket til de billige timene.`,
        `The power price in NO2, where Lindesnes is, is ${now ? `${kr(now.nok)} kr per kWh now` : "not available for this hour"}, without VAT and grid tariff. Today it runs from ${kr(lo.nok)} kr at ${String(lo.hour).padStart(2, "0")}:00 to ${kr(hi.nok)} kr at ${String(hi.hour).padStart(2, "0")}:00. The homes at Knotten are planned with a battery and smart control that moves use to the cheap hours.`),
      links: [go.page("energy")],
      source: "data", intent: "price_now",
    };
  }

  // the weather at Knotten right now (wind power is an energy question, not a weather one)
  if (has(q, /\b(vær|været|temperatur|grader ute|regner|regn|snør|blåser|blåsete|weather|temperature|raining|rain|snowing|windy)\b/) || (has(q, /\bvind\b|\bwind\b/) && !has(q, /vindkraft|vindturbin|vindmølle|wind power|wind turbine|turbin/))) {
    const w = current(await weather());
    if (!w) return { text: T(lang, "Værvarselet svarer ikke akkurat nå. Prøv igjen om litt.", "The forecast is not answering right now. Try again shortly."), links: [], source: "data", intent: "weather" };
    return {
      text: T(lang,
        `Nå på Knotten: ${nf(w.temp, lang, 1)} °C, ${symbolText(w.symbol, true)}, ${Math.round(w.cloud)} % skydekke og ${nf(w.wind, lang, 1)} m/s vind. Kilde: Meteorologisk institutt.`,
        `Now at Knotten: ${nf(w.temp, lang, 1)} °C, ${symbolText(w.symbol, false)}, ${Math.round(w.cloud)} % cloud and ${nf(w.wind, lang, 1)} m/s wind. Source: Norwegian Meteorological Institute.`),
      links: [go.page("area")],
      source: "data", intent: "weather",
    };
  }

  // sun: the most winter sun, or summer
  if (has(q, /vintersol|mest sol|minst sol|soltimer|solrik|sol i desember|sol om vinteren|sommersol|sol om sommeren|winter sun|most sun|least sun|sun hours|sunniest|sun in winter|summer sun/)) {
    const summer = has(q, /sommer|juni|summer|june/);
    const key = summer ? "jun21" : "dec21";
    const sorted = [...plots].sort((a, b) => b.sun[key].hours - a.sun[key].hours);
    const [a, b, c] = sorted;
    const last = sorted[sorted.length - 1];
    const day = summer ? T(lang, "21. juni", "21 June") : T(lang, "21. desember", "21 December");
    return {
      text: T(lang,
        `${day} får tomt ${plotNo(a.id)} i rekke ${a.row_label} mest sol: ${nf(a.sun[key].hours, lang, 1)} timer direkte sol på taket. Deretter kommer tomt ${plotNo(b.id)} (${nf(b.sun[key].hours, lang, 1)} t) og tomt ${plotNo(c.id)} (${nf(c.sun[key].hours, lang, 1)} t). Minst får tomt ${plotNo(last.id)} med ${nf(last.sun[key].hours, lang, 1)} timer. Tallene er regnet fra terrenget og horisonten for hver tomt.`,
        `On ${day} plot ${plotNo(a.id)} in row ${a.row_label} gets the most sun: ${nf(a.sun[key].hours, lang, 1)} hours of direct sun on the roof. Next come plot ${plotNo(b.id)} (${nf(b.sun[key].hours, lang, 1)} h) and plot ${plotNo(c.id)} (${nf(c.sun[key].hours, lang, 1)} h). Plot ${plotNo(last.id)} gets the least, ${nf(last.sun[key].hours, lang, 1)} hours. The figures are computed from the terrain and the horizon of each plot.`),
      links: [go.plot(a.id), go.page("plots")],
      source: "data", intent: "sun",
    };
  }

  // the questions the status pages answer, with the very same answers (and their links, in this design)
  const faqId = ALL_SEA_VIEW(q) ? "sea-view" : FAQ_PATTERNS.find(([, re]) => has(q, re))?.[0];
  if (faqId) {
    const settings = await loadSettings();
    const items = faq(lang, { status: settings.release_note[lang], aboutHref: go.page("status").href + "#om-utbygger", interestHref: go.page("interest").href, privacyHref: go.page("privacy").href });
    const item = items.find((i) => i.id === faqId);
    if (item) {
      let text = item.a;
      // where plots are on sale with a price, the owner's own figures say more than the general answer
      if (faqId === "for-sale" || faqId === "price") {
        const free = Object.values(await loadCommercial()).filter((c) => c.status === "available");
        const prices = free.map((c) => c.price_nok).filter((v): v is number => !!v);
        if (free.length) {
          text = `${faqId === "for-sale" ? `${text} ` : ""}${T(lang,
            `${free.length} ${free.length === 1 ? "tomt er" : "tomter er"} ledige nå${prices.length ? `, fra ${nf(Math.min(...prices), lang)} kr` : ""}.`,
            `${free.length} ${free.length === 1 ? "plot is" : "plots are"} available now${prices.length ? `, from ${nf(Math.min(...prices), lang)} kr` : ""}.`)}`;
        }
      }
      const links: Link[] = [];
      if (item.link) links.push(item.link);
      if (faqId === "price" || faqId === "when" || faqId === "plot-or-house") links.push(go.page("interest"));
      if (faqId === "sea-view") links.push(go.page("view"));
      if (faqId === "interest" && !links.some((l) => l.href === go.page("interest").href)) links.unshift(go.page("interest"));
      if (faqId !== "who" && faqId !== "interest") links.push(go.page("status"));
      return { text, links: dedupe(links), source: "data", intent: FAQ_INTENT[faqId] };
    }
  }

  // sea view
  if (has(q, /sjøutsikt|havutsikt|utsikt|se havet|se sjøen|åpent hav|sea view|ocean view|view of the sea|open sea|\bviews?\b/)) {
    const water = plots.filter((p) => p.view.water_visible_deg > 0).length;
    const sea = plots.filter((p) => p.view.open_sea_visible).length;
    const widest = [...plots].sort((a, b) => b.view.water_visible_deg - a.view.water_visible_deg)[0];
    return {
      text: T(lang,
        `I modellens forslag ser ${water} av ${plots.length} tomter vann, og ${sea} ser åpent hav, sjekket med nabohusene stående. Bredest utsikt har tomt ${plotNo(widest.id)}, med vann over ${widest.view.water_visible_deg} grader av horisonten. Utlegget er et beregnet forslag: ønsket er sjøutsikt fra alle tomtene, men det er ikke sikkert at det går fra alle i den endelige planen.`,
        `In the model's proposal ${water} of ${plots.length} plots see water, and ${sea} see open sea, checked with the neighbouring houses standing. Plot ${plotNo(widest.id)} has the widest view, with water over ${widest.view.water_visible_deg} degrees of the horizon. The layout is a computed proposal: the aim is a sea view from every plot, but it is not certain every plot gets one in the final plan.`),
      links: [go.page("view"), go.plot(widest.id)],
      source: "data", intent: "view",
    };
  }

  // release, prices, buying
  if (has(q, /slipp|salg|selges|selge|kjøpe|kjøp|pris|koster|ledig|reserv|når kan|release|for sale|buy|purchase|price|cost|available|when can/)) {
    const [settings, commercial] = await Promise.all([loadSettings(), loadCommercial()]);
    const all = Object.values(commercial);
    const free = all.filter((c) => c.status === "available");
    const prices = free.map((c) => c.price_nok).filter((v): v is number => !!v);
    // the status line may already invite people to register; then it is not said twice
    const inviteNo = /meld interesse/i.test(settings.release_note.no) ? "" : " Meld interesse, så får du beskjed når tomtene slippes.";
    const inviteEn = /register/i.test(settings.release_note.en) ? "" : " Register your interest and you will hear when the plots are released.";
    return {
      text: T(lang,
        `${settings.release_note.no} ${free.length ? `${free.length} ${free.length === 1 ? "tomt er" : "tomter er"} ledige nå${prices.length ? `, fra ${nf(Math.min(...prices), lang)} kr` : ""}.` : "Prisene er ikke satt ennå."}${inviteNo}`,
        `${settings.release_note.en} ${free.length ? `${free.length} ${free.length === 1 ? "plot is" : "plots are"} available now${prices.length ? `, from ${nf(Math.min(...prices), lang)} kr` : ""}.` : "Prices are not set yet."}${inviteEn}`),
      links: [go.page("interest"), go.page("plots")],
      source: "data", intent: "release",
    };
  }

  // the energy concept
  if (has(q, /energi|solcelle|solceller|solstrøm|batteri|bergvarme|varmepumpe|brønn|besparelse|spare|strømregning|selvforsyn|vindkraft|vindturbin|vindmølle|energy|solar|battery|heat pump|geothermal|borehole|saving|self.suffic|wind power|wind turbine/)) {
    return {
      text: T(lang,
        `Hver bolig er tenkt med om lag ${PV_KWP_PER_HOME} kWp solceller på taket og et batteri på ${BUDGET.battery.per_home_kwh} kWh, og feltet varmes med bergvarme fra ${EED.boreholes} energibrønner. Energiregnskapet anslår om lag ${nf(Math.round(BUDGET.results.saving_per_home_nok / 1000) * 1000, lang)} kr spart per bolig i året mot direkte elektrisk oppvarming, og ${nf(BUDGET.results.self_sufficiency_pct, lang, 1)} % selvforsyning med strøm. Vind vurderes som supplement, basert på lokale målinger. Tallene er foreløpige, fra energisporet.`,
        `Each home is planned with about ${PV_KWP_PER_HOME} kWp of solar on the roof and a ${BUDGET.battery.per_home_kwh} kWh battery, and the field is heated with bedrock heat from ${EED.boreholes} boreholes. The energy budget estimates about ${nf(Math.round(BUDGET.results.saving_per_home_nok / 1000) * 1000, lang)} kr saved per home a year against direct electric heating, and ${nf(BUDGET.results.self_sufficiency_pct, lang, 1)} % self-sufficiency in power. Wind is evaluated as a supplement, based on local measurements. The figures are provisional, from the energy track.`),
      links: [go.page("energy")],
      source: "data", intent: "energy",
    };
  }

  // how many plots, rows, area
  if (has(q, /hvor mange tomter|antall tomter|hvor mange boliger|hvor mange hus|rekker|størrelse|areal|hvor stor|how many plots|how many homes|how many houses|rows|how big|size|area of/)) {
    return {
      text: T(lang,
        `Modellen har ${FACT.plots} tomter i ${FACT.rows} rekker, A til D: A øverst under Løkkeheia og D på knausen Knotten. Eiendommene, gnr ${FACT.gnr} bnr ${FACT.bnr} og ${FACT.bnr_extra}, er til sammen ${nf(FACT.parcel_m2, lang)} m². Prosjekteier regner med rundt ${FACT.plots} boliger.`,
        `The model has ${FACT.plots} plots in ${FACT.rows} rows, A to D: A at the top below Løkkeheia and D on the Knotten knoll. The properties, cadastral ${FACT.gnr}/${FACT.bnr} and ${FACT.gnr}/${FACT.bnr_extra}, total ${nf(FACT.parcel_m2, lang)} m². The project owner counts on about ${FACT.plots} homes.`),
      links: [go.page("plots")],
      source: "data", intent: "size",
    };
  }

  // where it is
  if (has(q, /hvor ligger|beliggenhet|adresse|hvor er|ligger det|ligger feltet|avstand|vigeland|lindesnes|fjord|audna|rødberg|skole|barnehage|butikk|nærheten|nærmeste|where is|where's|location|address|distance|located|school|kindergarten|shop|nearby/)) {
    return {
      text: T(lang,
        `Knotten ligger på Rødberg i Lindesnes, ved ${FACT.property_address}: en skogkledd knaus nær Audna elvas utløp i Sniksfjorden. Vigeland, med skole, butikker og E39, ligger noen få kilometer nordøst.`,
        `Knotten is at Rødberg in Lindesnes, by ${FACT.property_address}: a wooded knoll near the mouth of the Audna in Sniksfjorden. Vigeland, with school, shops and the E39, is a few kilometres north-east.`),
      links: [go.page("area")],
      source: "data", intent: "location",
    };
  }

  // the road
  if (has(q, /\bvei\b|veien|adkomst|stigning|innkjøring|\broad\b|access road|gradient|driveway/)) {
    return {
      text: T(lang,
        `Veien går fra tunet ved Rødbergsveien og opp bak hver rekke, med hårnålssvinger som i prosjekteiers skisse, og en gangsti går ned gjennom rekkene. I modellen er veien tegnet på dagens terreng; reguleringsplanen må gi sløyfer og terrengarbeid som holder ${FACT.road_grade_pct} % stigning.`,
        `The road runs from the yard by Rødbergsveien up behind each row, with hairpin bends as in the project owner's sketch, and a footpath runs down through the rows. In the model the road is drawn on today's ground; the zoning plan must give loops and earthworks that keep to ${FACT.road_grade_pct} %.`),
      links: [go.page("project")],
      source: "data", intent: "road",
    };
  }

  // trees and nature
  if (has(q, /trær|treet|skog|natur|rydd|hogst|hogg|felle|trees|forest|nature|clearing|felling|cut down/)) {
    return {
      text: T(lang,
        `I laserdataene fra Kartverket er det funnet ${nf(FACT.trees_detected, lang)} trær på området rundt Knotten. Modellens forslag rydder ${nf(FACT.trees_cleared, lang)} av dem: rundt husene, langs vei og sti, og i siktlinjen fra hver stue mot sjøen.`,
        `In Kartverket's laser data ${nf(FACT.trees_detected, lang)} trees are found around Knotten. The model's proposal clears ${nf(FACT.trees_cleared, lang)} of them: around the houses, along road and path, and in the sight line from each living room to the sea.`),
      links: [go.page("project")],
      source: "data", intent: "trees",
    };
  }

  // investors
  if (has(q, /invest|datarom|data room|avkastning|return on/)) {
    return {
      text: T(lang,
        "Investorer finner nøkkeltallene, scenarioene og dokumentene i datarommet i prosjektportalen, med en direkte linje til prosjekteier. Tilgang gis av prosjekteier: be om investormateriale, så tar prosjekteier kontakt.",
        "Investors find the key figures, the scenarios and the documents in the data room of the project portal, with a direct line to the project owner. Access is given by the project owner: request investor material and the project owner will get in touch."),
      links: [go.page("investor"), go.page("interest", design === "klassisk" ? "?rolle=investor" : "?purpose=invest")],
      source: "data", intent: "investor",
    };
  }

  // documents
  if (has(q, /dokument|rapport|regneark|tegning|document|report|spreadsheet|drawing/)) {
    return {
      text: T(lang,
        "Dokumentbanken har kart, utsiktsbilder og tomtedata åpent for alle. Arbeidsdokumentene, som energiregnskapet og rapportene fra fagsporene, ligger i prosjektportalen for dem som har tilgang.",
        "The document bank has maps, view photos and plot data open to everyone. The working documents, such as the energy budget and the reports from the tracks, are in the project portal for those with access."),
      links: [go.page("documents")],
      source: "data", intent: "documents",
    };
  }

  // contact and visits
  if (has(q, /kontakt|ringe|telefon|e-post|epost|mail|befaring|visning|besøke|møte|snakke med|contact|phone|call|email|visit|viewing|meeting|talk to/)) {
    const company = (await loadSettings()).company;
    const email = company?.email || CONTACT.email;
    const phone = company?.phone || CONTACT.phone_intl;
    return {
      text: T(lang,
        `Du når prosjekteier ${CONTACT.name} på ${email}${phone ? ` eller ${phone}` : ""}. Vil du på befaring eller høre mer, kan du også melde interesse, så tar prosjekteier kontakt.`,
        `You reach the project owner ${CONTACT.name} at ${email}${phone ? ` or ${phone}` : ""}. If you would like a site visit or to hear more, you can also register interest and the project owner will get in touch.`),
      links: dedupe([go.page("contact"), go.page("interest")]),
      source: "data", intent: "contact",
    };
  }

  // news and status
  if (has(q, /nytt|nyheter|siste|status|hva skjer|news|latest|what's happening|what('s| is) new|anything new/)) {
    const news = (await loadNews()).slice(0, 2);
    return {
      text: news.length
        ? T(lang,
          `Det siste fra prosjektet: ${news.map((n) => `«${n.title.no}» (${dateLong(n.date, "no")})`).join(" og ")}. Utlegget i modellen er et forslag; reguleringsplanen sendes kommunen når den er klar.`,
          `The latest from the project: ${news.map((n) => `"${n.title.en}" (${dateLong(n.date, "en")})`).join(" and ")}. The layout in the model is a proposal; the zoning plan goes to the municipality when it is ready.`)
        : T(lang,
          "Utlegget i modellen er et forslag; reguleringsplanen sendes kommunen når den er klar. Hvor prosjektet står, og hva som ikke er bestemt ennå, står under Status og spørsmål.",
          "The layout in the model is a proposal; the zoning plan goes to the municipality when it is ready. Where the project stands, and what is not decided yet, is under Status and questions."),
      links: [go.page("news"), go.page("status")],
      source: "data", intent: "news",
    };
  }

  if (has(q, /^(hei|hallo|heisann|god dag|god morgen|god kveld|hi|hello|hey)\b/)) {
    return { text: T(lang, "Hei! Spør meg om tomtene, sol og utsikt, energien, strømprisen eller været nå, eller når tomtene slippes.", "Hi! Ask me about the plots, sun and view, the energy, the power price or the weather right now, or when the plots are released."), links: [], source: "data", intent: "greeting" };
  }
  if (has(q, /takk|tusen takk|thanks|thank you/)) {
    return { text: T(lang, "Bare hyggelig. Spør gjerne om mer.", "You are welcome. Feel free to ask more."), links: [], source: "data", intent: "thanks" };
  }

  // nothing in the data matches: the language model, if it is set up, with the same facts; otherwise say so
  const ai = MODEL_ON && (!allowModel || (await allowModel())) ? await askModel(question, lang, plots.length).catch(() => null) : null;
  if (ai) return { text: ai, links: [go.page("contact")], source: "ai", intent: "ai" };
  return {
    text: T(lang,
      "Det har jeg ikke noe sikkert svar på fra prosjektets data. Jeg kan svare om tomtene, sol og utsikt, energien, strømprisen og været nå, veien, området og når tomtene slippes. Andre spørsmål svarer prosjekteier gjerne på.",
      "I have no reliable answer to that from the project's data. I can answer about the plots, sun and view, the energy, the power price and the weather right now, the road, the area and when the plots are released. The project owner is happy to answer other questions."),
    links: [go.page("contact"), go.page("status")],
    source: "none", intent: "unknown",
  };
}

/** One link per address (Klassisk's contact page is also its interest form). */
function dedupe(links: Link[]) {
  const seen = new Set<string>();
  return links.filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true)));
}

/** The facts the language model may use, in a few lines. Nothing here that the website does not already show. */
async function factSheet(plotCount: number) {
  const settings = await loadSettings();
  return [
    `Knotten: rundt ${FACT.plots} energivennlige boliger på Rødberg i Lindesnes (${FACT.property_address}, ${FACT.postcode}), en skogkledd knaus over Audna nær Sniksfjorden. Vigeland ligger noen få km nordøst.`,
    `Modellen: ${plotCount} tomter i ${FACT.rows} rekker (A til D). Eiendommene er ${FACT.parcel_m2} m². Utlegget er et beregnet forslag, ikke en vedtatt plan.`,
    `Sikt: i modellen ser alle tomtene vann, ${FACT.open_sea_plots} ser åpent hav. Ønsket er sjøutsikt fra alle tomtene, men det er ikke sikkert det går fra alle.`,
    `Energi (foreløpig, energisporets energiregnskap): om lag ${PV_KWP_PER_HOME} kWp sol og ${BUDGET.battery.per_home_kwh} kWh batteri per bolig, bergvarme fra ${EED.boreholes} brønner, besparelse om lag ${BUDGET.results.saving_per_home_nok} kr per bolig i året mot direkte elektrisk oppvarming, ${BUDGET.results.self_sufficiency_pct} % selvforsyning med strøm. Sandbatteri er lagt bort; vind vurderes som supplement.`,
    `Salg: ${settings.release_note.no} Priser er ikke satt før tomtene slippes.`,
    `Kontakt: prosjekteier ${CONTACT.name}, ${CONTACT.email}. Interesse meldes på nettsiden.`,
  ].join("\n");
}

/** True when Knotten AI may hand questions the data does not cover to the language model. */
export const MODEL_ON = !!(process.env.ANTHROPIC_API_KEY && (process.env.KNOTTEN_AI_MODEL || process.env.ANTHROPIC_MODEL));

async function askModel(question: string, lang: L, plotCount: number): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  // the model is chosen in the hosting settings only, never in the code
  const model = process.env.KNOTTEN_AI_MODEL || process.env.ANTHROPIC_MODEL;
  if (!key || !model) return null;
  const facts = await factSheet(plotCount);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 350,
      system: `Du er Knotten AI på nettsiden til boligprosjektet Knotten. Svar kort, høyst fire setninger, på ${lang === "no" ? "norsk bokmål" : "English"}. Bruk bare FAKTA under. Står svaret ikke der, si at du ikke vet og at prosjekteier svarer gjerne. Gi aldri løfter om priser, datoer eller tillatelser som ikke står i FAKTA. Ikke bruk tankestreker.\n\nFAKTA:\n${facts}`,
      messages: [{ role: "user", content: question.slice(0, 500) }],
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = json.content?.filter((c) => c.type === "text").map((c) => c.text ?? "").join("").trim();
  // the site writes without dashes as punctuation
  const dash = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`, "g");
  return text ? text.replace(new RegExp(`\\s${dash.source}\\s`, "g"), ", ").replace(dash, " ") : null;
}

/** Remove what could identify the asker before a question is kept for the owner's overview. */
export function redact(q: string) {
  return q.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[e-post]").replace(/\+?\d[\d\s]{6,}\d/g, "[nummer]").slice(0, 200);
}
