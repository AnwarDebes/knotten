import KlassiskLogin, { loginText, type LoginSearch } from "@/components/klassisk/routes/Login";
import { klassiskMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = klassiskMeta("/logg-inn", loginText("no"), { noindex: true });

/** Logg inn in the Klassisk design (the page itself is in components/klassisk/routes/Login.tsx, in both languages). */
export default async function LoggInn({ searchParams }: { searchParams: Promise<LoginSearch> }) {
  return <KlassiskLogin locale="no" search={await searchParams} />;
}
