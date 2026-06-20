/**
 * Default timeline and FAQ content, shown until the owner adds entries through
 * the admin content layer. Factual answers carry an inline source; forward
 * looking items carry a forbehold. Real fremdrift dates are unknown placeholders
 * (see docs/INPUTS-NEEDED.md), so stages use phase labels, not promised dates.
 */

export type TimelineDefault = {
  key: string;
  labelNo: string;
  labelEn: string;
  dateOrStage: string;
  isCurrent: boolean;
};

export const DEFAULT_TIMELINE: TimelineDefault[] = [
  {
    key: "ide",
    labelNo: "Idé og konsept",
    labelEn: "Idea and concept",
    dateOrStage: "Ferdig",
    isCurrent: false,
  },
  {
    key: "regulering",
    labelNo: "Regulering",
    labelEn: "Zoning",
    dateOrStage: "Pågår (dato bekreftes)",
    isCurrent: true,
  },
  {
    key: "grunnarbeid",
    labelNo: "Grunnarbeid og infrastruktur",
    labelEn: "Groundwork and infrastructure",
    dateOrStage: "Planlagt (dato bekreftes)",
    isCurrent: false,
  },
  {
    key: "bygging",
    labelNo: "Bygging",
    labelEn: "Construction",
    dateOrStage: "Planlagt (dato bekreftes)",
    isCurrent: false,
  },
  {
    key: "innflytting",
    labelNo: "Innflytting",
    labelEn: "Move-in",
    dateOrStage: "Planlagt (dato bekreftes)",
    isCurrent: false,
  },
];

export type FaqDefault = {
  key: string;
  questionNo: string;
  questionEn: string;
  answerNo: string;
  answerEn: string;
};

export const DEFAULT_FAQ: FaqDefault[] = [
  {
    key: "energideling",
    questionNo: "Hvordan fungerer energideling?",
    questionEn: "How does energy sharing work?",
    answerNo:
      "Energideling på samme eiendom (gnr/bnr) har vært tillatt siden 1. oktober 2023, med inntil 1 MW (AC) per eiendom og en fast eller lik fordelingsnøkkel. Fra 1. januar 2026 er ordningen utvidet til å gjelde innenfor et næringsområde. (Kilde: NVE/regjeringen, kontrollert juni 2026.)",
    answerEn:
      "Energy sharing on the same property (gnr/bnr) has been allowed since 1 October 2023, with up to 1 MW (AC) per property and a fixed or equal distribution key. From 1 January 2026 it is extended to within a business area. (Source: NVE/regjeringen, checked June 2026.)",
  },
  {
    key: "plusskunde",
    questionNo: "Hva betyr det å være plusskunde?",
    questionEn: "What does being a prosumer mean?",
    answerNo:
      "Som plusskunde betaler du verken nettleie eller avgifter på strøm du produserer og bruker selv bak egen måler, og du kan mate inntil 100 kW ut på nettet. (Kilde: NVE, kontrollert juni 2026.)",
    answerEn:
      "As a prosumer you pay neither grid rent nor levies on power you produce and use yourself behind your own meter, and you can feed up to 100 kW back to the grid. (Source: NVE, checked June 2026.)",
  },
  {
    key: "stotte",
    questionNo: "Hva med strømstøtte og Norgespris?",
    questionEn: "What about electricity support and Norgespris?",
    answerNo:
      "Ordinær strømstøtte dekker 90 prosent av spotprisen over 77 øre/kWh eks. mva. (96,25 inkl.), opptil 5 000 kWh/måned, vedtatt ut 31. desember 2029. Alternativt kan du velge Norgespris, en fast pris på 50 øre/kWh inkl. mva., bundet ut 2026. Se verktøyet Din strømtrygghet. (Kilde: regjeringen.no, kontrollert juni 2026.)",
    answerEn:
      "Ordinary electricity support covers 90 percent of the spot price above 77 øre/kWh excl. VAT (96.25 incl.), up to 5,000 kWh/month, decided through 31 December 2029. Alternatively you can choose Norgespris, a fixed 50 øre/kWh incl. VAT, bound through 2026. See the Your power-price security tool. (Source: regjeringen.no, checked June 2026.)",
  },
  {
    key: "batteri",
    questionNo: "Hvem eier og vedlikeholder fellesbatteriet?",
    questionEn: "Who owns and maintains the shared battery?",
    answerNo:
      "Eier- og driftsmodellen for en eventuell felles energibase er under utredning og avklares før salgsstart. Dette er et forbehold, ikke en endelig løsning.",
    answerEn:
      "The ownership and operating model for any shared energy base is being assessed and will be settled before sales launch. This is a reservation, not a final arrangement.",
  },
  {
    key: "salg",
    questionNo: "Hva skjer hvis jeg selger boligen?",
    questionEn: "What happens if I sell the home?",
    answerNo:
      "Energiløsningen er knyttet til eiendommen og følger normalt med ved et salg. De konkrete vilkårene avklares i avtaleverket før salgsstart. Dette er et forbehold.",
    answerEn:
      "The energy solution is tied to the property and normally transfers with a sale. The concrete terms are settled in the contracts before sales launch. This is a reservation.",
  },
];
