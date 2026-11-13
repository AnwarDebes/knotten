import { FACT } from "./facts/figures";
import { kHref, kSplit, type KLocale } from "./klassisk/locale";

/**
 * Every page of the website, once: its address in each design, its name and a line about it in both languages,
 * where each design's header, menu and footer link to it, and how search engines and the visitor statistics treat
 * it. Built from this list: the design switch (lib/design.ts), the Klassisk header and footer, the Moderne header,
 * menu and footer, the sitemap, robots.txt, the statistics' skip list (api/collect) and the page names on the
 * admin's statistics page. A page added here shows up in all of them, and both designs call it the same thing.
 *
 * Addresses: Klassisk paths are the Norwegian ones ("/energi"); English Klassisk puts /english in front
 * (lib/klassisk/locale.ts). Moderne paths come after /no or /en ("" is the front page); "#kart" names a section.
 * No Node or browser imports here: the proxy, the server and the browser all read this file.
 */
export type Lang = KLocale;
export type Text = { no: string; en: string };

/** The three link columns both footers share. */
export type FooterGroup = "place" | "project" | "you";

/** Where a design links to a page: its header bar, the Moderne menu sheet (the large list or the short one beside it), a footer column. */
export type Place = { header?: boolean; menu?: "main" | "more"; footer?: FooterGroup };

export type PageKey =
  | "home" | "plots" | "view" | "area" | "maps" | "photos" | "energy" | "existing" | "project" | "status" | "news" | "team"
  | "investors" | "documents" | "sources" | "configurator" | "contact" | "interest" | "privacy"
  | "login" | "password" | "register" | "mine" | "portal";

export type Page = {
  key: PageKey;
  /** The page's name: its title, and the words every link to it uses. */
  name: Text;
  /** A shorter name for the header and the menus, where it differs ("Energi" for "Energi og teknologi"). */
  short?: Text;
  /** One line about the page (the hints in the Moderne menu). */
  about: Text;
  /** The Klassisk page, when Klassisk has one. Every Klassisk page has an English twin under /english. */
  klassisk?: string;
  /** The Moderne page after /no or /en, when Moderne has one ("#…" for a section of a page). */
  moderne?: string;
  /**
   * The page the design switch opens in the other design when it is not this page's own address there: the
   * closest page when the other design has none (Utsikten in Moderne opens Bilder in Klassisk), or the form
   * when Klassisk's contact page is also its interest form.
   */
  twin?: { klassisk?: string; moderne?: string };
  /** In the sitemap and open to search engines. False for the login, account and portal pages. */
  index: boolean;
  /** Counted in the visitor statistics. Default: the same as `index`. */
  counted?: boolean;
  /** The sitemap's priority, 0 to 1. */
  priority?: number;
  /** How often the page changes, for the sitemap. */
  changes?: "daily" | "weekly" | "monthly" | "yearly";
  /** Klassisk has the page in English under /english. Default: true when `klassisk` is set. */
  english?: boolean;
  /** Where Klassisk links to the page. */
  k?: Place;
  /** Where Moderne links to the page. */
  m?: Place;
};

