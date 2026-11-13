import KlassiskPage, { klassiskMeta as configuratorText } from "@/components/configurator/klassisk/KlassiskPage";
import { klassiskMeta } from "@/lib/meta";

export const metadata = klassiskMeta("/konfigurator", configuratorText("en"), { locale: "en" });

/** The house configurator in English Klassisk; the Norwegian twin is /konfigurator. */
export default async function Configurator({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <KlassiskPage locale="en" search={await searchParams} />;
}
