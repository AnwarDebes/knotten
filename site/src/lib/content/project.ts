import { CONTACT, FACT, FINAL_PHASE, INTERNSHIP, WORK_PLAN, cap, fmt, weeks, word, type Lang, type SourceId, type T } from "@/lib/facts";
import { PHOTOS } from "@/lib/klassisk/photos";

/**
 * "Om prosjektet" / "About the project" for both designs: the ambition, the five goals, the principles, the three
 * tracks with their work packages and deliverables, the plan through the autumn, what counts as success, the
 * collaboration with the University of Agder and the place. From the internship posting and the work structure
 * for tracks 1 and 2 (checked against the verified source folder); every number from src/lib/facts.
 * Each design lays it out in its own look; the words are the same.
 */

const L = (no: string, en: string): T => ({ no, en });

export const PROJECT_PAGE = {
  title: L("Om prosjektet", "About the project"),
  description: L(
    "Ambisjonen, de fem målene, de tre sporene med Universitetet i Agder og fasene i arbeidet med Knotten på Rødberg i Lindesnes.",
    "The ambition, the five goals, the three tracks with the University of Agder and the phases of the work on Knotten at Rødberg in Lindesnes.",
  ),
  lede: L(
    `${CONTACT.company} utvikler et eget eid byggefelt på Knotten, på Rødberg i Lindesnes. Målet er at det skal bli Norges mest energivennlige boligfelt: attraktivt, robust og fremtidsrettet, med lavt energibehov, lokal energiproduksjon, energilagring og gode løsninger for trygghet og beredskap. Prosjektet starter før reguleringsplanen, så teknikk, infrastruktur, regulering og marked utvikles i sammenheng fra start.`,
    `${CONTACT.company} is developing a self-owned building field on Knotten, at Rødberg in Lindesnes. The aim is for it to become Norway's most energy-friendly housing development: attractive, robust and forward-looking, with low energy demand, local energy production, energy storage and good solutions for safety and preparedness. The project starts before the zoning plan, so technology, infrastructure, zoning and market are developed together from the start.`,
  ),
  ledeSrc: "regulering" as SourceId,
};

// ------------------------------------------------------------------ the five goals (the internship posting)
export const GOALS_HEAD = {
  eyebrow: L("Ambisjonen", "The ambition"),
  title: L("Fem ting feltet skal levere", "Five things the field shall deliver"),
  text: L(
    "Prosjektet starter før reguleringsplanen. Det er gjort med vilje, så energisystemet og boligene kan planlegges sammen i stedet for hver for seg.",
    "The project starts before the zoning plan. That is on purpose, so the energy system and the homes can be planned together instead of one after the other.",
  ),
};

export const GOALS: { title: T; text: T }[] = [
  { title: L("Lavt energibehov", "Low energy demand"), text: L("Boligene planlegges med lavest mulig energibehov fra start, med bygningsutforming, tetthet og varmegjenvinning.", "The homes are planned with the lowest possible energy demand from the start, through building design, airtightness and heat recovery.") },
  { title: L("Lokal energiproduksjon", "Local energy production"), text: L("Sol på boligene og et felles anlegg bak feltet. Vind vurderes som supplement.", "Solar on the homes and a shared plant behind the field. Wind is assessed as a supplement.") },
  { title: L("Energideling og lagring", "Energy sharing and storage"), text: L("Batteri i hver bolig, med mulig tilgang til et felles lager for hele feltet.", "A battery in every home, with possible access to shared storage for the whole field.") },
  { title: L("Robusthet ved strømbrudd", "Resilience in power cuts"), text: L("Hva som må fungere når nettet faller ut, og hvor lenge, avklares i energikonseptet.", "What must keep working when the grid goes down, and for how long, is settled in the energy concept.") },
  { title: L("Referanseprosjekt nasjonalt", "A national reference project"), text: L("Ambisjonen er at Knotten blir et nasjonalt referanseprosjekt som andre felt kan bygge på.", "The ambition is for Knotten to become a national reference project that other developments can build on.") },
];

