import { CONTACT, FACT, INTERNSHIP, fmt, type Lang } from "@/lib/facts";
import { RELEASE_NOTE } from "./status";

/**
 * The questions people ask about Knotten, answered only from the project's facts. Both designs' status pages
 * show them (with FAQPage data for search engines), and Knotten AI can answer from the same list. The answer
 * to "for sale?" is the administrator's status line, so the two never disagree.
 */
export type FaqItem = { id: string; q: string; a: string; link?: { href: string; label: string } };

export type FaqContext = {
  /** The status line from the settings (release note) in this language. */
  status?: string;
  /** Where the "Om utbygger" block is on this page, and where the interest form is, in this design. */
  aboutHref: string;
  interestHref: string;
  privacyHref: string;
};

export const FAQ_IDS = ["for-sale", "when", "plot-or-house", "price", "sea-view", "zoning-plan", "interest", "who"] as const;

export function faq(lang: Lang, ctx: FaqContext): FaqItem[] {
  const no = lang === "no";
  const status = (ctx.status || RELEASE_NOTE[lang]).trim();
  return [
    {
      id: "for-sale",
      q: no ? "Er tomtene til salgs?" : "Are the plots for sale?",
      a: status,
      link: { href: ctx.interestHref, label: no ? "Meld interesse" : "Register interest" },
    },
    {
      id: "when",
      q: no ? "Når kan jeg kjøpe?" : "When can I buy?",
      a: no
        ? "Det er ikke satt noen dato for salgsstart, byggestart eller innflytting. Prosjektet startet før reguleringsplanen, og reguleringsplanen er ikke vedtatt ennå. Tomtegrenser og priser avhenger av den."
        : "No date is set for the start of sales, building or moving in. The project started before the zoning plan, and the zoning plan is not adopted yet. Plot boundaries and prices depend on it.",
    },
    {
      id: "plot-or-house",
      q: no ? "Kjøper jeg tomt eller hus?" : "Do I buy a plot or a house?",
      a: no
        ? "Det er ikke avklart ennå om tomtene selges alene eller med hus. Huset i 3D-modellen er en illustrasjon av hvordan én hustype kan tilpasses terrenget, ikke et tilbud."
        : "It is not settled yet whether the plots are sold on their own or with a house. The house in the 3D model illustrates how one house type can adapt to the ground; it is not an offer.",
    },
    {
      id: "price",
      q: no ? "Hva koster en tomt?" : "What does a plot cost?",
      a: no
        ? "Ingen priser er satt ennå, verken for tomter eller boliger. Prisene oppgis når tomtene legges ut for salg."
        : "No prices are set yet, for plots or for homes. Prices are given when the plots are put up for sale.",
    },
    {
      id: "sea-view",
      q: no ? "Får alle tomtene sjøutsikt?" : "Will every plot have a sea view?",
      a: no
        ? `Ønsket er sjøutsikt fra alle tomtene, men prosjekteier sier at det ikke er sikkert at det går fra alle. I modellens foreløpige utlegg ser alle de ${FACT.plots} tomtene vann, og ${FACT.open_sea_plots} ser åpent hav, regnet med nabohusene stående. Utlegget er et beregnet forslag, ikke en vedtatt plan.`
        : `The aim is a sea view from every plot, but the project owner says it is not certain every plot will get one. In the model's provisional layout all ${FACT.plots} plots see water and ${FACT.open_sea_plots} see open sea, computed with the neighbouring houses in place. The layout is a computed proposal, not an adopted plan.`,
    },
    {
      id: "zoning-plan",
      q: no ? "Hva er en reguleringsplan?" : "What is a zoning plan?",
      a: no
        ? "En reguleringsplan er en plan etter plan- og bygningsloven som bestemmer hvordan et område kan brukes og bygges ut, for eksempel hvor hus og veier kan ligge. Kommunen vedtar den etter at planforslaget har vært ute på høring. For Knotten er reguleringsplanen ikke vedtatt ennå."
        : "A zoning plan (reguleringsplan) is a plan under the Norwegian Planning and Building Act that sets how an area may be used and built, for example where houses and roads may go. The municipality adopts it after the proposal has been out for consultation. For Knotten the zoning plan is not adopted yet.",
    },
    {
      id: "interest",
      q: no ? "Hva skjer når jeg melder interesse?" : "What happens when I register interest?",
      a: no
        ? "Prosjekteier får henvendelsen og tar kontakt med deg. Opplysningene brukes bare til å svare deg om Knotten. Nyheter og tomtevarsler får du bare hvis du krysser av for det, og du kan melde deg av når som helst. Henvendelsen slettes 24 måneder etter siste kontakt."
        : "The project owner receives your registration and gets in touch with you. Your details are used only to answer you about Knotten. You get news and plot alerts only if you tick the box for them, and you can unsubscribe at any time. The registration is deleted 24 months after the last contact.",
      link: { href: ctx.privacyHref, label: no ? "Personvern" : "Privacy" },
    },
    {
      id: "who",
      q: no ? "Hvem står bak?" : "Who is behind it?",
      a: no
        ? `${CONTACT.company}, med daglig leder ${CONTACT.name} som prosjekteier. Prosjektet samarbeider med Universitetet i Agder gjennom et internship på ${fmt(INTERNSHIP.hours)} timer, med studenter i energi og teknikk og i marked og profilering.`
        : `${CONTACT.company}, with its managing director ${CONTACT.name} as project owner. The project works with the University of Agder through an internship of ${fmt(INTERNSHIP.hours, "en")} hours, with students in energy and technology and in market and profile.`,
      link: { href: ctx.aboutHref, label: no ? "Om utbygger" : "About the developer" },
    },
  ];
}

/** FAQPage structured data for search engines, from the same questions and answers. */
export function faqJsonLd(items: FaqItem[], lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang === "no" ? "nb" : "en",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}
