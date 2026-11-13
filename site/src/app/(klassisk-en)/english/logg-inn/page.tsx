import KlassiskLogin, { loginText, type LoginSearch } from "@/components/klassisk/routes/Login";
import { klassiskMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = klassiskMeta("/logg-inn", loginText("en"), { noindex: true, locale: "en" });

/** Log in, in the Klassisk design in English (the page itself is in components/klassisk/routes/Login.tsx). */
export default async function LogIn({ searchParams }: { searchParams: Promise<LoginSearch> }) {
  return <KlassiskLogin locale="en" search={await searchParams} />;
}