// ------------------------------------------------------------------ the principles (the work structure, section 1)
export const PRINCIPLES_HEAD = {
  eyebrow: L("Retningen", "The direction"),
  title: L("Energi, teknologi og trygghet fra start", "Energy, technology and safety from the start"),
};

export const PRINCIPLES: T[] = [
  L("Knotten skal vise hvordan fremtidens boliger kan planlegges tidlig, med energi, teknologi og trygghet som premiss.", "Knotten shall show how tomorrow's homes can be planned early, with energy, technology and safety as the premise."),
  L("Det eksisterende bolighuset og kontorbygget, og det planlagte lager- og verkstedbygget, vurderes som en del av det samlede energibildet for området.", "The existing house and office building, and the planned storage and workshop building, are assessed as part of the area's whole energy picture."),
  L("Arbeidet brukes videre i regulering, konseptutvikling, nettside, investorarbeid og dialog med kommune og samarbeidspartnere.", "The work feeds into zoning, concept development, the website, investor work and dialogue with the municipality and partners."),
];

// ------------------------------------------------------------------ the three tracks (the work structure, sections 2 to 4)
export type WorkPackage = { title: T; what: T; deliverable: T };
export type Track = { id: "energy" | "market" | "platform"; name: T; goal: T; packages: WorkPackage[] };

export const TRACKS_HEAD = {
  eyebrow: L("Slik jobbes det", "How the work is organised"),
  title: L("Tre spor, ett felt", "Three tracks, one field"),
  text: L(
    `Prosjekteier leder arbeidet og er mentor. Studenter fra Universitetet i Agder arbeider i to fagspor gjennom et internship på ${INTERNSHIP.hours} timer, og det tredje sporet, den digitale plattformen, samler arbeidet.`,
    `The project owner leads the work and is the mentor. Students from the University of Agder work in two tracks through an internship of ${INTERNSHIP.hours} hours, and the third track, the digital platform, brings the work together.`,
  ),
  src: "utlysning" as SourceId,
  deliverable: L("Leveranse", "Deliverable"),
};

