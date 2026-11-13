import { PRIVACY_VERSION } from "@/lib/consent";
import { CONTACT, dateLong, type Lang } from "@/lib/facts";
import type { CompanyFacts } from "@/lib/store";

/**
 * The privacy statement, once, in both languages. Both designs' privacy pages render it in their own look.
 * What it says depends on what is switched on (email, spam protection, the language model behind Knotten AI)
 * and on the company details the administrator has entered; a detail that is not entered is left out.
 * Change the substance: bump PRIVACY_VERSION in src/lib/consent.ts, so consents record the version they were given under.
 */
export type Inline = string | { href: string; text: string };
export type Block = { kind: "p"; parts: Inline[] } | { kind: "list"; items: Inline[][] };
export type Section = { id: string; title: string; blocks: Block[] };
export type Statement = { title: string; lede: string; version: string; updated: string; sections: Section[] };

export type PrivacyContext = {
  company: CompanyFacts;
  /** The organisation number as shown ("123 456 789"), or "" until it is entered. */
  orgDisplay: string;
  /** Knotten AI hands questions the data does not cover to a language model. */
  modelOn: boolean;
  /** The service that sends the site's email, or null when no email is sent. */
  mailProvider: string | null;
  /** Spam protection on the forms (Cloudflare Turnstile) is switched on. */
  turnstileOn: boolean;
  /** Min side (export and deletion) in this design. */
  minSideHref: string;
};

/**
 * Which email service and spam protection are switched on, read from the server's settings. Whether Knotten AI
 * uses a language model comes from the assistant itself (MODEL_ON in lib/server/assistant.ts).
 */
