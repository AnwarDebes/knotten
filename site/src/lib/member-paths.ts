import type { Design } from "./design";
import { ROLE_PARAM } from "./forms";
import { kHref } from "./klassisk/locale";

/**
 * Where a buyer's own account lives in each design and language: Klassisk in Norwegian at the root (/min-side) and in
 * English under /english (/english/min-side), Moderne at /no/min-side and /en/min-side. A visitor stays in the design
 * and the language they came from, also when a link arrives by email.
 * No Node or browser imports here: pages, server actions, emails and the proxy all use it.
 */
export type Lang = "no" | "en";

/** The address of a page in a design and language: Klassisk's own path, or Moderne's path after the language. */
const at = (design: Design | undefined, locale: Lang, klassisk: string, moderne: string) =>
  design === "klassisk" ? kHref(klassisk, locale) : `/${locale}${moderne}`;

/** Min side: /min-side or /english/min-side in Klassisk, /no/min-side and /en/min-side in Moderne. */
export function minSidePath(design: Design | undefined, locale: Lang) {
  return at(design, locale, "/min-side", "/min-side");
}

/** The sign-up page: /registrer or /english/registrer in Klassisk, /no/registrer and /en/registrer in Moderne. */
export function registerPath(design: Design | undefined, locale: Lang) {
  return at(design, locale, "/registrer", "/registrer");
}

/** The login page: /logg-inn or /english/logg-inn in Klassisk, /no/login and /en/login in Moderne. */
export function loginPagePath(design: Design | undefined, locale: Lang) {
  return at(design, locale, "/logg-inn", "/login");
}

/** The page where invitation, reset and confirmation links land: /logg-inn/passord in Klassisk, /{l}/login/passord in Moderne. */
export function passwordPagePath(design: Design | undefined, locale: Lang) {
  return at(design, locale, "/logg-inn/passord", "/login/passord");
}

/** The privacy statement in the same design and language. */
export function privacyPath(design: Design | undefined, locale: Lang) {
  return at(design, locale, "/personvern", "/personvern");
}

/** The house configurator with a saved house's state (`toSearch` from lib/configurator/state). */
export function configuratorPath(design: Design | undefined, locale: Lang, search = "") {
  return `${at(design, locale, "/konfigurator", "/konfigurator")}${search}`;
}

/** A plot's own page: /tomtene/07 in Klassisk, /{l}/tomter/plot-07 in Moderne. */
export function plotPath(design: Design | undefined, locale: Lang, plotId: string) {
  return at(design, locale, `/tomtene/${plotId.replace(/^plot-/, "").padStart(2, "0")}`, `/tomter/${plotId}`);
}

/** Where people who were invited ask for access to the portal: the interest form with the access role (lib/forms.ts). */
export function contactPath(design: Design | undefined, locale: Lang) {
  return at(design, locale, `/kontakt?rolle=${ROLE_PARAM.access.rolle}`, `/interesse?purpose=${ROLE_PARAM.access.purpose}`);
}

/** Plots preselected on the sign-up page: ?tomt=7 (Klassisk's name) or ?plot=plot-07 (Moderne's), one or several. */
export function plotsFromQuery(q: { tomt?: string | string[]; plot?: string | string[] }): string[] {
  const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? v.split(",") : []);
  const out = new Set<string>();
  for (const t of list(q.tomt)) if (/^\d{1,2}$/.test(t.trim()) && Number(t) >= 1 && Number(t) <= 99) out.add(`plot-${t.trim().padStart(2, "0")}`);
  for (const p of list(q.plot)) if (/^plot-\d{2}$/.test(p.trim())) out.add(p.trim());
  return [...out];
}
