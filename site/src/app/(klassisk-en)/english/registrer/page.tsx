import KlassiskRegister, { type RegisterSearch } from "@/components/klassisk/routes/Register";
import { registerText } from "@/components/klassisk/routes/text";
import { klassiskMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = klassiskMeta("/registrer", registerText("en"), { noindex: true, locale: "en" });

/** Sign-up for buyers in English Klassisk (components/klassisk/routes/Register.tsx); the Norwegian twin is /registrer. */
export default async function Register({ searchParams }: { searchParams: Promise<RegisterSearch> }) {
  return <KlassiskRegister locale="en" search={await searchParams} />;
}
