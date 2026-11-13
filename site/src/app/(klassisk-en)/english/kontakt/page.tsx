import { klassiskMeta } from "@/lib/meta";
import { CONTACT_PAGE } from "@/lib/content/contact";
import ContactPage, { type ContactQuery } from "@/app/(klassisk)/kontakt/ContactPage";

export const metadata = klassiskMeta("/kontakt", { title: CONTACT_PAGE.title.en, description: CONTACT_PAGE.description.en }, { locale: "en" });

export default async function Contact({ searchParams }: { searchParams: Promise<ContactQuery> }) {
  return <ContactPage locale="en" query={await searchParams} />;
}
