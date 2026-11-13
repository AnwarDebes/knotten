import TeamOverview from "@/components/klassisk/team/TeamOverview";
import { teamText } from "@/components/klassisk/routes/text";
import { klassiskMeta } from "@/lib/meta";

export const metadata = klassiskMeta("/teamet", teamText("no"));

/** The team in Klassisk, in Norwegian; the English twin is /english/teamet. */
export default function Teamet() {
  return <TeamOverview locale="no" />;
}
