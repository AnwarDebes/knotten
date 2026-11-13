/**
 * The configurator's words, in Norwegian and English, for both designs: Klassisk and Moderne say the same thing
 * about the same choice, each in its own look. Numbers are formatted with lib/facts, so a figure reads the same
 * everywhere on the site.
 */
import { CONTACT, fmt, fmtRound } from "@/lib/facts";
import { leadErrorText } from "@/lib/forms";
import type { EnergyEstimate, Lang } from "@/lib/configurator/types";
import type { PlotStatus } from "./model";

export function kr(n: number, lang: Lang): string {
  return `${fmt(Math.round(n), lang)} kr`;
}

export function copy(lang: Lang) {
  const no = lang === "no";
  return {
    title: no ? "Sett sammen huset" : "Configure your house",
    crumb: no ? "Sett sammen huset" : "Configure your house",
    lede: no
      ? "Velg tomt og si hvordan du vil ha huset. Valgene vises på huset i modellen, og energitallene regnes for huset på tomten. Alt er foreløpig: huset i modellen er et eksempelhus, en illustrasjon."
      : "Choose a plot and say how you would like the house. The choices show on the house in the model, and the energy figures are worked out for the house on its plot. Everything is provisional: the house in the model is an example house, an illustration.",

    steps: no ? "Stegene" : "The steps",
    stepOf: (n: number, total: number) => (no ? `Steg ${n} av ${total}` : `Step ${n} of ${total}`),
    next: (label: string) => (no ? `Neste: ${label}` : `Next: ${label}`),
    back: no ? "Tilbake" : "Back",
    backTo: (label: string) => (no ? `Tilbake: ${label}` : `Back: ${label}`),
    toSummary: no ? "Til oppsummeringen" : "To the summary",

    included: no ? "Inkludert" : "Included",
    option: no ? "Tilvalg" : "Option",
    onRequest: no ? "Pris på forespørsel" : "Price on request",
    plus: (v: string) => `+ ${v}`,
    picks: (n: number) => (no ? `${n} tilvalg` : n === 1 ? "1 option" : `${n} options`),
    picksHere: (n: number) => (no ? `${n} tilvalg i dette steget` : n === 1 ? "1 option in this step" : `${n} options in this step`),
    resetStep: no ? "Tilbake til standard" : "Back to standard",

    // the plot step
    choosePlot: no ? "Velg tomt" : "Choose a plot",
    rowFilter: no ? "Rekke" : "Row",
    allRows: no ? "Alle" : "All",
    rowName: (r: string) => (no ? `Rekke ${r}` : `Row ${r}`),
    rowLower: (r: string) => (no ? `rekke ${r}` : `row ${r}`),
    sort: no ? "Sorter" : "Sort",
    sorts: { nr: no ? "Tomtenummer" : "Plot number", sol: no ? "Mest vintersol" : "Most winter sun", sjo: no ? "Mest sjø i sikt" : "Most water in view" },
    plotName: (n: number) => (no ? `Tomt ${n}` : `Plot ${n}`),
    plotsShown: (n: number) => (no ? `${n} tomter` : `${n} plots`),
    metres: (m: number) => (no ? `${m} moh.` : `${m} m a.s.l.`),
    sunDec: no ? "sol 21. des." : "sun 21 Dec",
    sunDecLong: no ? "Sol 21. desember" : "Sun 21 December",
    hours: (h: number) => (no ? `${fmt(h, lang, 1)} t` : `${fmt(h, lang, 1)} h`),
    seaInView: no ? "sjø i sikt" : "water in view",
    seaInViewLong: no ? "Sjø i sikt" : "Water in view",
    openSea: no ? "Åpent hav" : "Open sea",
    openSeaDeg: (d: number) => (no ? `åpent hav ${d}°` : `open sea ${d}°`),
    noOpenSea: no ? "ikke åpent hav" : "no open sea",
    lowerFloor: no ? "Underetasje" : "Lower floor",
    lowerYes: no ? "Underetasje mulig" : "Lower floor possible",
    lowerNo: no ? "Ingen underetasje" : "No lower floor",
    status: (s: PlotStatus) => ({ unreleased: no ? "ikke sluppet" : "unreleased", available: no ? "ledig" : "available", reserved: no ? "reservert" : "reserved", sold: no ? "solgt" : "sold" })[s],
    plotMethod: no
      ? "Sol: terrengskygge med feltet ryddet. Sjø: siktlinje til vann; åpent hav er vann lenger unna enn 7 km. Beregnet 2026-09-30 for det foreløpige utlegget v6."
      : "Sun: terrain shading with the field cleared. Water: line of sight to water; open sea is water beyond 7 km. Computed 2026-09-30 for the provisional layout v6.",

    yourPlot: no ? "Din tomt" : "Your plot",
    changePlot: no ? "Bytt tomt" : "Change plot",
    noPlot: no ? "Ingen tomt valgt ennå." : "No plot chosen yet.",
    noPlotHint: no ? "Underetasjen og energitallene avhenger av tomten." : "The lower floor and the energy figures depend on the plot.",

    // rules
    lowerNeedsPlot: no ? "Velg en tomt først: underetasje går bare der terrenget gir plass." : "Choose a plot first: a lower floor only works where the ground leaves room.",
    lowerNotHere: (n: number) => (no ? `Tomt ${n} har ikke plass til underetasje i modellen.` : `Plot ${n} has no room for a lower floor in the model.`),
    lowerDropped: (n: number) => (no ? `Valget for underetasjen er tatt ut, fordi tomt ${n} ikke har plass til underetasje.` : `The lower floor choice was removed, because plot ${n} has no room for a lower floor.`),
    notApplicable: no ? "Ikke aktuelt på tomten" : "Not possible on this plot",
    modelColourOn: (name: string, n: number) => (no ? `${name} på tomt ${n}` : `${name} on plot ${n}`),
    modelColourVaries: no ? "Hvert hus har sin farge i modellen" : "Each house has its own colour in the model",

    // included in every house
    includedTitle: no ? "Inkludert i alle hus" : "Included in every house",
    includedIntro: no ? "Dette følger med i alle husene og er ikke et valg." : "These come with every house and are not a choice.",

    // energy
    energyTitle: no ? "Energi for huset" : "Energy for the house",
    provisional: no ? "foreløpig" : "provisional",
    solar: no ? "Solceller" : "Solar panels",
    production: no ? "Solproduksjon" : "Solar production",
    perYear: no ? "kWh i året" : "kWh a year",
    selfSufficiency: no ? "Selvforsyning" : "Self-sufficiency",
    selfSufficiencyNote: no ? "av husets strømbruk" : "of the house's power use",
    costYear: no ? "Strøm per år" : "Electricity per year",
    referenceCost: (v: string) => (no ? `Uten solceller, batteri og varmepumpe: ${v}` : `Without solar, battery and heat pump: ${v}`),
    outage: no ? "Ved strømbrudd" : "In a power cut",
    outageHours: (h: number) => (no ? `${fmt(Math.round(h), lang)} timer` : `${fmt(Math.round(h), lang)} hours`),
    outageNote: no ? "om vinteren, med valgt reserve" : "in winter, with the chosen backup",
    method: no ? "Slik er det regnet" : "How it is calculated",
    calculating: no ? "Regner" : "Calculating",
    energyNoPlot: no ? "Velg tomt, så regnes tallene for huset på den tomten." : "Choose a plot, and the figures are worked out for the house on that plot.",
    priceModel: no ? "Strømpris i beregningen" : "Power price in the calculation",
    priceModels: { budget: no ? "Energiregnskapets pris" : "The energy budget's price", spot2025: no ? "Spotpris NO2 2025" : "Spot price NO2 2025" },
    showEnergy: no ? "Vis energitallene" : "Show the energy figures",
    hideEnergy: no ? "Skjul energitallene" : "Hide the energy figures",

    // the 3D view
    viewRegion: no ? "Huset i 3D-modellen" : "The house in the 3D model",
    sideRegion: no ? "Modellen og energitallene" : "The model and the energy figures",
    open3d: no ? "Vis huset i 3D" : "Show the house in 3D",
    open3dNote: no ? "Modellen lastes først når du ber om den. Valgene virker uten." : "The model loads only when you ask for it. The choices work without it.",
    loading3d: no ? "Laster modellen" : "Loading the model",
    failed3d: no ? "3D er ikke tilgjengelig her" : "3D is not available here",
    failed3dText: no ? "Valgene virker likevel, og bildet viser feltet i modellen." : "The choices still work, and the picture shows the field in the model.",
    illustration: no ? "Illustrasjon" : "Illustration",
    posterAlt: no ? "Boligfeltet i modellen, med eksempelhusene på tomtene. Illustrasjon." : "The housing field in the model, with the example houses on the plots. Illustration.",
    viewLabel: no ? "Visning" : "View",
    views: { exterior: no ? "Huset" : "The house", plot: no ? "Tomten" : "The plot", interior: no ? "Inne" : "Inside" },

    // draft
    draftFound: (what: string) => (no ? `Du har et oppsett fra sist: ${what}.` : `You have a setup from last time: ${what}.`),
    draftContinue: no ? "Fortsett der du slapp" : "Continue where you left off",
    draftDiscard: no ? "Start på nytt" : "Start afresh",

    // summary
    summaryChoices: no ? "Valgene dine" : "Your choices",
    house: no ? "Huset, grunnpris" : "The house, base price",
    plot: no ? "Tomten" : "The plot",
    picksTotal: no ? "Tilvalg" : "Options",
    knownSum: no ? "Sum av kjente priser" : "Sum of known prices",
    restOnRequest: no ? "Resten gis på forespørsel." : "The rest is given on request.",
    allOnRequest: no ? "Prisene gis på forespørsel." : "The prices are given on request.",
    noPrices: no ? "Prisene er ikke satt ennå." : "The prices are not set yet.",
    honesty: [
      no ? "Dette er en illustrasjon, ikke et tilbud. Huset i modellen er et eksempelhus: størrelse, planløsning, leverandør og byggestandard er ikke bestemt." : "This is an illustration, not an offer. The house in the model is an example house: size, plan, supplier and building standard are not decided.",
      no ? "Pris og levering avtales i en kontrakt. Valgene her er ønsker du gir videre til Sigve Simonsen AS." : "Price and delivery are agreed in a contract. The choices here are wishes you pass on to Sigve Simonsen AS.",
      no ? "Fargene er illustrasjoner, vist i modellens lys. Endelige farger avklares mot reguleringsplanen." : "The colours are illustrations, shown in the model's light. Final colours are settled against the zoning plan.",
    ],

    // actions
    share: no ? "Del lenke" : "Share link",
    copied: no ? "Lenken er kopiert." : "The link is copied.",
    copyBelow: no ? "Kopier lenken:" : "Copy the link:",
    linkLabel: no ? "Lenke til oppsettet" : "Link to the setup",
    print: no ? "Skriv ut" : "Print",
    save: no ? "Lagre" : "Save",
    saving: no ? "Lagrer" : "Saving",
    saveAgain: no ? "Lagre endringene" : "Save the changes",
    savedAs: (name: string) => (no ? `Lagret som «${name}».` : `Saved as “${name}”.`),
    savedWhere: no ? "Se lagrede oppsett på Min side" : "See saved setups on My page",
    saveName: (n: number | null) => (n ? (no ? `Huset på tomt ${n}` : `The house on plot ${n}`) : no ? "Mitt hus på Knotten" : "My house at Knotten"),
    saveLogin: no ? "Logg inn for å lagre oppsettet. Har du ikke konto, kan du opprette en." : "Log in to save the setup. No account yet? You can create one.",
    login: no ? "Logg inn" : "Log in",
    signup: no ? "Opprett konto" : "Create an account",
    saveUnavailable: no ? "Lagring er ikke tilgjengelig akkurat nå. Bruk Del lenke for å ta vare på oppsettet." : "Saving is not available right now. Use Share link to keep the setup.",
    saveFailed: no ? "Det gikk ikke å lagre. Prøv igjen om litt." : "It could not be saved. Try again shortly.",

    // send
    send: no ? "Send til Sigve Simonsen AS" : "Send to Sigve Simonsen AS",
    sendIntro: no
      ? "Oppsettet sendes med kontaktopplysningene dine, så tar Sigve Simonsen AS kontakt. Det er ikke en bestilling."
      : "The setup is sent with your contact details, and Sigve Simonsen AS gets in touch. It is not an order.",
    name: no ? "Navn" : "Name",
    email: no ? "E-post" : "Email",
    phone: no ? "Telefon (valgfritt)" : "Phone (optional)",
    message: no ? "Melding (valgfritt)" : "Message (optional)",
    messageHint: no ? "Spørsmål, ønsker eller når det passer å bli kontaktet." : "Questions, wishes or when it suits you to be contacted.",
    optional: no ? "Valgfritt" : "Optional",
    privacy: no ? "personvernerklæringen" : "privacy statement",
    sendButton: no ? "Send oppsettet" : "Send the setup",
    sending: no ? "Sender" : "Sending",
    sentTitle: no ? "Sendt." : "Sent.",
    sentText: no ? "Takk. Sigve Simonsen AS har fått oppsettet ditt og tar kontakt." : "Thank you. Sigve Simonsen AS has your setup and will get in touch.",
    sendError: no ? `Det gikk ikke å sende akkurat nå. Prøv igjen om litt, eller skriv til ${CONTACT.email}.` : `It could not be sent just now. Try again shortly, or write to ${CONTACT.email}.`,
    sendInvalidEmail: no ? "Sjekk e-postadressen." : "Check the email address.",
    sendTooMany: no ? "Mange meldinger fra denne adressen på kort tid. Vent noen minutter og prøv igjen." : "Many messages from this address in a short time. Wait a few minutes and try again.",
    sendTooFast: no ? "Skjemaet ble sendt veldig raskt. Vent et øyeblikk og prøv igjen." : "The form was sent very quickly. Wait a moment and try again.",
    // the same words as the interest form (lib/forms.ts)
    sendCaptcha: leadErrorText("captcha", lang),

    // print
    printTitle: no ? "Huset mitt på Knotten" : "My house at Knotten",
    printed: (date: string) => (no ? `Skrevet ut ${date}` : `Printed ${date}`),
    contactLine: `${CONTACT.company}, ${CONTACT.email}, ${CONTACT.phone_intl}`,
  };
}

export type Copy = ReturnType<typeof copy>;

/** The energy figures in one sentence, for the screen reader's live message and the collapsed panel. */
export function energyLine(e: EnergyEstimate, lang: Lang): string {
  const no = lang === "no";
  const parts = [
    `${no ? "Solceller" : "Solar panels"} ${fmt(e.pvKwp, lang, 1)} kWp`,
    `${no ? "solproduksjon" : "solar production"} ${fmtRound(e.pvKwh, 100, lang)} ${no ? "kWh i året" : "kWh a year"}`,
    `${no ? "selvforsyning" : "self-sufficiency"} ${fmt(e.selfSufficiencyPct, lang)} %`,
  ];
  if (e.costNok !== null) parts.push(`${no ? "strøm" : "electricity"} ${kr(e.costNok, lang)} ${no ? "i året" : "a year"}`);
  if (e.outageHours !== null) parts.push(`${no ? "strøm ved strømbrudd i" : "power in a power cut for"} ${fmt(Math.round(e.outageHours), lang)} ${no ? "timer" : "hours"}`);
  return `${parts.join(", ")}. ${no ? "Foreløpig." : "Provisional."}`;
}
