import KlassiskPerson, { personMeta, teamParams } from "@/components/klassisk/routes/Person";

/** Only the four people on the team have a page; any other address under /english/teamet is a 404. */
export const dynamicParams = false;
export const generateStaticParams = teamParams;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return personMeta((await params).slug, "en");
}

export default async function Person({ params }: { params: Promise<{ slug: string }> }) {
  return <KlassiskPerson slug={(await params).slug} locale="en" />;
}
