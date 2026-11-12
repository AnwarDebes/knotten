import type { Metadata } from "next";
import KlassiskPage, { klassiskMeta } from "@/components/configurator/klassisk/KlassiskPage";

export const metadata: Metadata = klassiskMeta("no");

/** The house configurator in the Klassisk design (Norwegian; the page itself also carries English). */
export default async function Konfigurator({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <KlassiskPage locale="no" search={await searchParams} />;
}
