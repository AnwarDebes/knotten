import type { Lang } from "@/lib/facts";
import TerrainCutSvg, { terrainCutText } from "@/components/ui/home/TerrainCutSvg";

/**
 * Principle cross-section from open sea to Knotten, not to scale, in a Klassisk figure. The drawing, its words and its
 * colours are the same as in Moderne (components/ui/home/TerrainCutSvg.tsx).
 */
export default function TerrainCut({ locale = "no" }: { locale?: Lang }) {
  const t = terrainCutText(locale);
  return (
    <figure className="fig">
      <TerrainCutSvg lang={locale} />
      <figcaption>
        <span>{t.caption}</span>
        <span>{t.credit}</span>
      </figcaption>
    </figure>
  );
}
