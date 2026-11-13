import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TeamProfile from "@/components/klassisk/team/TeamProfile";
import { kHref, type KLocale } from "@/lib/klassisk/locale";
import { TEAM, personJsonLdText, teamDescription, teamMember } from "@/lib/facts/team";
import { SITE, klassiskMeta } from "@/lib/meta";

/**
 * A person on the team in the Klassisk design, in Norwegian (/teamet/<navn>) and English (/english/teamet/<navn>).
 * Only the four people on the team have a page; the routes set dynamicParams = false, so any other name is a 404.
 */
export const teamParams = () => TEAM.map((p) => ({ slug: p.slug }));

export async function personMeta(slug: string, locale: KLocale): Promise<Metadata> {
  const p = teamMember(slug);
  if (!p) return {};
  const base = klassiskMeta(`/teamet/${p.slug}`, { title: p.name, description: teamDescription(p, locale) }, { locale });
  const [firstName, ...rest] = p.name.split(" ");
  return { ...base, openGraph: { ...base.openGraph, type: "profile", firstName, lastName: rest.join(" ") } };
}

export default function KlassiskPerson({ slug, locale }: { slug: string; locale: KLocale }) {
  const p = teamMember(slug);
  if (!p) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: personJsonLdText(p, locale, `${SITE}${kHref(`/teamet/${p.slug}`, locale)}`) }} />
      <TeamProfile person={p} locale={locale} />
    </>
  );
}
