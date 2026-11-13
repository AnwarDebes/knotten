import { klassiskMeta } from "@/lib/meta";
import { INVESTORS_PAGE } from "@/lib/content/investors";
import InvestorsPage from "./InvestorsPage";

export const metadata = klassiskMeta("/investorer", { title: INVESTORS_PAGE.title.no, description: INVESTORS_PAGE.description.no });

export default function Investorer() {
  return <InvestorsPage locale="no" />;
}
