import KlassiskPassword, { passwordText } from "@/components/klassisk/routes/Password";
import { klassiskMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = klassiskMeta("/logg-inn/passord", passwordText("no"), { noindex: true });

/** Where invitation, reset and confirmation links land in Klassisk (components/klassisk/routes/Password.tsx). */
export default async function VelgPassord({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <KlassiskPassword locale="no" token={token} />;
}
