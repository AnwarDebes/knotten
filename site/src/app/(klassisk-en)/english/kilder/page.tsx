import { klassiskMeta } from "@/lib/meta";
import { SOURCES_PAGE } from "@/lib/content/sources";
import SourcesPage from "@/app/(klassisk)/kilder/SourcesPage";

export const metadata = klassiskMeta("/kilder", { title: SOURCES_PAGE.title.en, description: SOURCES_PAGE.description.en }, { locale: "en" });

export default function Sources() {
  return <SourcesPage locale="en" />;
}
