import { klassiskMeta } from "@/lib/meta";
import { PROJECT_PAGE } from "@/lib/content/project";
import ProjectPage from "@/app/(klassisk)/prosjektet/ProjectPage";

export const metadata = klassiskMeta("/prosjektet", { title: PROJECT_PAGE.title.en, description: PROJECT_PAGE.description.en }, { locale: "en" });

export default function Project() {
  return <ProjectPage locale="en" />;
}
