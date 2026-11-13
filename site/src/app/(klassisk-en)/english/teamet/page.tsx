import TeamOverview from "@/components/klassisk/team/TeamOverview";
import { teamText } from "@/components/klassisk/routes/text";
import { klassiskMeta } from "@/lib/meta";

export const metadata = klassiskMeta("/teamet", teamText("en"), { locale: "en" });

/** The team in English Klassisk; the Norwegian twin is /teamet. */
export default function Team() {
  return <TeamOverview locale="en" />;
}
