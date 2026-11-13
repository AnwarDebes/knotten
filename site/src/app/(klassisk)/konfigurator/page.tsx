import KlassiskPage, { klassiskMeta as configuratorText } from "@/components/configurator/klassisk/KlassiskPage";
import { klassiskMeta } from "@/lib/meta";

export const metadata = klassiskMeta("/konfigurator", configuratorText("no"));

/** The house configurator in the Klassisk design, in Norwegian; the English twin is /english/konfigurator. */
export default async function Konfigurator({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <KlassiskPage locale="no" search={await searchParams} />;
}