/** The order here is the order in every menu and footer. */
export const PAGES: Page[] = [
  {
    key: "home",
    name: { no: "Forside", en: "Front page" },
    about: { no: "Knotten på Rødberg i Lindesnes", en: "Knotten at Rødberg in Lindesnes" },
    klassisk: "/",
    moderne: "",
    index: true,
    priority: 1,
    changes: "weekly",
  },
  {
    key: "plots",
    name: { no: "Tomtene", en: "Plots" },
    about: { no: `Rundt ${FACT.plots} tomter, solpass for hver`, en: `About ${FACT.plots} plots, a sun passport for each` },
    klassisk: "/tomtene",
    moderne: "/tomter",
    index: true,
    priority: 0.9,
    changes: "weekly",
    k: { header: true, footer: "place" },
    m: { menu: "main", footer: "place" },
  },
  {
    key: "view",
    name: { no: "Utsikten", en: "The view" },
    about: { no: "Fjorden og åpent hav", en: "The fjord and open sea" },
    moderne: "/utsikt",
    twin: { klassisk: "/galleri" },
    index: true,
    priority: 0.7,
    changes: "monthly",
    m: { menu: "main", footer: "place" },
  },
  {
    key: "area",
    name: { no: "Området", en: "The area" },
    about: { no: "Rødberg i Lindesnes", en: "Rødberg in Lindesnes" },
    moderne: "/omradet",
    twin: { klassisk: "/kart" },
    index: true,
    priority: 0.7,
    changes: "monthly",
    m: { menu: "main", footer: "place" },
  },
  {
    key: "maps",
    name: { no: "Kart og terreng", en: "Maps and terrain" },
    about: { no: "Kartene i full størrelse, med kilde", en: "The maps in full size, with their sources" },
    klassisk: "/kart",
    moderne: "/omradet#kart",
    index: true,
    priority: 0.6,
    changes: "monthly",
    k: { footer: "place" },
    m: { footer: "place" },
  },
  {
    key: "photos",
    name: { no: "Bilder", en: "Photos" },
    about: { no: "Knotten og området, med fotograf og lisens", en: "Knotten and the area, with photographer and licence" },
    klassisk: "/galleri",
    moderne: "/omradet#bilder",
    twin: { moderne: "/utsikt" },
    index: true,
    priority: 0.6,
    changes: "monthly",
    k: { footer: "place" },
    m: { footer: "place" },
  },
  {
    key: "energy",
    name: { no: "Energi og teknologi", en: "Energy and technology" },
    short: { no: "Energi", en: "Energy" },
    about: { no: "Konseptet og tallene", en: "The concept and the numbers" },
    klassisk: "/energi",
    moderne: "/energi",
    index: true,
    priority: 0.8,
    changes: "monthly",
    k: { header: true, footer: "place" },
    m: { menu: "main", footer: "place" },
  },
  {
    key: "existing",
    name: { no: "Eksisterende bygg", en: "Existing buildings" },
    about: { no: "Kontorbygget, bolighuset og det som planlegges", en: "The office building, the house and what is planned" },
    klassisk: "/eksisterende-bygg",
    moderne: "/energi/eksisterende",
    index: true,
    priority: 0.6,
    changes: "monthly",
    k: { header: true, footer: "place" },
    m: { menu: "main", footer: "place" },
  },
  {
    key: "project",
    name: { no: "Om prosjektet", en: "About the project" },
    short: { no: "Prosjektet", en: "The project" },
    about: { no: "Fra målt grunnlag til salg", en: "From measured basis to sale" },
    klassisk: "/prosjektet",
    moderne: "/prosjektet",
    index: true,
    priority: 0.7,
    changes: "monthly",
    k: { header: true, footer: "project" },
    m: { menu: "main", footer: "project" },
  },
  {
    key: "status",
    name: { no: "Status og spørsmål", en: "Status and questions" },
    about: { no: "Hvor prosjektet står, og svar på det folk spør om", en: "Where the project stands, and answers to what people ask" },
    klassisk: "/status",
    moderne: "/status",
    index: true,
    priority: 0.7,
    changes: "weekly",
    k: { footer: "project" },
    m: { menu: "main", footer: "project" },
  },
  {
    key: "news",
    name: { no: "Nyheter", en: "News" },
    about: { no: "Det som har skjedd i prosjektet", en: "What has happened in the project" },
    klassisk: "/nyheter",
    moderne: "/nyheter",
    index: true,
    priority: 0.6,
    changes: "weekly",
    k: { footer: "project" },
    m: { menu: "main", footer: "project" },
  },
  {
    key: "team",
    name: { no: "Teamet", en: "The team" },
    about: { no: "Prosjekteieren og prosjektgruppen", en: "The project owner and the project group" },
    klassisk: "/teamet",
    moderne: "/team",
    index: true,
    priority: 0.5,
    changes: "monthly",
    k: { footer: "project" },
    m: { menu: "more", footer: "project" },
  },
  {
    key: "investors",
    name: { no: "Investorer og samarbeid", en: "Investors and partners" },
    short: { no: "Investorer", en: "Investors" },
    about: { no: "Det investorer spør om", en: "What investors ask" },
    klassisk: "/investorer",
    moderne: "/investor",
    index: true,
    priority: 0.7,
    changes: "monthly",
    k: { header: true, footer: "project" },
    m: { menu: "main", footer: "project" },
  },
  {
    key: "documents",
    name: { no: "Dokumentbank", en: "Document bank" },
    about: { no: "Rapporter, kart og notater", en: "Reports, maps and notes" },
    klassisk: "/dokumentbank",
    moderne: "/dokumenter",
    index: true,
    priority: 0.6,
    changes: "monthly",
    k: { header: true, footer: "project" },
    m: { menu: "main", footer: "project" },
  },
  {
    key: "sources",
    name: { no: "Kilder og forutsetninger", en: "Sources and assumptions" },
    about: { no: "Hvert tall og hvor det kommer fra", en: "Every figure and where it comes from" },
    klassisk: "/kilder",
    moderne: "/kilder",
    index: true,
    priority: 0.5,
    changes: "monthly",
    k: { footer: "project" },
    m: { menu: "more", footer: "project" },
  },
  {
    key: "configurator",
    name: { no: "Sett sammen huset", en: "Configure your house" },
    about: { no: "Velg tomt, planløsning, fasade og energi", en: "Choose a plot, the plan, the facade and the energy" },
    klassisk: "/konfigurator",
    moderne: "/konfigurator",
    index: true,
    priority: 0.6,
    changes: "monthly",
    k: { footer: "you" },
    m: { menu: "more", footer: "you" },
  },
  {
    key: "interest",
    name: { no: "Meld interesse", en: "Register interest" },
    about: { no: "Si hva du er interessert i, så hører du fra oss", en: "Tell us what you are interested in, and you will hear from us" },
    moderne: "/interesse",
    twin: { klassisk: "/kontakt" },
    index: true,
    priority: 0.6,
    changes: "monthly",
    k: { footer: "you" },
    m: { footer: "you" },
  },
  {
    key: "contact",
    name: { no: "Kontakt", en: "Contact" },
    about: { no: "Prosjekteier og hvordan du når oss", en: "The project owner and how to reach us" },
    klassisk: "/kontakt",
    moderne: "/kontakt",
    // Klassisk's contact page carries the interest form too; its Moderne twin is the form
    twin: { moderne: "/interesse" },
    index: true,
    priority: 0.6,
    changes: "monthly",
    k: { footer: "you" },
    m: { menu: "main", footer: "you" },
  },
  {
    key: "privacy",
    name: { no: "Personvern", en: "Privacy" },
    about: { no: "Hva vi lagrer, og hvordan du får det slettet", en: "What we store, and how to have it deleted" },
    klassisk: "/personvern",
    moderne: "/personvern",
    index: true,
    priority: 0.3,
    changes: "yearly",
    k: { footer: "you" },
    m: { menu: "more", footer: "you" },
  },
  // ---------------------------------------------------------------- behind a login: never indexed, never counted
  {
    key: "login",
    name: { no: "Logg inn", en: "Log in" },
    about: { no: "Min side og prosjektportalen", en: "My page and the project portal" },
    klassisk: "/logg-inn",
    moderne: "/login",
    index: false,
  },
  {
    key: "password",
    name: { no: "Velg passord", en: "Choose a password" },
    about: { no: "Fra en invitasjon eller en lenke for nytt passord", en: "From an invitation or a password link" },
    klassisk: "/logg-inn/passord",
    moderne: "/login/passord",
    index: false,
  },
  {
    key: "register",
    name: { no: "Opprett konto", en: "Create account" },
    about: { no: "Følg tomtene og lagre husene du setter sammen", en: "Follow the plots and save the houses you configure" },
    klassisk: "/registrer",
    moderne: "/registrer",
    index: false,
  },
  {
    key: "mine",
    name: { no: "Min side", en: "My page" },
    about: { no: "Tomtene du følger, husene dine og varslene", en: "The plots you follow, your houses and alerts" },
    klassisk: "/min-side",
    moderne: "/min-side",
    index: false,
  },
  {
    key: "portal",
    name: { no: "Prosjektportalen", en: "The project portal" },
    short: { no: "Portalen", en: "Portal" },
    about: { no: "For dem prosjektet har invitert", en: "For the people the project has invited" },
    // one portal for both designs, in the Moderne look
    moderne: "/portal",
    index: false,
  },
];

