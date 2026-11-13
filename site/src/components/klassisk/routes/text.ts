import type { KLocale } from "@/lib/klassisk/locale";
import { TEAM, nameList } from "@/lib/facts/team";

/**
 * Titles and descriptions of the Klassisk pages whose body lives in another component, in both languages, so the
 * Norwegian route and its /english twin say the same thing. Each route passes them to klassiskMeta (lib/meta.ts).
 */
type Meta = { title: string; description: string };
const pick = (locale: KLocale, no: Meta, en: Meta) => (locale === "en" ? en : no);

export const statusText = (locale: KLocale) =>
  pick(
    locale,
    { title: "Status og spørsmål", description: "Hvor Knotten står, hva som ikke er bestemt ennå, og svar på det folk spør om: salg, pris, sjøutsikt, reguleringsplan og hvem som står bak." },
    { title: "Status and questions", description: "Where Knotten stands, what is not decided yet, and answers to what people ask: sale, price, sea view, the zoning plan and who is behind it." },
  );

const names = TEAM.map((p) => p.name);

export const teamText = (locale: KLocale) =>
  pick(
    locale,
    { title: "Teamet", description: `Prosjekteieren og prosjektgruppen bak Knotten: ${nameList(names, "no")}. Roller, spor og det de har levert, med dato og kilde.` },
    { title: "The team", description: `The project owner and the project group behind Knotten: ${nameList(names, "en")}. Roles, tracks and what they have delivered, with date and source.` },
  );

export const registerText = (locale: KLocale) =>
  pick(
    locale,
    { title: "Opprett konto", description: "Opprett en kjøperkonto for Knotten: følg tomtene, lagre husene du setter sammen og bestem hva vi kan sende deg." },
    { title: "Create account", description: "Create a buyer account for Knotten: follow the plots, save the houses you configure and decide what we may send you." },
  );

export const mineText = (locale: KLocale) =>
  pick(
    locale,
    { title: "Min side", description: "Tomtene du følger, husene du har lagret, varslene dine og kontoen din." },
    { title: "My page", description: "The plots you follow, the houses you have saved, your alerts and your account." },
  );

export const newsText = (locale: KLocale) =>
  pick(
    locale,
    { title: "Nyheter", description: "Det som har skjedd i prosjektet, etter hvert som det skjer." },
    { title: "News", description: "What has happened in the project, as it happens." },
  );
