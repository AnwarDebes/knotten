import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KMinSidePage } from "@/components/klassisk/members/Pages";
import { getSession } from "@/lib/auth";
import { MT } from "@/lib/member-text";
import { minSideData, signupByEmail } from "@/lib/server/member-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Min side", robots: { index: false, follow: false } };

/**
 * Min side in the Klassisk design (Norwegian; the component carries English too). Visitors without a login are sent
 * to /logg-inn by the proxy; a project account has its own page in the portal.
 */
export default async function MinSide({ searchParams }: { searchParams: Promise<{ ny?: string; velkommen?: string; bekreftet?: string }> }) {
  const session = await getSession();
  if (!session) redirect(`/logg-inn?next=${encodeURIComponent("/min-side")}`);
  if (session.kind !== "member") redirect("/no/portal/konto");
  const [data, byEmail] = await Promise.all([minSideData(session.id), signupByEmail()]);
  if (!data) redirect("/logg-inn");
  const q = await searchParams;
  const t = MT.no;
  const banner = q.ny ? t.welcomeNew : q.velkommen ? t.welcomeVerified : q.bekreftet ? t.confirmed : "";
  return <KMinSidePage locale="no" data={data} byEmail={byEmail} banner={banner} />;
}