export function privacySwitches(env: Record<string, string | undefined> = process.env) {
  const mailProvider = env.RESEND_API_KEY && env.MAIL_FROM ? "Resend" : env.SMTP_HOST ? env.SMTP_HOST : null;
  const turnstileOn = !!(env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  return { mailProvider, turnstileOn };
}

const p = (...parts: Inline[]): Block => ({ kind: "p", parts });
const list = (...items: Inline[][]): Block => ({ kind: "list", items });

export function privacyStatement(lang: Lang, c: PrivacyContext): Statement {
  const no = lang === "no";
  const email = c.company.email || CONTACT.email;
  // a phone number never breaks across lines
  const phone = (c.company.phone || CONTACT.phone_intl).replace(/ /g, "\u00a0");
  const mail: Inline = { href: `mailto:${email}`, text: email };
  const who = [
    CONTACT.company,
    c.orgDisplay ? (no ? `org.nr. ${c.orgDisplay}` : `organisation number ${c.orgDisplay}`) : "",
    c.company.postal_address,
  ].filter(Boolean).join(", ");

  const processors: Inline[][] = [
    [no ? "Vercel: drift av nettsiden og prosjektportalen." : "Vercel: hosting of the website and the project portal."],
    [no ? "Upstash: databasen der henvendelser, kontoer og innstillinger lagres." : "Upstash: the database that stores registrations, accounts and settings."],
    [no ? "Vercel Blob: lagring av dokumenter i prosjektportalen." : "Vercel Blob: storage of documents in the project portal."],
  ];
  if (c.mailProvider) processors.push([no ? `${c.mailProvider}: utsending av e-post fra nettsiden.` : `${c.mailProvider}: sending the website's email.`]);
  if (c.turnstileOn) processors.push([no ? "Cloudflare Turnstile: vern mot spam i skjemaene." : "Cloudflare Turnstile: spam protection on the forms."]);
  if (c.modelOn) processors.push([no ? "Anthropic: språkmodellen som skriver svar fra Knotten AI når prosjektets egne data ikke dekker spørsmålet. Bare teksten i spørsmålet sendes, ikke hvem du er; skriv derfor ikke personopplysninger i spørsmålet." : "Anthropic: the language model that writes Knotten AI's answer when the project's own data does not cover the question. Only the text of the question is sent, not who you are; so do not write personal details in the question."]);

  const sections: Section[] = [
    {
      id: "ansvarlig",
      title: no ? "Hvem som er ansvarlig" : "Who is responsible",
      blocks: [
        p(no ? `${who} er behandlingsansvarlig for personopplysningene som samles inn på denne nettsiden og i prosjektportalen.` : `${who} is the controller of the personal data collected on this website and in the project portal.`),
        p(no ? "Spørsmål om personvern sender du til " : "Send questions about privacy to ", mail, no ? `, eller ring ${phone}.` : `, or call ${phone}.`),
      ],
    },
    {
      id: "formal",
      title: no ? "Hva vi bruker opplysningene til, og grunnlaget" : "What we use the data for, and the legal basis",
      blocks: [
        list(
          [no ? "Interessemeldinger, og hus du setter sammen i konfiguratoren og sender oss: navn, e-post, eventuelt telefon, hva du er interessert i, tomtene du følger, husets valg (tomt, planløsning, fasade, energi og resten) og meldingen din. Et hus du sender, blir en interessemelding med huset på. Vi bruker dem til å svare deg og følge opp henvendelsen. Grunnlaget er at du selv ber om det (personvernforordningen artikkel 6 nr. 1 bokstav b)." : "Interest registrations, and houses you configure and send us: name, email, phone if given, what you are interested in, the plots you follow, the house's choices (plot, plan, facade, energy and the rest) and your message. A house you send becomes an interest registration with the house on it. We use them to answer you and follow up. The basis is that you ask us to (GDPR Article 6(1)(b))."],
          [no ? "Nyheter og tomtevarsler på e-post, bare hvis du krysser av for det. Grunnlaget er samtykket ditt (artikkel 6 nr. 1 bokstav a), og du kan trekke det tilbake når som helst." : "News and plot alerts by email, only if you tick the box for them. The basis is your consent (Article 6(1)(a)), which you can withdraw at any time."],
          [no ? "Kontakt om investering, og bruk av opplysningene uten navn i forskningssamarbeidet med Universitetet i Agder, bare hvis du krysser av for det. Grunnlaget er samtykket ditt." : "Contact about investing, and use of your details without your name in the research collaboration with the University of Agder, only if you tick the box for it. The basis is your consent."],
          [no ? "Kontoer på Min side og i prosjektportalen: navn, e-post, passordet (bare som en kryptografisk hash) og det du selv legger inn (se kjøperkontoen under). Grunnlaget er avtalen med deg om kontoen (artikkel 6 nr. 1 bokstav b)." : "Accounts on My page and in the project portal: name, email, the password (only as a cryptographic hash) and what you add yourself (see the buyer account below). The basis is the agreement with you about the account (Article 6(1)(b))."],
          [no ? "Besøksstatistikk uten informasjonskapsler (se under). Grunnlaget er vår berettigede interesse i å vite hvordan nettsiden brukes (artikkel 6 nr. 1 bokstav f)." : "Visitor statistics without cookies (see below). The basis is our legitimate interest in knowing how the website is used (Article 6(1)(f))."],
          [no ? "Logger over innlogginger, kontoendringer og nedlastinger av dokumenter, for å holde portalen sikker. Grunnlaget er berettiget interesse." : "Logs of logins, account changes and document downloads, to keep the portal secure. The basis is legitimate interest."],
          [no ? `Spørsmål til Knotten AI, i både det klassiske og det moderne utseendet: vi teller hvilke temaer det spørres om, og tar vare på spørsmål den ikke kunne svare på, uten e-postadresser, telefonnumre eller annet som peker på deg.${c.modelOn ? " Spørsmål prosjektets data ikke dekker, sendes til en språkmodell for å lage svaret (se leverandørene under)." : ""} Grunnlaget er berettiget interesse.` : `Questions to Knotten AI, in both the classic and the modern appearance: we count which topics are asked about, and keep the questions it could not answer, without email addresses, phone numbers or anything else that points to you.${c.modelOn ? " Questions the project's data does not cover are sent to a language model to write the answer (see the suppliers below)." : ""} The basis is legitimate interest.`],
        ),
      ],
    },
    {
      id: "lagring",
      title: no ? "Hvor lenge vi lagrer" : "How long we keep it",
      blocks: [
        list(
          [no ? "Interessemeldinger: 24 måneder etter siste kontakt, så slettes de." : "Interest registrations: 24 months after the last contact, then they are deleted."],
          [no ? "Hus sendt fra konfiguratoren: like lenge som interessemeldingen de hører til." : "Houses sent from the configurator: as long as the interest registration they belong to."],
          [no ? "Kontoer som venter på at e-postadressen bekreftes: slettes etter 7 dager, med tomtene som følges, valgene om varsler og husene som er lagret." : "Accounts waiting for the email address to be confirmed: deleted after 7 days, with the plots followed, the choices about alerts and the saved houses."],
          [no ? "Kontoer: til du sletter kontoen eller ber oss gjøre det. Det som er lagret på Min side, slettes med kontoen." : "Accounts: until you delete the account or ask us to. What is kept on My page is deleted with the account."],
          [no ? "Logger: sikkerhetsloggen og nedlastingsloggen beholder de siste 500 hendelsene, og spørsmålene Knotten AI ikke kunne svare på, de siste 200. Eldre slettes fortløpende." : "Logs: the security log and the download log keep the latest 500 events, and the questions Knotten AI could not answer, the latest 200. Older entries are deleted as new ones arrive."],
          [no ? "Besøksstatistikk: bare antall per dag. Kodene som skiller besøkende fra hverandre, slettes etter to døgn." : "Visitor statistics: only counts per day. The codes that tell visitors apart are deleted after two days."],
        ),
      ],
    },
    {
      id: "kjoperkonto",
      title: no ? "Kjøperkonto og Min side" : "Buyer accounts and My page",
      blocks: [
        p(no ? "Vil du kjøpe bolig, kan du opprette en konto selv. Med den kan du følge tomter, lagre hus du setter sammen og velge hva vi kan sende deg. Dette lagres:" : "If you want to buy a home, you can create an account yourself. With it you can follow plots, save houses you configure and choose what we may send you. This is kept:"),
        list(
          [no ? "Når du oppretter kontoen: navn, e-post, eventuelt telefon, hva du er interessert i og tomtene du vil følge. Registreringen blir også en interessemelding hos prosjekteier, så vi kan følge deg opp. Vi sender ingenting til en e-postadresse som ikke er bekreftet." : "When you create the account: name, email, phone if given, what you are interested in and the plots you want to follow. The sign-up also becomes an interest registration with the project owner, so we can follow you up. We send nothing to an email address that is not confirmed."],
          [no ? "Tomtene du følger. Tomtevarsler og nyheter på e-post får du bare hvis du slår dem på, og hver endring lagres med tidspunkt og hvilken versjon av denne erklæringen den ble gjort under." : "The plots you follow. You get plot alerts and news by email only if you switch them on, and each change is kept with the time and the version of this statement it was made under."],
          [no ? "Husene du lagrer fra konfiguratoren, med valgene dine. De vises bare for deg, på Min side." : "The houses you save from the configurator, with your choices. Only you see them, on My page."],
        ),
        p(no ? "På " : "On ", { href: c.minSideHref, text: no ? "Min side" : "My page" }, no ? " kan du når som helst laste ned alt vi har lagret om deg som én fil, endre e-post og passord, og slette kontoen. Sletter du kontoen, forsvinner tomtene du følger, husene du har lagret og valgene dine med den, og du velger selv om interessemeldingene dine skal slettes samtidig. I sikkerhetsloggen byttes e-postadressen ut med en kode som ikke peker på deg." : " you can at any time download everything we keep about you as one file, change your email and password, and delete the account. If you delete the account, the plots you follow, the houses you saved and your choices go with it, and you decide whether your interest registrations are deleted at the same time. In the security log, the email address is replaced by a code that does not point to you."),
      ],
    },
    {
      id: "leverandorer",
      title: no ? "Hvem som behandler opplysningene for oss" : "Who processes the data for us",
      blocks: [p(no ? "Disse leverandørene behandler opplysninger på våre vegne, bare for å levere tjenesten sin til oss:" : "These suppliers process data on our behalf, only to provide their service to us:"), list(...processors)],
    },
    {
      id: "rettigheter",
      title: no ? "Rettighetene dine" : "Your rights",
      blocks: [
        p(no ? "Du har rett til innsyn i opplysningene vi har om deg, og til å få dem rettet, slettet eller utlevert i et maskinlesbart format. Du kan be oss begrense bruken, protestere mot bruk som bygger på berettiget interesse, og trekke tilbake et samtykke når som helst." : "You have the right to see the data we hold about you, and to have it corrected, deleted or handed over in a machine-readable format. You can ask us to restrict its use, object to use based on legitimate interest, and withdraw a consent at any time."),
        p(no ? "Har du konto, kan du laste ned og slette opplysningene dine selv på " : "If you have an account, you can download and delete your data yourself on ", { href: c.minSideHref, text: no ? "Min side" : "My page" }, no ? ". Ellers skriver du til " : ". Otherwise write to ", mail, no ? ". Vi svarer innen en måned." : ". We answer within one month."),
      ],
    },
    {
      id: "klage",
      title: no ? "Klage til Datatilsynet" : "Complaints to the Data Protection Authority",
      blocks: [
        p(no ? "Mener du at vi behandler opplysningene dine i strid med personvernreglene, kan du klage til " : "If you believe we process your data in breach of the data protection rules, you can complain to ", { href: "https://www.datatilsynet.no/", text: no ? "Datatilsynet" : "Datatilsynet, the Norwegian Data Protection Authority" }, no ? ". Ta gjerne kontakt med oss først, så kan vi rette opp det som er galt." : ". Feel free to contact us first, so we can put right what is wrong."),
      ],
    },
    {
      id: "informasjonskapsler",
      title: no ? "Informasjonskapsler og lagring i nettleseren" : "Cookies and storage in the browser",
      blocks: [
        list(
          [no ? "Utseende: velger du klassisk eller moderne utseende øverst på siden, huskes valget i en informasjonskapsel i ett år. Den brukes ikke til noe annet." : "Appearance: if you choose the classic or modern appearance at the top of the page, the choice is remembered in a cookie for one year. It is used for nothing else."],
          [no ? "Innlogging: logger du inn, settes en informasjonskapsel som holder deg innlogget (12 timer, eller 30 dager med «Husk meg»), og én med navnet ditt til visning øverst på siden." : "Login: if you log in, one cookie keeps you logged in (12 hours, or 30 days with \"Remember me\"), and one holds your name for display at the top of the page."],
          [no ? "Konfiguratoren: huset du setter sammen, huskes i nettleserens egen lagring på denne enheten, så du kan fortsette senere. Det sendes ikke til oss før du lagrer huset på Min side eller sender det, og du kan forkaste utkastet i konfiguratoren." : "The configurator: the house you configure is remembered in the browser's own storage on this device, so you can continue later. It is not sent to us until you save the house on My page or send it, and you can discard the draft in the configurator."],
          [no ? "Ingen sporing: nettsiden bruker ingen informasjonskapsler til sporing eller reklame, og ingen analyseverktøy fra andre." : "No tracking: the website uses no cookies for tracking or advertising, and no third-party analytics."],
        ),
      ],
    },
    {
      id: "statistikk",
      title: no ? "Besøksstatistikk" : "Visitor statistics",
      blocks: [
        p(no ? "Besøk telles uten informasjonskapsler og uten å lagre IP-adresser. For å telle hver besøkende én gang per dag lages en enveiskode av en tilfeldig dagsnøkkel, IP-adressen og nettleserens navn. Dagsnøkkelen byttes hver dag, så koden kan ikke kobles til deg eller til andre dager. Om besøket kom fra mobil eller datamaskin, leses av nettleserens navn på serveren." : "Visits are counted without cookies and without storing IP addresses. To count each visitor once a day, a one-way code is made from a random daily key, the IP address and the browser's name. The daily key changes every day, so the code cannot be linked to you or to other days. Whether the visit came from a phone or a computer is read from the browser's name on the server."),
        p(no ? "Det som lagres, er antall per dag: sidevisninger, besøkende, besøk, hvilke sider som ble lest, hvilken nettside besøket kom fra, mobil eller datamaskin, og hvilket utseende som ble brukt. Innloggede brukere, roboter og nettlesere som ber om ikke å bli sporet (Do Not Track eller Global Privacy Control), telles ikke." : "What is stored is counts per day: page views, visitors, visits, which pages were read, which site the visit came from, phone or computer, and which appearance was used. Logged-in users, robots and browsers that ask not to be tracked (Do Not Track or Global Privacy Control) are not counted."),
      ],
    },
  ];

  return {
    title: no ? "Personvernerklæring" : "Privacy statement",
    lede: no ? "Hva vi lagrer, hvorfor, hvor lenge, og hvordan du får innsyn i det eller får det slettet." : "What we store, why, for how long, and how you can see it or have it deleted.",
    version: PRIVACY_VERSION,
    updated: no ? `Sist endret ${dateLong(PRIVACY_VERSION)} (versjon ${PRIVACY_VERSION}).` : `Last changed ${dateLong(PRIVACY_VERSION, "en")} (version ${PRIVACY_VERSION}).`,
    sections,
  };
}