export const TRACKS: Track[] = [
  {
    id: "energy",
    name: L("Spor 1: energi, teknikk og infrastruktur", "Track 1: energy, technology and infrastructure"),
    goal: L("Utrede hvordan de nye boligene kan planlegges med lavest mulig energibehov og høyest mulig robusthet.", "Assess how the new homes can be planned with the lowest possible energy demand and the highest possible robustness."),
    packages: [
      { title: L("Energibehov for nye boliger", "Energy demand for new homes"), what: L("Forventet forbruk, boligtyper, standardnivå, oppvarming, varmtvann og elbillading. Hva krever TEK17, passivhus eller plusshus?", "Expected consumption, house types, standard, heating, hot water and car charging. What do TEK17, passive house or plus house require?"), deliverable: L("Notat med energibudsjett og antakelser", "Note with energy budget and assumptions") },
      { title: L("Lokal energiproduksjon", "Local energy production"), what: L("Solceller på tak og fasader, solfangere, småskala vind, energibrønner og grunnvarme. Hva passer tomt, klima, økonomi og drift?", "Solar on roofs and facades, solar collectors, small wind, boreholes and ground heat. What suits the site, climate, economy and operation?"), deliverable: L("Oversikt over teknologier med fordeler og ulemper", "Overview of technologies with pros and cons") },
      { title: L("Energilagring og styring", "Storage and control"), what: L("Batterier, termisk lagring, sandbatteri, smart styring, bil som lager og laststyring. Hvordan lagres energi til når behovet er størst?", "Batteries, thermal storage, sand battery, smart control, the car as storage and load management. How is energy stored for when demand peaks?"), deliverable: L("Skisse til lagrings- og styringskonsept", "Sketch of a storage and control concept") },
      { title: L("Eksisterende bygg som tillegg", "Existing buildings as an addition"), what: L(`Bolighuset, kontorbygget med inntil ${FACT.offices_after} kontorer og lager- og verkstedbygget som energibrukere og mulige energiflater.`, `The house, the office building with up to ${FACT.offices_after} offices and the storage and workshop building as energy users and possible energy surfaces.`), deliverable: L("Tilleggsnotat om eksisterende bygg", "Supplementary note on existing buildings") },
      { title: L("Robusthet og beredskap", "Resilience and preparedness"), what: L("Drift ved strømbrudd, kritiske laster, nødstrøm, batterikapasitet og prioritering. Hva må fungere, og hvor lenge?", "Operation in an outage, critical loads, backup power, battery capacity and priorities. What must work, and for how long?"), deliverable: L("Beredskaps- og robusthetsvurdering", "Preparedness and resilience assessment") },
      { title: L("Anbefalt konsept", "Recommended concept"), what: L("Alternativene sammenlignes og en realistisk løsning foreslås for første byggetrinn og videre utbygging.", "Alternatives compared and a realistic solution proposed for the first stage and further build-out."), deliverable: L("Teknisk sluttrapport og anbefaling", "Technical final report and recommendation") },
    ],
  },
  {
    id: "market",
    name: L("Spor 2: profilering, marked og visualisering", "Track 2: profile, market and visualisation"),
    goal: L("Gjøre Knotten forståelig, attraktivt og salgbart for fremtidige boligkjøpere, investorer og samarbeidspartnere.", "Make Knotten understandable, attractive and marketable for future home buyers, investors and partners."),
    packages: [
      { title: L("Målgrupper", "Target groups"), what: L("Boligkjøpere, familier, seniorer, pendlere, miljøbevisste og teknologiinteresserte. Hvem har størst betalingsvilje for energieffektive boliger?", "Home buyers, families, seniors, commuters, the environmentally aware and the technology-minded. Who will pay most for energy-efficient homes?"), deliverable: L("Målgruppeanalyse og personas", "Target group analysis and personas") },
      { title: L("Investor- og partneranalyse", "Investor and partner analysis"), what: L("Investorer, eiendomsaktører, energiselskaper, teknologiaktører, Enova og Innovasjon Norge. Hvem vil støtte, finansiere eller teste?", "Investors, property players, energy companies, technology players, Enova and Innovation Norway. Who wants to support, finance or test?"), deliverable: L("Investor- og partnerskapsnotat", "Investor and partnership note") },
      { title: L("Salgsbudskap", "Sales messages"), what: L("Korte, tydelige budskap for kunder, kommune, investorer og partnere, uten at det blir for teknisk.", "Short, clear messages for customers, municipality, investors and partners, without getting too technical."), deliverable: L("Budskapsbank til nettside og presentasjoner", "Message bank for website and presentations") },
      { title: L("Konkurrent- og referanseanalyse", "Competitor and reference analysis"), what: L("Knotten mot andre energi- og bærekraftsprosjekter i Norge og internasjonalt. Hva gjør Knotten unikt?", "Knotten against other energy and sustainability projects in Norway and abroad. What makes Knotten unique?"), deliverable: L("Referanseoversikt og posisjonering", "Reference overview and positioning") },
      { title: L("Visuell profil og innhold", "Visual profile and content"), what: L("Språk, bildebruk, visualisering, historiefortelling, sosiale medier og prospektstruktur.", "Language, imagery, visualisation, storytelling, social media and prospectus structure."), deliverable: L("Profil- og innholdsnotat", "Profile and content note") },
      { title: L("Eksisterende bygg i historien", "Existing buildings in the story"), what: L("Kontorbygget og verkstedet gir prosjektet et mer komplett energimiljø, presentert som et tillegg.", "The office building and the workshop give the project a more complete energy environment, presented as an addition."), deliverable: L("Tekst til nettsiden om eksisterende bygg", "Website text on existing buildings") },
    ],
  },
  {
    id: "platform",
    name: L("Spor 3: den digitale plattformen", "Track 3: the digital platform"),
    goal: L(
      "Denne nettsiden og prosjektportalen: presentasjon, dokumentbank, visualisering og en tallbase der hvert tall peker på kilden sin. Plattformen samler funnene fra energisporet og innholdet fra markedssporet.",
      "This website and the project portal: presentation, document bank, visualisation and a base of figures where every figure points to its source. The platform brings together the findings of the energy track and the content of the market track.",
    ),
    packages: [],
  },
];

