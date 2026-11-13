import { klassiskMeta } from "@/lib/meta";
import { DOCUMENTS_PAGE } from "@/lib/content/documents";
import DocumentsPage from "@/app/(klassisk)/dokumentbank/DocumentsPage";

export const metadata = klassiskMeta("/dokumentbank", { title: DOCUMENTS_PAGE.title.en, description: DOCUMENTS_PAGE.description.en }, { locale: "en" });

export default function DocumentBank() {
  return <DocumentsPage locale="en" />;
}
