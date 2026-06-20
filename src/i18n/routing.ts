import { defineRouting } from "next-intl/routing";

/**
 * Norwegian is the default locale and is served at /no; English at /en.
 * Both locales always carry a prefix. Pathnames are localised so each language
 * gets authentic URLs (the folder name under app/[locale] is the key on the
 * left; the value is the public path per locale).
 */
export const routing = defineRouting({
  locales: ["no", "en"],
  defaultLocale: "no",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/visjon": { no: "/visjon", en: "/vision" },
    "/energikonseptet": { no: "/energikonseptet", en: "/energy-concept" },
    "/omradet": { no: "/omradet", en: "/the-area" },
    "/tomt/[code]": { no: "/tomt/[code]", en: "/plot/[code]" },
    "/robusthet": { no: "/robusthet", en: "/resilience" },
    "/baerekraft": { no: "/baerekraft", en: "/sustainability" },
    "/fremdrift": { no: "/fremdrift", en: "/progress" },
    "/verktoy": { no: "/verktoy", en: "/tools" },
    "/verktoy/energi": { no: "/verktoy/energi", en: "/tools/energy" },
    "/verktoy/strompris": { no: "/verktoy/strompris", en: "/tools/price-security" },
    "/verktoy/manedskostnad": { no: "/verktoy/manedskostnad", en: "/tools/monthly-cost" },
    "/verktoy/sol": { no: "/verktoy/sol", en: "/tools/sun" },
    "/verktoy/naromrade": { no: "/verktoy/naromrade", en: "/tools/neighbourhood" },
    "/verktoy/strombrudd": { no: "/verktoy/strombrudd", en: "/tools/power-outage" },
    "/verktoy/konfigurator": { no: "/verktoy/konfigurator", en: "/tools/configurator" },
    "/prospekt": { no: "/prospekt", en: "/prospectus" },
    "/meld-interesse": { no: "/meld-interesse", en: "/register-interest" },
    "/aktuelt": { no: "/aktuelt", en: "/news" },
    "/for-kommune-og-partnere": { no: "/for-kommune-og-partnere", en: "/for-partners" },
    "/kontakt": { no: "/kontakt", en: "/contact" },
    "/personvern": { no: "/personvern", en: "/privacy" },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
/** Pathnames without a dynamic segment, usable as a bare href. */
export type StaticPathname = Exclude<AppPathname, `${string}[${string}]${string}`>;
