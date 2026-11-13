import { klassiskMeta } from "@/lib/meta";
import { INVESTORS_PAGE } from "@/lib/content/investors";
import InvestorsPage from "@/app/(klassisk)/investorer/InvestorsPage";

export const metadata = klassiskMeta("/investorer", { title: INVESTORS_PAGE.title.en, description: INVESTORS_PAGE.description.en }, { locale: "en" });

export default function Investors() {
  return <InvestorsPage locale="en" />;
}
