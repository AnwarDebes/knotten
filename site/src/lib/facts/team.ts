import type { Lang, T } from "./core";
import { fmt } from "./core";
import { EED } from "./energy";
import { FACT } from "./figures";
import { CONTACT, DOCS, FINAL_PHASE, INTERNSHIP, dateLong, weeks } from "./project";

/**
 * The people behind Knotten, for the team pages of both designs (Klassisk /teamet, Moderne /{locale}/team).
 * On 12 November 2026 the project asked for a page for each of the four, which replaces the earlier rule that the
 * students' names stay off the site. Everything here comes from the project's own documents, checked against the
 * verified source folder: the names as the documents write them, the roles, tracks and deliverables as the work
 * structure for tracks 1 and 2 gives them, an organisation or study programme only where a document states one,
 * contributions with the date of the document they are in, and one quote per person from their own document.
 * No photos exist, so both designs draw a monogram. Only the project owner has contact details here, and only the
 * business contact the site already shows (CONTACT). No other biography, links or contact details.
 */

export type TeamSlug = "sigve-simonsen" | "henrik-ljones" | "sujata-neupane" | "anwar-debes";

/** A page that says more about a person's work: its address in Klassisk, and in Moderne after the locale. */
export type TeamLink = { label: T; hint: T; klassisk: string; moderne: string };

export type Contribution = {
  /** "2026-08-28", "2026-09" or "2026": as precise as the document is. */
  date: string;
  title: T;
  text: T;
  /** The document it is in. */
  source: T;
  /** Shown as "Foreløpig" / "Provisional": the item holds an estimate. */
  provisional?: boolean;
  /** Others on the team the item concerns; their pages are linked. */
  people?: TeamSlug[];
};

export type TeamQuote = {
  /** Both languages. The one named in `original` is word for word; the other is the site's translation. */
  text: T;
  /** "both" when the person's own document exists in both languages. */
  original: Lang | "both";
  source: T;
};

export type Person = {
  slug: TeamSlug;
  name: string;
  /** Drawn as the monogram while there is no photo. */
  initials: string;
  /** The project owner, or one of the project group. */
  group: "owner" | "group";
  role: T;
  track: T;
  /** One line on what the person is responsible for, from the work structure. */
  summary: T;
  /** What the work structure lists for the person to deliver. */
  deliverables: T;
  /** The final deliverable named in the work structure's final phase. */
  final: T;
  /** Only where a document states it: the company, or the study programme. */
  organisation: { label: T; name: string; title?: T } | null;
  /** In the order they happened, as far as the documents tell. */
  contributions: Contribution[];
  quote: TeamQuote;
  related: TeamLink[];
  /** Empty until a photo exists and the person has agreed to it; both designs then show it in place of the monogram. */
  photo: { src: string; alt: T; w: number; h: number } | null;
};

/** The document behind the roles, tracks and deliverables (the work structure, August 2026). */
export const TEAM_SOURCE: T = {
  no: `Roller, spor og leveranser: arbeidsopplegget for spor 1 og 2, ${dateLong(DOCS.work.date, "no")}.`,
  en: `Roles, tracks and deliverables: the work structure for tracks 1 and 2, ${dateLong(DOCS.work.date, "en")}.`,
};

const FINAL_WHEN: T = { no: weeks(FINAL_PHASE.weeks, "no"), en: weeks(FINAL_PHASE.weeks, "en") };

const PROJECT: TeamLink = {
  label: { no: "Om prosjektet", en: "The project" },
  hint: { no: "Målene, sporene og planen gjennom høsten", en: "The goals, the tracks and the plan through the autumn" },
  klassisk: "/prosjektet",
  moderne: "/prosjektet",
};

const POSTING: T = { no: "Utlysning av praksisplass, Sigve Simonsen AS, 2026", en: "Internship posting, Sigve Simonsen AS, 2026" };
const DIRECTION: T = { no: `Foreløpig retning for energikonseptet, ${dateLong(DOCS.direction.date, "no")}`, en: `Preliminary direction for the energy concept, ${dateLong(DOCS.direction.date, "en")}` };
const STRATEGY: T = { no: `«KNOTTEN. Market, Branding & Commercialisation Strategy», ${dateLong(DOCS.market.date, "no")}`, en: `«KNOTTEN. Market, Branding & Commercialisation Strategy», ${dateLong(DOCS.market.date, "en")}` };
const WEBSITE_PLAN: T = { no: "Nettsiden: plan og struktur, 31. august 2026", en: "The website: plan and structure, 31 August 2026" };