// ------------------------------------------------------------------ the plan through the autumn (WORK_PLAN)
const lastWeek = FINAL_PHASE.weeks?.[1] ?? 0;

export const PLAN_HEAD = {
  eyebrow: L("Fremdrift", "Progress"),
  title: L("Fra befaring til masterplan", "From site visit to master plan"),
  text: L(
    `Arbeidet er lagt opp i ${word(WORK_PLAN.length)} faser over ${word(lastWeek)} uker, regnet fra oppstart. Sluttleveransene er en teknisk energirapport, en markeds- og investorrapport, nettsiden, en felles presentasjon og en arbeidsversjon av Knotten masterplan.`,
    `The work is planned in ${word(WORK_PLAN.length, "en")} phases over ${word(lastWeek, "en")} weeks, counted from the start. The final deliverables are a technical energy report, a market and investor report, the website, a joint presentation and a working version of the Knotten master plan.`,
  ),
  src: "arbeidsplan" as SourceId,
  visit: L(
    `Befaringen er et arbeidsmøte på stedet: terreng, utsikt, adkomst og solforhold for det nye feltet, deretter bolighuset, kontorbygget med plass til inntil ${FACT.offices_after} kontorer og lager- og verkstedbygget.`,
    `The site visit is a working meeting on site: terrain, view, access and sun for the new field, then the house, the office building with room for up to ${FACT.offices_after} offices, and the storage and workshop building.`,
  ),
};

/** One line per phase of the work plan, what the three tracks do in it; names and weeks come from WORK_PLAN. */
const PHASE_TEXT: T[] = [
  L("Avklare data, målgrupper og nettsidestruktur. Felles dokumentbank.", "Clarify data, target groups and site structure. A shared document bank."),
  L("Sol, terreng, bygg og mulige energiflater. Bilder, video og notater.", "Sun, terrain, buildings and possible energy surfaces. Photos, video and notes."),
  L("Energibehov, produksjon, lagring og eksisterende bygg. Målgrupper, investorer, referanser og budskap. Første innhold publiseres.", "Energy demand, production, storage and existing buildings. Target groups, investors, references and messages. First content published."),
  L("Alternative energikonsepter. Markeds- og investorvinkling. Teknikk og marked kobles inn i nettsiden.", "Alternative energy concepts. Market and investor angle. Technology and market wired into the website."),
  L("Antakelser og anbefalinger kontrolleres. Budskap spisses. Nettside, dokumentbank og visualisering forbedres.", "Assumptions and recommendations checked. Messages sharpened. Website, document bank and visualisation improved."),
  L("Teknisk energirapport, markeds- og investorrapport, ferdig nettside og felles presentasjon.", "Technical energy report, market and investor report, the finished website and a joint presentation."),
];

/** `when` starts with a capital ("Uke 2 til 4", on its own), `inline` does not ("Research uke 2 til 4"). */
export function projectPhases(lang: Lang): { name: string; when: string; inline: string; text: string }[] {
  return WORK_PLAN.map((p, i) => ({ name: p.name[lang], when: cap(weeks(p.weeks, lang)), inline: weeks(p.weeks, lang), text: PHASE_TEXT[i]?.[lang] ?? "" }));
}

// ------------------------------------------------------------------ what counts as success (the owner's feedback, point 6)
export const SUCCESS_HEAD = {
  eyebrow: L("Forretningsmålene", "The business goals"),
  title: L("Hva som teller som suksess", "What counts as success"),
  text: L(
    "Prosjekteier ba om forretningsmål ved siden av de tekniske. Antall interesseregistreringer vises allerede i portalen; målene for resten settes når nettsiden har vært i bruk en stund.",
    "The project owner asked for business goals beside the technical ones. The number of interest registrations is already shown in the portal; the targets for the rest are set once the website has been in use for a while.",
  ),
};

