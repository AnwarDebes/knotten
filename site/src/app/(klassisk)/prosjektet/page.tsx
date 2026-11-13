import { klassiskMeta } from "@/lib/meta";
import { PROJECT_PAGE } from "@/lib/content/project";
import ProjectPage from "./ProjectPage";

export const metadata = klassiskMeta("/prosjektet", { title: PROJECT_PAGE.title.no, description: PROJECT_PAGE.description.no });

export default function Prosjektet() {
  return <ProjectPage locale="no" />;
}