/** In the order the pages show them: the project owner first, then the project group by track. */
export const TEAM: Person[] = [
  {
    slug: "sigve-simonsen",
    name: CONTACT.name,
    initials: "SS",
    group: "owner",
    role: { no: "Prosjekteier og mentor", en: "Project owner and mentor" },
    track: { no: "Felles", en: "Common" },
    summary: { no: "Sigve Simonsen har prosjektansvaret og fungerer som prosjekteier og mentor.", en: "Sigve Simonsen is responsible for the project and acts as project owner and mentor." },
    deliverables: { no: "Retning, beslutninger, befaring, kontakt mot eksterne parter", en: "Direction, decisions, site visit and external contact" },
    final: { no: `En arbeidsversjon av Knotten masterplan, av alle og koordinert av Sigve, ${FINAL_WHEN.no}`, en: `A working version of the Knotten master plan, by everyone and coordinated by Sigve, ${FINAL_WHEN.en}` },
    organisation: { label: { no: "Selskap", en: "Company" }, name: CONTACT.company, title: CONTACT.role },
    contributions: [
      {
        date: "2026",
        title: { no: "Utlysningen av praksisplassen", en: "The internship posting" },
        text: {
          no: `«Utvikling av Norges mest energivennlige boligfelt»: prosjektets mål, og to fagspor for studentene, energi og marked. ${INTERNSHIP.hours} timer, med søknadsfrist ${INTERNSHIP.deadline.no}.`,
          en: `«Utvikling av Norges mest energivennlige boligfelt» (developing Norway's most energy-friendly housing field): the project's goals, and two tracks for the students, energy and market. ${INTERNSHIP.hours} hours, with an application deadline of ${INTERNSHIP.deadline.en}.`,
        },
        source: POSTING,
      },
      {
        date: DOCS.feedback.date,
        title: { no: "Tilbakemelding på leveranseplanen", en: "Feedback on the delivery plan" },
        text: { no: "Skriftlig tilbakemelding, på norsk og engelsk, på leveranseplanen for spor 3, den digitale plattformen.", en: "Written feedback, in Norwegian and English, on the delivery plan for Track 3, the digital platform." },
        source: { no: `Tilbakemelding på leveranseplan, release 1, ${dateLong(DOCS.feedback.date, "no")}`, en: `Feedback on the delivery plan, release 1, ${dateLong(DOCS.feedback.date, "en")}` },
        people: ["anwar-debes"],
      },
      {
        date: DOCS.direction.date,
        title: { no: "Foreløpig retning for energikonseptet", en: "Preliminary direction for the energy concept" },
        text: {
          no: "Svar på Henriks spørsmål, på norsk og engelsk: et robust og fleksibelt energisystem der sol, mulig vind, batterier i hver bolig og felles lager, og smart styring kan virke sammen.",
          en: "An answer to Henrik's questions, in Norwegian and English: a robust and flexible energy system in which solar, possible wind, batteries in each home and shared storage, and smart control can work together.",
        },
        source: DIRECTION,
        people: ["henrik-ljones"],
      },
      {
        date: "2026-09",
        title: { no: `Rundt ${FACT.plots} tomter, med sjøutsikt som ønske`, en: `About ${FACT.plots} plots, with a sea view as the wish` },
        text: {
          no: `Planen om rundt ${FACT.plots} tomter, og ønsket om sjøutsikt fra alle, selv om det ikke er sikkert at det går fra alle tomtene.`,
          en: `The plan for about ${FACT.plots} plots, and the wish for a sea view from all of them, though it is not certain that every plot will get one.`,
        },
        source: { no: "Melding til prosjektgruppen, september 2026", en: "Message to the project group, September 2026" },
      },
      {
        date: DOCS.view_photos.date,
        title: { no: "Bilder og kart fra stedet", en: "Photos and maps of the place" },
        text: {
          no: "Bildene av utsikten, og kartene, skissen til situasjonsplan, terrengprofilen og siktlinjen som nettsiden bygger på.",
          en: "The photos of the view, and the maps, the site plan sketch, the terrain profile and the sight line the website builds on.",
        },
        source: { no: `Bilder og kart fra prosjekteier, ${dateLong(DOCS.view_photos.date, "no")}`, en: `Photos and maps from the project owner, ${dateLong(DOCS.view_photos.date, "en")}` },
      },
    ],
    quote: {
      // the posting writes «norges» in lower case; only the name of the country is capitalised here
      text: {
        no: "Vi ønsker å lage Norges beste boligfelt innen teknologi, strømsparing og trygghet. Det er ett eget eid byggefelt som skal utvikles.",
        en: "We want to create Norway's best housing field in technology, power saving and safety. It is a self-owned building field that is to be developed.",
      },
      original: "no",
      source: POSTING,
    },
    related: [
      PROJECT,
      { label: { no: "Kontakt", en: "Contact" }, hint: { no: "Spørsmål om tomtene, prosjektet eller samarbeid", en: "Questions about the plots, the project or partnerships" }, klassisk: "/kontakt", moderne: "/kontakt" },
    ],
    photo: null,
  },
  {
    slug: "henrik-ljones",
    name: "Henrik Ljones",
    initials: "HL",
    group: "group",
    role: { no: "Teknisk ansvarlig", en: "Technical lead" },
    track: { no: "Spor 1: energi, teknikk og infrastruktur", en: "Track 1: energy, technology and infrastructure" },
    summary: { no: "Henrik har hovedansvar for energi, teknikk og infrastruktur.", en: "Henrik has the main responsibility for energy, technology and infrastructure." },
    deliverables: { no: "Energianalyse, tekniske alternativer, anbefalt energikonsept", en: "Energy analysis, technical alternatives and a recommended energy concept" },
    final: { no: `Teknisk energirapport, ${FINAL_WHEN.no}`, en: `Technical energy report, ${FINAL_WHEN.en}` },
    organisation: null,
    contributions: [
      {
        date: DOCS.measures.date,
        title: { no: "Sammenligning av energitiltak", en: "Comparison of energy measures" },
        text: {
          no: "Tiltak for produksjon, lagring og sparing vurdert mot de samme kriteriene, med Henriks vurdering av hvert tiltak. Vurderingene står på energisiden.",
          en: "Measures for production, storage and saving weighed against the same criteria, with Henrik's verdict on each. The verdicts are on the energy page.",
        },
        source: { no: `Sammenligning av tiltak, utarbeidet av Henrik Ljones, ${dateLong(DOCS.measures.date, "no")}`, en: `Comparison of measures, prepared by Henrik Ljones, ${dateLong(DOCS.measures.date, "en")}` },
      },
      {
        date: "2026-08-28",
        title: { no: "Notater: lese videre og kontakte", en: "Notes: reading on and contacts" },
        text: {
          no: "Nye tiltak å undersøke, som solfangere, hybride solceller og basseng som lager, dimensjonering av vindkraft, referanseprosjekter som Varden skole og Zero Village Bergen, og verktøy som EED og TRNSYS.",
          en: "New measures to look into, such as solar collectors, hybrid solar panels and a pool as storage, the sizing of wind power, reference projects such as Varden skole and Zero Village Bergen, and tools such as EED and TRNSYS.",
        },
        source: { no: "Notater «Lese videre på/kontakte», energisporet, 28. august 2026", en: "Notes «Lese videre på/kontakte», energy track, 28 August 2026" },
      },
      {
        date: DOCS.direction.date,
        title: { no: "Spørsmålene bak energiretningen", en: "The questions behind the energy direction" },
        text: {
          no: "Spørsmålene til prosjekteier som ga svaret «Foreløpig retning for energikonseptet».",
          en: "The questions to the project owner that led to the answer «Preliminary direction for the energy concept».",
        },
        source: { no: `${DIRECTION.no}, svar på Henriks spørsmål`, en: `${DIRECTION.en}, response to Henrik's questions` },
        people: ["sigve-simonsen"],
      },
      {
        date: DOCS.eed.date,
        title: { no: "Grunnvarmeanalyse i Earth Energy Designer", en: "Ground source heat analysis in Earth Energy Designer" },
        text: {
          no: `En brønnpark med ${EED.boreholes} energibrønner simulert i EED. Væsketemperaturen stabiliserer seg, og den laveste det siste simulerte året er ${fmt(EED.fluid_min_c, "no")} °C.`,
          en: `A field of ${EED.boreholes} boreholes simulated in EED. The fluid temperature levels off, and the lowest in the last simulated year is ${fmt(EED.fluid_min_c, "en")} °C.`,
        },
        source: { no: `Grunnvarmeanalyse i Earth Energy Designer, energisporet, ${dateLong(DOCS.eed.date, "no")}`, en: `Ground source heat analysis in Earth Energy Designer, energy track, ${dateLong(DOCS.eed.date, "en")}` },
        provisional: true,
      },
    ],
    quote: {
      text: {
        no: "Grafen stabiliserer seg og minste temperatur er -0,78 som begge er bra.",
        en: "The graph levels off and the lowest temperature is -0.78, both of which are good.",
      },
      original: "no",
      source: { no: "Notater «Lese videre på/kontakte», om resultatet av grunnvarmeanalysen", en: "Notes «Lese videre på/kontakte», on the result of the ground source heat analysis" },
    },
    related: [
      { label: { no: "Energi og teknologi", en: "Energy and technology" }, hint: { no: "Tiltakene, energiregnskapet og brønnparken", en: "The measures, the energy budget and the borehole field" }, klassisk: "/energi", moderne: "/energi" },
    ],
    photo: null,
  },
  {
    slug: "sujata-neupane",
    name: "Sujata Neupane",
    initials: "SN",
    group: "group",
    role: { no: "Marked og profilering", en: "Market and profiling" },
    track: { no: "Spor 2: profilering, marked og visualisering", en: "Track 2: profile, market and visualisation" },
    summary: { no: "Sujata har hovedansvar for marked, profilering, målgrupper og investorgrunnlag.", en: "Sujata has the main responsibility for market, profiling, target groups and the investor basis." },
    deliverables: { no: "Målgrupper, investorgrunnlag, markedsstrategi og budskap", en: "Target groups, investor basis, market strategy and messages" },
    final: { no: `Markeds- og investorrapport, ${FINAL_WHEN.no}`, en: `Market and investor report, ${FINAL_WHEN.en}` },
    // printed under her name on the strategy's title page; the document names no institution
    organisation: { label: { no: "Studieprogram", en: "Programme" }, name: "Master in Business Development and Management" },
    contributions: [
      {
        date: DOCS.market.date,
        title: { no: "Strategi for marked, merkevare og kommersialisering", en: "Market, branding and commercialisation strategy" },
        text: {
          no: "Et forslag til strategi for spor 2: historien om merkevaren, beliggenheten, et konsept for feltet i terrasser, energiarkitekturen, målgrupper, en sammenligning med andre typer boligprosjekter, en plan for tilskudd, en markedsplan og måltall.",
          en: "A proposed strategy for Track 2: the brand story, the location, a terraced concept for the field, the energy architecture, target groups, a comparison with other kinds of housing developments, a grant roadmap, a marketing plan and KPIs.",
        },
        source: STRATEGY,
      },
    ],
    quote: {
      text: {
        no: "Knotten forener naturskjønnhet, lave energiutgifter og fremtidsrettet ingeniørkunst.",
        en: "Knotten brings together physical beauty, low energy expenses, and forward-thinking engineering.",
      },
      original: "en",
      source: STRATEGY,
    },
    related: [
      { label: { no: "Investorer", en: "Investors" }, hint: { no: "Det investorer og samarbeidspartnere spør om", en: "What investors and partners ask about" }, klassisk: "/investorer", moderne: "/investor" },
    ],
    photo: null,
  },
  {
    slug: "anwar-debes",
    name: "Anwar Debes",
    initials: "AD",
    group: "group",
    role: { no: "Digital brobygger og nettsideansvarlig", en: "Digital bridge-builder and website lead" },
    track: { no: "Begge spor, og spor 3: digital plattform", en: "Both tracks, and Track 3: digital platform" },
    summary: { no: "Anwar har ansvar for nettside, digital struktur og presentasjon av prosjektmaterialet.", en: "Anwar is responsible for the website, the digital structure and the presentation of the project material." },
    deliverables: { no: "Hjemmeside, digital struktur, dokumentbank og visualisering", en: "Website, digital structure, document bank and visualisation" },
    final: { no: `Hjemmeside og digital prosjektportal, ${FINAL_WHEN.no}`, en: `Website and digital project portal, ${FINAL_WHEN.en}` },
    organisation: null,
    contributions: [
      {
        date: "2026-08-27",
        title: { no: "Leveranseplan for den digitale plattformen", en: "Delivery plan for the digital platform" },
        text: {
          no: "Planen for første release av spor 3, med utgangspunkt i at påstanden om Norges mest energivennlige boligfelt må vises, ikke bare sies. Prosjekteier svarte med skriftlig tilbakemelding dagen etter.",
          en: "The plan for the first release of Track 3, starting from the point that the claim of Norway's most energy-friendly housing field has to be shown, not just stated. The project owner answered with written feedback the next day.",
        },
        source: { no: "Knotten, Track 3: Digital Platform. Delivery plan, Release 1, 27. august 2026", en: "Knotten, Track 3: Digital Platform. Delivery plan, Release 1, 27 August 2026" },
        people: ["sigve-simonsen"],
      },
      {
        date: "2026-08-31",
        title: { no: "Nettsiden: plan og struktur", en: "The website: plan and structure" },
        text: {
          no: "Planen for nettsidens sider og struktur, på norsk og engelsk, skrevet for Sigve Simonsen AS: det siste planleggingsdokumentet før byggingen av nettsiden startet.",
          en: "The plan for the website's pages and structure, in Norwegian and English, written for Sigve Simonsen AS: the last planning document before building the website started.",
        },
        source: WEBSITE_PLAN,
      },
    ],
    quote: {
      text: {
        no: "Gjøre påstanden mulig å etterprøve. Hvert tall på siden lenker til kilden sin.",
        en: "Make the claim checkable. Every number on the site links to its source.",
      },
      original: "both",
      source: WEBSITE_PLAN,
    },
    related: [
      PROJECT,
      { label: { no: "Huskonfiguratoren", en: "The house configurator" }, hint: { no: "Velg tomt og sett sammen huset", en: "Choose a plot and put the house together" }, klassisk: "/konfigurator", moderne: "/konfigurator" },
    ],
    photo: null,
  },
];

