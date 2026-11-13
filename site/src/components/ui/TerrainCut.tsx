import type { Locale } from "@/lib/i18n";
import TerrainCutSvg, { terrainCutText } from "./home/TerrainCutSvg";

/**
 * A principle cross-section from open sea to the top of Knotten, not to scale: the sea, the fjord, the flat at the
 * mouth of the Audna with the office and the house, and the rows up the south face. The drawing, its words and its
 * colours are the same as in Klassisk (components/ui/home/TerrainCutSvg.tsx); this is the Moderne frame.
 */
export default function TerrainCut({ locale }: { locale: Locale }) {
  const t = terrainCutText(locale);
  return (
    <figure className="panel p-3 md:p-4">
      <TerrainCutSvg lang={locale} />
      <figcaption className="provenance mt-2.5 flex flex-wrap justify-between gap-2">
        <span>{t.caption}</span>
        <span>{t.credit}</span>
      </figcaption>
    </figure>
  );
}