const BY_KEY = new Map(PAGES.map((p) => [p.key, p]));

export function page(key: PageKey): Page {
  return BY_KEY.get(key)!;
}

/** The name a link uses: the short one in the header and the menus, the full one elsewhere. */
export function label(p: Page, lang: Lang, short = false): string {
  return (short && p.short ? p.short : p.name)[lang];
}

// -------------------------------------------------------------------------------------- pages with a parameter
/**
 * Pages made from a list: one per plot (/tomtene/07 in Klassisk, /tomter/plot-07 in Moderne) and one per person on
 * the team (/teamet/<navn>, /team/<navn>). The part in brackets carries over to the other design.
 */
export type Pattern = {
  key: "plot" | "person";
  /** The page the list belongs to: a plot page is part of Tomtene. */
  parent: PageKey;
  klassisk: RegExp;
  moderne: RegExp;
  toKlassisk: (id: string) => string;
  toModerne: (id: string) => string;
  name: (id: string) => Text;
  index: true;
  priority: number;
  changes: "weekly" | "monthly";
};

/** "sigve-simonsen" to "Sigve Simonsen", for a page name where the team data is not at hand. */
const fromSlug = (s: string) => s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export const PATTERNS: Pattern[] = [
  {
    key: "plot",
    parent: "plots",
    klassisk: /^\/tomtene\/(\d{2})$/,
    moderne: /^\/tomter\/plot-(\d{2})$/,
    toKlassisk: (nn) => `/tomtene/${nn}`,
    toModerne: (nn) => `/tomter/plot-${nn}`,
    name: (nn) => ({ no: `Tomt ${Number(nn)}`, en: `Plot ${Number(nn)}` }),
    index: true,
    priority: 0.5,
    changes: "weekly",
  },
  {
    key: "person",
    parent: "team",
    klassisk: /^\/teamet\/([a-z0-9-]+)$/,
    moderne: /^\/team\/([a-z0-9-]+)$/,
    toKlassisk: (slug) => `/teamet/${slug}`,
    toModerne: (slug) => `/team/${slug}`,
    name: (slug) => ({ no: fromSlug(slug), en: fromSlug(slug) }),
    index: true,
    priority: 0.5,
    changes: "monthly",
  },
];