export const TEAM_SLUGS = TEAM.map((p) => p.slug);

export function teamMember(slug: string): Person | undefined {
  return TEAM.find((p) => p.slug === slug);
}

/** "2026-08-28" -> "28. august 2026" or "28 August 2026"; "2026-09" -> "september 2026"; "2026" -> "2026". */
export function teamDate(iso: string, lang: Lang): string {
  return /^\d{4}$/.test(iso) ? iso : dateLong(iso, lang);
}

/** The words both designs use around the team data, so the two say the same thing. */
export const TEAM_LABELS = {
  team: { no: "Teamet", en: "The team" },
  owner: { no: "Prosjekteier", en: "Project owner" },
  group: { no: "Prosjektgruppen", en: "The project group" },
  role: { no: "Rolle", en: "Role" },
  track: { no: "Spor", en: "Track" },
  deliverables: { no: "Leveranser", en: "Deliverables" },
  final: { no: "Sluttleveranse", en: "Final deliverable" },
  contact: { no: "Kontakt", en: "Contact" },
  work: { no: "Arbeidet", en: "The work" },
  source: { no: "Kilde", en: "Source" },
  seeAlso: { no: "Se også", en: "See also" },
  provisional: { no: "Foreløpig", en: "Provisional" },
  quote: { no: "Med egne ord", en: "In their own words" },
  translation: { no: "På norsk, vår oversettelse", en: "In English, our translation" },
  readOn: { no: "Les videre", en: "Read on" },
  others: { no: "Resten av teamet", en: "The rest of the team" },
  all: { no: "Hele teamet", en: "The whole team" },
  profile: { no: "Les profilen", en: "Read the profile" },
} satisfies Record<string, T>;

