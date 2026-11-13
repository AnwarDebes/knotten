import { DOCS, EED, FACT, dateShort, type Access, type Lang, type T } from "@/lib/facts";
import { kHref } from "@/lib/klassisk/locale";
import { portalDocPath } from "@/lib/docRegister";

/**
 * The document bank of both designs ("Dokumentbank" / "Document bank"): one register built on DOCS in the facts
 * (date, access, file) with each document's title, description, owner group and format in both languages. The
 * documents that need a login live in the project portal (lib/docRegister.ts files them there); the public bank
 * links to them by their key, and the portal's own area keeps the name "Dokumenter".
 */

const L = (no: string, en: string): T => ({ no, en });

export type DocGroup = "owner" | "energy" | "market" | "website";
type DocKey = keyof typeof DOCS;

export type DocEntry = {
  key: DocKey;
  group: DocGroup;
  title: T;
  what: T;
  format: T;
  /** A page of the website instead of a file: its Klassisk path, and its Moderne path after the locale. */
  page?: { klassisk: string; moderne: string };
};

export const DOC_GROUPS: { id: DocGroup; name: T }[] = [
  { id: "owner", name: L("Prosjekteier", "Project owner") },
  { id: "energy", name: L("Energisporet", "Energy track") },
  { id: "market", name: L("Markedssporet", "Market track") },
  { id: "website", name: L("Nettsiden", "The website") },
];

const same = (s: string): T => ({ no: s, en: s });

export const DOC_REGISTER: DocEntry[] = [
  // the project owner
  { key: "direction", group: "owner", format: same("PDF"), title: L("Foreløpig retning for energikonseptet", "Preliminary direction for the energy concept"), what: L("Svar på energisporets spørsmål: batteri, mikronett, sandbatteri, kontorbygget, sol og vind. Norsk og engelsk.", "Answers to the energy track's questions: battery, microgrid, sand battery, the office building, solar and wind. Norwegian and English.") },
  { key: "work", group: "owner", format: same("PDF"), title: L("Arbeidsopplegg for spor 1 og 2", "Work structure for tracks 1 and 2"), what: L("Roller, arbeidspakker, faser og sluttleveranser for energi, marked og nettside. Norsk og engelsk.", "Roles, work packages, phases and final deliverables for energy, market and website. Norwegian and English.") },
  { key: "feedback", group: "owner", format: same("PDF"), title: L("Tilbakemelding på leveranseplanen", "Feedback on the delivery plan"), what: L("Prosjekteiers vurdering av planen for den digitale plattformen, med seks punkter til neste revisjon. Norsk og engelsk.", "The project owner's assessment of the plan for the digital platform, with six points for the next revision. Norwegian and English.") },
  { key: "view_photos", group: "owner", format: same("PDF"), title: L("Utsikt fra Knotten byggefelt", "The view from the Knotten building field"), what: L("Fire bilder av utsikten mot fjorden og havet.", "Four photos of the view towards the fjord and the sea.") },
  { key: "maps", group: "owner", format: same("PNG"), page: { klassisk: "/kart", moderne: "/omradet#kart" }, title: L("Kart og terrengprofil", "Maps and terrain profile"), what: L("Eiendomskart, markert prosjektområde, siktlinje og terrengprofil fra Norgeskart, i full størrelse.", "The property map, the marked project area, the sight line and the terrain profile from Norgeskart, in full size.") },
  // the energy track
  { key: "status", group: "energy", format: same("PDF"), title: L("Statusoppsummering, elektro og teknikk", "Status summary, electrical and technical"), what: L("Metode, foreløpige tall og hva som mangler.", "Method, provisional figures and what is missing.") },
  { key: "budget", group: "energy", format: L("XLSX og PDF", "XLSX and PDF"), title: L("Energiregnskap, arbeidsversjon", "Energy budget, working version"), what: L("Månedlig energiregnskap for hele feltet: forutsetninger, produksjon, lagring og nøkkeltall for året, med usikkerheten per rad. Regneark og utskrift.", "A monthly energy budget for the whole field: assumptions, production, storage and the key figures of the year, with the uncertainty per row. Spreadsheet and print.") },
  { key: "measures", group: "energy", format: same("PDF"), title: L("Sammenligning av tiltak", "Comparison of measures"), what: L("Kostnad, robusthet, energi og anbefaling per tiltak.", "Cost, resilience, energy and a recommendation for each measure.") },
  { key: "eed", group: "energy", format: same("PNG"), title: L("Grunnvarmeanalyse i Earth Energy Designer", "Ground heat analysis in Earth Energy Designer"), what: L(`Grunnlast, brønnkonfigurasjon og væsketemperaturer over ${EED.years} år.`, `Base load, borehole configuration and fluid temperatures over ${EED.years} years.`) },
  // the market track
  { key: "market", group: "market", format: same("PDF"), title: L("Marked, merkevare og kommersialisering", "Market, brand and commercialisation"), what: L("Målgrupper, posisjonering, støtteordninger og plan.", "Target groups, positioning, support schemes and plan.") },
  // the website
  { key: "sources", group: "website", format: L("Nettside", "Web page"), page: { klassisk: "/kilder", moderne: "/kilder" }, title: L("Kilder og forutsetninger", "Sources and assumptions"), what: L("Én rad per tall på nettsiden: verdi, enhet, status, ansvarlig og kilde.", "One row for every number on the website: value, unit, status, owner and source.") },
  { key: "plots_data", group: "website", format: same("JSON"), title: L("Tomtedata, alle tomter", "Plot data, all plots"), what: L("Posisjon, terreng, sol, sikt og horisontprofil for hver tomt, beregnet av nettsidens modell for det foreløpige utlegget.", "Position, terrain, sun, view and horizon profile for every plot, computed by the website's model for the provisional layout.") },
  { key: "road_data", group: "website", format: same("JSON"), title: L("Veinett med stigning", "Road network with grades"), what: L(`Veiene i modellens forslag med stigning per del, sammenlignet med målet om høyst ${FACT.road_grade_pct} %. Svingene og adkomsten er en illustrasjon til reguleringsplanen er klar.`, `The roads in the model's proposal with the grade per segment, against the aim of at most ${FACT.road_grade_pct} %. The bends and the access are an illustration until the zoning plan is ready.`) },
  { key: "parcel_data", group: "website", format: same("JSON"), title: L("Eiendom fra Matrikkelen", "Parcel from the cadastre"), what: L(`Eiendomsgrensen for gnr ${FACT.gnr} bnr ${FACT.bnr} og ${FACT.bnr_extra} i lokale koordinater, fra Kartverkets data.`, `The parcel boundary for ${FACT.gnr}/${FACT.bnr} and ${FACT.gnr}/${FACT.bnr_extra} in local coordinates, from Kartverket's data.`) },
];

