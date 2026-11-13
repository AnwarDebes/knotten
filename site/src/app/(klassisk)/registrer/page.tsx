import KlassiskRegister, { type RegisterSearch } from "@/components/klassisk/routes/Register";
import { registerText } from "@/components/klassisk/routes/text";
import { klassiskMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = klassiskMeta("/registrer", registerText("no"), { noindex: true });

/** Sign-up for buyers in Klassisk (components/klassisk/routes/Register.tsx); the English twin is /english/registrer. */
export default async function Registrer({ searchParams }: { searchParams: Promise<RegisterSearch> }) {
  return <KlassiskRegister locale="no" search={await searchParams} />;
}
