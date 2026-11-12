import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TeamProfile from "@/components/klassisk/team/TeamProfile";
import { TEAM, personJsonLdText, teamDescription, teamMember } from "@/lib/facts/team";
import { SITE } from "@/lib/meta";

/** Only the four people on the team have a page; any other address under /teamet is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return TEAM.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = teamMember((await params).slug);
  if (!p) return {};
  const description = teamDescription(p, "no");
  const [firstName, ...rest] = p.name.split(" ");
  return {
    title: p.name,
    description,
    openGraph: { type: "profile", firstName, lastName: rest.join(" "), title: `${p.name} | Knotten`, description, locale: "nb_NO", images: ["/img/view.jpg"] },
  };
}

export default async function Person({ params }: { params: Promise<{ slug: string }> }) {
  const p = teamMember((await params).slug);
  if (!p) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personJsonLdText(p, "no", `${SITE}/teamet/${p.slug}`) }} />
      <TeamProfile person={p} locale="no" />
    </>
  );
}