/** What a row needs, in the page's language and design. */
/** `icon`: the few letters on the file icon (Klassisk); `file`: the link is a file, not a page of the site. */
export type DocRow = { key: DocKey; title: string; what: string; format: string; icon: string; date: string; access: Access; accessLabel: string; href: string; login: boolean; file: boolean };

const ACCESS: Record<Access, T> = { public: L("Offentlig", "Public"), login: L("Innlogging", "Login") };

/**
 * Where a row leads. A document behind the login opens in the portal (the portal sends a visitor without a login to
 * its login page and back): Norwegian Klassisk through its own login page, the rest straight to the portal address.
 * A public file opens the file; a page of the website opens that page in the same design and language.
 */
export function docHref(d: DocEntry, design: "klassisk" | "moderne", lang: Lang): string {
  const meta: { access: Access; file?: string } = DOCS[d.key];
  if (meta.access === "login") {
    const portal = portalDocPath(d.key, lang);
    return design === "klassisk" && lang === "no" ? `/logg-inn?next=${encodeURIComponent(portal)}` : portal;
  }
  if (d.page) return design === "klassisk" ? kHref(d.page.klassisk, lang) : `/${lang}${d.page.moderne}`;
  return meta.file ?? (design === "klassisk" ? kHref("/dokumentbank", lang) : `/${lang}/dokumenter`);
}

export function docRows(group: DocGroup, design: "klassisk" | "moderne", lang: Lang): DocRow[] {
  return DOC_REGISTER.filter((d) => d.group === group).map((d) => {
    const meta: { date: string; access: Access } = DOCS[d.key];
    return {
      key: d.key,
      title: d.title[lang],
      what: d.what[lang],
      format: d.format[lang],
      icon: d.format.no === "Nettside" ? "WEB" : d.format.no.split(" ")[0],
      date: dateShort(meta.date, lang),
      access: meta.access,
      accessLabel: ACCESS[meta.access][lang],
      href: docHref(d, design, lang),
      login: meta.access === "login",
      file: meta.access === "public" && !d.page,
    };
  });
}

export const DOCUMENTS_PAGE = {
  title: L("Dokumentbank", "Document bank"),
  description: L(
    "Rapporter, kart, data og notater fra arbeidet med Knotten, ordnet etter hvem som står bak, med dato og format. Arbeidsdokumentene åpnes med innlogging.",
    "Reports, maps, data and notes from the work on Knotten, ordered by who is behind them, with date and format. The working documents open with a login.",
  ),
  lede: L(
    "Rapporter, kart, data og notater samlet på ett sted, ordnet etter hvem som står bak. Offentlige dokumenter kan alle åpne. Arbeidsdokumentene ligger i prosjektportalen og krever innlogging.",
    "Reports, maps, data and notes in one place, ordered by who is behind them. Anyone can open the public documents. The working documents are in the project portal and need a login.",
  ),
  login: L("Logg inn for interne dokumenter", "Log in for internal documents"),
  loginHint: L("Krever innlogging", "Login required"),
  comingTitle: L("Kommer", "Coming"),
  coming: [
    L("Teknisk energirapport, fra energisporet", "Technical energy report, from the energy track"),
    L("Markeds- og investorrapport, fra markedssporet", "Market and investor report, from the market track"),
    L("Reguleringsgrunnlag, til kommunen", "Zoning basis, for the municipality"),
  ],
  columns: { format: L("Format", "Format"), date: L("Dato", "Date"), access: L("Tilgang", "Access") },
};

/** The portal's document area, where a person who is logged in finds every document shared with them. */
export const portalDocuments = (lang: Lang) => `/${lang}/portal/dokumenter`;
