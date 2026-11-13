import { klassiskMeta } from "@/lib/meta";
import { CONTACT_PAGE } from "@/lib/content/contact";
import ContactPage, { type ContactQuery } from "./ContactPage";

export const metadata = klassiskMeta("/kontakt", { title: CONTACT_PAGE.title.no, description: CONTACT_PAGE.description.no });

export default async function Kontakt({ searchParams }: { searchParams: Promise<ContactQuery> }) {
  return <ContactPage locale="no" query={await searchParams} />;
}