/**
 * schema.org Person for a profile page: the name, the job title, and the organisation only where a document names
 * one (the project owner's company). `url` is the page's own absolute address.
 */
export function personJsonLd(p: Person, lang: Lang, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    jobTitle: p.organisation?.title ? p.organisation.title[lang] : p.role[lang],
    description: p.summary[lang],
    url,
    ...(p.group === "owner" && p.organisation ? { worksFor: { "@type": "Organization", name: p.organisation.name } } : {}),
  };
}

/** The text for search results and link previews: what the person is responsible for, then what they deliver. */
export function teamDescription(p: Person, lang: Lang): string {
  const d = p.deliverables[lang];
  return `${p.summary[lang]} ${TEAM_LABELS.deliverables[lang]}: ${d.charAt(0).toLowerCase()}${d.slice(1)}.`;
}

/** The same as text for a <script type="application/ld+json">, with "<" escaped so the text can never end the tag. */
export function personJsonLdText(p: Person, lang: Lang, url: string): string {
  return JSON.stringify(personJsonLd(p, lang, url)).replace(/</g, "\\u003c");
}

/** "A, B, C og D" or "A, B, C and D". */
export function nameList(names: string[], lang: Lang): string {
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} ${lang === "no" ? "og" : "and"} ${names[names.length - 1]}`;
}
