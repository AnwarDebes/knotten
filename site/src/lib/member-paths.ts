import type { Design } from "./design";

/**
 * Where a buyer's own account lives in each design and language. Klassisk is Norwegian today, so an English page
 * opens the Moderne one; the Klassisk components already carry English, so an English Klassisk only changes these.
 * No Node or browser imports here: pages, server actions, emails and the proxy all use it.
 */
export type Lang = "no" | "en";

const klassisk = (design: Design | undefined, locale: Lang) => design === "klassisk" && locale === "no";

/** Min side: /min-side in Klassisk, /no/min-side and /en/min-side in Moderne. */
export function minSidePath(design: Design | undefined, locale: Lang) {
  return klassisk(design, locale) ? "/min-side" : `/${locale}/min-side`;
}

/** The sign-up page: /registrer in Klassisk, /no/registrer and /en/registrer in Moderne. */
export function registerPath(design: Design | undefined, locale: Lang) {
  return klassisk(design, locale) ? "/registrer" : `/${locale}/registrer`;
}

/** The login page: /logg-inn in Klassisk, /no/login and /en/login in Moderne. */
export function loginPagePath(design: Design | undefined, locale: Lang) {
  return klassisk(design, locale) ? "/logg-inn" : `/${locale}/login`;
}

/** The privacy statement in the same design and language. */
export function privacyPath(design: Design | undefined, locale: Lang) {
  return klassisk(design, locale) ? "/personvern" : `/${locale}/personvern`;
}

/** The house configurator with a saved house's state (`toSearch` from lib/configurator/state). */
export function configuratorPath(design: Design | undefined, locale: Lang, search = "") {
  return `${klassisk(design, locale) ? "/konfigurator" : `/${locale}/konfigurator`}${search}`;
}

/** A plot: Moderne has a page per plot; Klassisk shows every plot in the plot picker. */
export function plotPath(design: Design | undefined, locale: Lang, plotId: string) {
  return klassisk(design, locale) ? "/tomtene" : `/${locale}/tomter/${plotId}`;
}

/** Where people who were invited ask for access to the portal (the contact pages). */
export function contactPath(design: Design | undefined, locale: Lang) {
  return klassisk(design, locale) ? "/kontakt" : `/${locale}/kontakt`;
}

/** Plots preselected on the sign-up page: ?tomt=7 (Klassisk's name) or ?plot=plot-07 (Moderne's), one or several. */
export function plotsFromQuery(q: { tomt?: string | string[]; plot?: string | string[] }): string[] {
  const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? v.split(",") : []);
  const out = new Set<string>();
  for (const t of list(q.tomt)) if (/^\d{1,2}$/.test(t.trim()) && Number(t) >= 1 && Number(t) <= 99) out.add(`plot-${t.trim().padStart(2, "0")}`);
  for (const p of list(q.plot)) if (/^plot-\d{2}$/.test(p.trim())) out.add(p.trim());
  return [...out];
}
