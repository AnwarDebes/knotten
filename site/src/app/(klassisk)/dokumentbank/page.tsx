import { klassiskMeta } from "@/lib/meta";
import { DOCUMENTS_PAGE } from "@/lib/content/documents";
import DocumentsPage from "./DocumentsPage";

export const metadata = klassiskMeta("/dokumentbank", { title: DOCUMENTS_PAGE.title.no, description: DOCUMENTS_PAGE.description.no });

export default function Dokumentbank() {
  return <DocumentsPage locale="no" />;
}
