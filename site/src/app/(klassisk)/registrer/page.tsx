import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KSignUpPage } from "@/components/klassisk/members/Pages";
import { getSession } from "@/lib/auth";
import { loadPlots } from "@/lib/data";
import { minSidePath, plotsFromQuery } from "@/lib/member-paths";
import { LINK_HOURS } from "@/lib/server/accounts";
import { formStamp } from "@/lib/server/human";
import { STORAGE } from "@/lib/server/kv";
import { signupByEmail } from "@/lib/server/member-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Opprett konto",
  description: "Opprett en kjøperkonto for Knotten: følg tomtene, lagre husene du setter sammen og bestem hva vi kan sende deg.",
  robots: { index: false, follow: true },
};

/** Sign-up for buyers in the Klassisk design (Norwegian; the component carries English too). Accepts ?tomt=7 or ?plot=plot-07. */
export default async function Registrer({ searchParams }: { searchParams: Promise<{ tomt?: string | string[]; plot?: string | string[] }> }) {
  const session = await getSession();
  if (session?.kind === "member") redirect(minSidePath("klassisk", "no"));
  const open = STORAGE !== "temp";
  const [{ plots }, byEmail, stamp] = await Promise.all([loadPlots(), open ? signupByEmail() : false, open ? formStamp("signup") : ""]);
  const ids = plots.map((p) => p.id);
  const preselect = plotsFromQuery(await searchParams).filter((p) => ids.includes(p));
  return <KSignUpPage locale="no" open={open} plots={ids} preselect={preselect} stamp={stamp} byEmail={byEmail} hours={LINK_HOURS.verify} />;
}