export const SUCCESS: T[] = [
  L("Antall interesseregistreringer", "Number of interest registrations"),
  L("Konverteringsmål fra interesse til reservasjon", "Conversion targets from interest to reservation"),
  L("Skapt investorinteresse", "Investor interest generated"),
  L("Engasjement på nettsiden", "Engagement on the website"),
  L("Deltakelse fra kommune, partnere og UiA", "Participation from the municipality, partners and UiA"),
];

// ------------------------------------------------------------------ the collaboration with the University of Agder
export const COLLAB = {
  eyebrow: L("Universitetet i Agder", "The University of Agder"),
  title: L("Samarbeidet med studentene", "Working with the students"),
  text: L(
    `Studenter fra Universitetet i Agder arbeider i prosjektet gjennom et internship på ${INTERNSHIP.hours} timer, med oppstart ${INTERNSHIP.start.no}. Spor 1 handler om et helhetlig energikonsept, energihub og distribusjon, føringer i reguleringsplanen og beredskap. Spor 2 handler om profilering, foto og drone, prospekt, digital tilstedeværelse og måling av interesse.`,
    `Students from the University of Agder work on the project through an internship of ${INTERNSHIP.hours} hours, starting ${INTERNSHIP.start.en}. Track 1 covers a complete energy concept, an energy hub and distribution, guidance for the zoning plan and preparedness. Track 2 covers profiling, photo and drone, the prospectus, digital presence and measuring interest.`,
  ),
  team: L("Møt teamet", "Meet the team"),
  contact: L(
    `Spørsmål om prosjektet: ${CONTACT.name}, ${CONTACT.role.no.toLowerCase()} i ${CONTACT.company}, ${CONTACT.email}, ${CONTACT.phone_intl}.`,
    `Questions about the project: ${CONTACT.name}, ${CONTACT.role.en} of ${CONTACT.company}, ${CONTACT.email}, ${CONTACT.phone_intl}.`,
  ),
  sketch: {
    alt: L("Prosjekteiers skisse av veien og tomtene på eiendommen", "The project owner's sketch of the road and the plots on the property"),
    caption: L(
      `Prosjekteiers skisse av vei og tomter på eiendommen gnr ${FACT.gnr} bnr ${FACT.bnr} og ${FACT.bnr_extra}, ${fmt(FACT.parcel_m2)} m².`,
      `The project owner's sketch of road and plots on the properties ${FACT.gnr}/${FACT.bnr} and ${FACT.gnr}/${FACT.bnr_extra}, ${fmt(FACT.parcel_m2, "en")} m².`,
    ),
  },
};

// ------------------------------------------------------------------ the place around the project
const VIGELAND = PHOTOS.vigeland;

export const PLACE = {
  eyebrow: L("Lindesnes", "Lindesnes"),
  title: L("Sørlandet, ytterst", "At the southern tip of Norway"),
  text: L(
    `Vigeland ligger noen få kilometer nordøst for feltet, der Audna møter E39. Tettstedet hadde ${fmt(FACT.vigeland_pop)} innbyggere i ${FACT.vigeland_pop_year} og var kommunesenter fram til 2020. Fylkesvei 460 går sørover herfra, gjennom Spangereid til Lindesnes fyr.`,
    `Vigeland lies a few kilometres north-east of the field, where the Audna meets the E39. The village had ${fmt(FACT.vigeland_pop, "en")} inhabitants in ${FACT.vigeland_pop_year} and was the municipal centre until 2020. County road 460 runs south from here, through Spangereid to Lindesnes lighthouse.`,
  ),
  src: "vigeland" as SourceId,
  maps: L("Se kartene", "See the maps"),
  photos: L("Se bildene", "See the photos"),
  photo: {
    src: VIGELAND.src,
    w: VIGELAND.w,
    h: VIGELAND.h,
    alt: L(VIGELAND.alt, "Vigeland seen from Fløyheia, with the Audna running through the centre"),
    caption: L(VIGELAND.caption, "Vigeland seen from Fløyheia, with the Audna running through the centre"),
    credit: VIGELAND.credit,
    license: VIGELAND.license,
    url: VIGELAND.url,
    by: L("Foto", "Photo"),
  },
};
