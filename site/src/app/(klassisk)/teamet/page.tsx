import type { Metadata } from "next";
import TeamOverview from "@/components/klassisk/team/TeamOverview";
import { TEAM, nameList } from "@/lib/facts/team";

const description = `Prosjekteieren og prosjektgruppen bak Knotten: ${nameList(TEAM.map((p) => p.name), "no")}. Roller, spor og det de har levert, med dato og kilde.`;

export const metadata: Metadata = {
  title: "Teamet",
  description,
  openGraph: { title: "Teamet | Knotten", description, type: "website", locale: "nb_NO", images: ["/img/view.jpg"] },
};

/** The team in Klassisk, in Norwegian; the components take the language, so an English Klassisk can use them too. */
export default function Teamet() {
  return <TeamOverview locale="no" />;
}