/** A plot's id ("plot-07") as the two digits both designs' addresses use ("07"). */
export const plotDigits = (id: string) => id.replace(/^plot-/, "").padStart(2, "0");

// -------------------------------------------------------------------------------------------- reading an address
export type Match = { page: Page; pattern?: Pattern; id?: string };

const stripHash = (p: string) => p.split("#")[0] || "";

/** The page behind a Klassisk path without the language prefix ("/energi", "/tomtene/07"), or null. */
export function matchKlassisk(path: string): Match | null {
  const p = stripHash(path) || "/";
  for (const x of PAGES) if (x.klassisk === p) return { page: x };
  for (const pt of PATTERNS) {
    const m = pt.klassisk.exec(p);
    if (m) return { page: page(pt.parent), pattern: pt, id: m[1] };
  }
  return null;
}

/**
 * The page behind a Moderne path after the language ("/energi", "/tomter/plot-07", "/omradet#kart"), or null. A path
 * with a section ("#kart") finds the section's entry first, then the page's. Sub-pages of the portal are the portal.
 */
export function matchModerne(rest: string): Match | null {
  const [p, hash] = rest.split("#");
  if (hash) for (const x of PAGES) if (x.moderne === `${p}#${hash}`) return { page: x };
  for (const x of PAGES) if (x.moderne === p) return { page: x };
  for (const pt of PATTERNS) {
    const m = pt.moderne.exec(p);
    if (m) return { page: page(pt.parent), pattern: pt, id: m[1] };
  }
  if (/^\/portal(\/|$)/.test(p)) return { page: page("portal") };
  return null;
}

