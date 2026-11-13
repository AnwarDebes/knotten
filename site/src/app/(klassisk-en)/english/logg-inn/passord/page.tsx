import KlassiskPassword, { passwordText } from "@/components/klassisk/routes/Password";
import { klassiskMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = klassiskMeta("/logg-inn/passord", passwordText("en"), { noindex: true, locale: "en" });

/** Where invitation, reset and confirmation links land in English Klassisk (components/klassisk/routes/Password.tsx). */
export default async function ChoosePassword({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <KlassiskPassword locale="en" token={token} />;
}
