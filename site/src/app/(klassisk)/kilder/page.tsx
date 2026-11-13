import { klassiskMeta } from "@/lib/meta";
import { SOURCES_PAGE } from "@/lib/content/sources";
import SourcesPage from "./SourcesPage";

export const metadata = klassiskMeta("/kilder", { title: SOURCES_PAGE.title.no, description: SOURCES_PAGE.description.no });

export default function Kilder() {
  return <SourcesPage locale="no" />;
}