/** Any address of the site: which design, which language, and which page (null when the registry does not know it). */
export function readAddress(pathname: string): { design: "klassisk" | "moderne"; lang: Lang; rest: string; match: Match | null } {
  const m = /^\/(no|en)(?=\/|$|#)(.*)$/.exec(pathname);
  if (m) {
    const rest = m[2];
    return { design: "moderne", lang: m[1] as Lang, rest, match: matchModerne(rest) };
  }
  const { locale, path } = kSplit(pathname.split("#")[0] || "/");
  return { design: "klassisk", lang: locale, rest: path, match: matchKlassisk(path) };
}

/** The name of whatever page an address shows ("Tomt 7", "Energi og teknologi"), or null. */
export function nameOf(pathname: string, lang: Lang): string | null {
  const { match } = readAddress(pathname);
  if (!match) return null;
  return match.pattern && match.id ? match.pattern.name(match.id)[lang] : match.page.name[lang];
}

// ------------------------------------------------------------------------------------------------ links to a page
/** Klassisk has the page in English too (/english + its path). */
export const hasEnglish = (p: Page) => !!p.klassisk && p.english !== false;

/**
 * The page's Klassisk address in a language, or the closest Klassisk page (twin); a page only Moderne has (the
 * portal) opens there in the language. A page without an English Klassisk twin stays Norwegian.
 */
export function klassiskLink(p: Page, lang: Lang): string | null {
  const path = p.klassisk ?? p.twin?.klassisk;
  if (path === undefined) return p.moderne !== undefined ? `/${lang}${p.moderne}` : null;
  const twin = p.klassisk ? p : PAGES.find((x) => x.klassisk === path);
  return kHref(path, twin && !hasEnglish(twin) ? "no" : lang);
}

/** The page's Moderne address in a language. A page only Klassisk has opens its closest Moderne page. */
export function moderneLink(p: Page, lang: Lang): string | null {
  const path = p.moderne ?? p.twin?.moderne;
  return path === undefined ? null : `/${lang}${path}`;
}

/** The pages a design links to in its header bar, in menu order. */
export function headerPages(design: "klassisk" | "moderne"): Page[] {
  return PAGES.filter((p) => (design === "klassisk" ? p.k : p.m)?.header);
}

/** The pages in the Moderne menu sheet: the large list, or the short list beside it. */
export function menuPages(list: "main" | "more"): Page[] {
  return PAGES.filter((p) => p.m?.menu === list);
}

/** The footer's three columns, the same in both designs; each design lists the pages it has. */
export const FOOTER_GROUPS: { key: FooterGroup; title: Text }[] = [
  { key: "place", title: { no: "Stedet", en: "The place" } },
  { key: "project", title: { no: "Prosjektet", en: "The project" } },
  { key: "you", title: { no: "For deg", en: "For you" } },
];

export function footerColumns(design: "klassisk" | "moderne"): { key: FooterGroup; title: Text; pages: Page[] }[] {
  return FOOTER_GROUPS.map((g) => ({ ...g, pages: PAGES.filter((p) => (design === "klassisk" ? p.k : p.m)?.footer === g.key) }));
}

// ------------------------------------------------------------------------------------- the pages behind a login
const PRIVATE: PageKey[] = PAGES.filter((p) => !(p.counted ?? p.index)).map((p) => p.key);

/**
 * True for the pages behind a login and the forms that lead there (log in, choose a password, create an account,
 * Min side, the portal), in both designs and both languages: never counted in the statistics, never crawled.
 */
export function isPrivatePath(pathname: string): boolean {
  const { match, rest, design } = readAddress(pathname);
  if (match) return PRIVATE.includes(match.page.key);
  // a deeper address under a private page (/min-side/x, /logg-inn/x) is private too
  return PAGES.some((p) => {
    const base = design === "klassisk" ? p.klassisk : p.moderne;
    return PRIVATE.includes(p.key) && !!base && base !== "/" && rest.startsWith(`${base}/`);
  });
}

/** robots.txt: every address prefix of the private pages, in both designs and both languages. */
export function privatePrefixes(): string[] {
  const out = new Set<string>();
  for (const p of PAGES) {
    if (p.counted ?? p.index) continue;
    if (p.klassisk) for (const l of ["no", "en"] as const) out.add(kHref(p.klassisk, l));
    if (p.moderne !== undefined) for (const l of ["no", "en"] as const) out.add(`/${l}${p.moderne}`);
  }
  // "/logg-inn" already covers "/logg-inn/passord": keep the shortest prefix of each family
  const all = [...out].sort((a, b) => a.length - b.length);
  return all.filter((x, i) => !all.slice(0, i).some((y) => x.startsWith(`${y}/`)));
}
