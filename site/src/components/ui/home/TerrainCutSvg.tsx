import { FACT, fmt, type Lang } from "@/lib/facts";

/** The cross-section's words, the same in both designs. */
export function terrainCutText(lang: Lang) {
  const no = lang === "no";
  return {
    title: no ? "Terrengsnitt fra havet til Knotten" : "Cross-section from the sea to Knotten",
    desc: no
      ? `Prinsippsnitt, ikke i målestokk: åpent hav, Sniksfjorden, flaten ved Audna elvas utløp med bolighuset og kontorbygget, og Knotten med boligrekker mot sør og et felles solanlegg bak feltet. Terrengprofilen er ${fmt(FACT.profile_m, lang)} meter lang, fra 0 til ${FACT.knotten_m} meter over havet.`
      : `A principle section, not to scale: the open sea, Sniksfjorden, the flat at the mouth of the Audna with the house and the office building, and Knotten with rows of homes facing south and a shared solar plant behind the field. The terrain profile is ${fmt(FACT.profile_m, lang)} metres long, from 0 to ${FACT.knotten_m} metres above the sea.`,
    caption: no ? "Prinsippsnitt, ikke i målestokk." : "A principle section, not to scale.",
    credit: no ? "Kartgrunnlag: Kartverket" : "Map basis: Kartverket",
  };
}

/**
 * The terrain cross-section from the open sea to the top of Knotten, drawn once for both designs (Klassisk
 * components/klassisk/TerrainCut.tsx and Moderne components/ui/TerrainCut.tsx frame it each in their own way): the same
 * words and the same colours from the logo, navy, fjord blue, pine and the sun's amber. The text takes each design's
 * own body font. Static SVG, so it costs nothing.
 */
export default function TerrainCutSvg({ lang }: { lang: Lang }) {
  const no = lang === "no";
  const t = terrainCutText(lang);
  const id = `tc-${lang}`;
  return (
    <svg viewBox="0 0 760 330" role="img" aria-labelledby={`${id}-t ${id}-d`} style={{ display: "block", width: "100%", height: "auto" }}>
      <title id={`${id}-t`}>{t.title}</title>
      <desc id={`${id}-d`}>{t.desc}</desc>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f5f8fa" /><stop offset="1" stopColor="#e2edf4" /></linearGradient>
        <linearGradient id={`${id}-sea`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8fbfd8" /><stop offset="1" stopColor="#2f6688" /></linearGradient>
      </defs>
      <rect width="760" height="330" rx="10" fill={`url(#${id}-sky)`} />
      <path d="M0 176c60-20 110-30 170-22 60 8 100 20 140 18 30-1 50-8 80-8V190H0z" fill="#cfe2ee" />
      <rect x="0" y="190" width="420" height="52" fill={`url(#${id}-sea)`} />
      <path className="shimmer" d="M0 205h420M0 218h420M0 231h420" stroke="#fff" strokeWidth="1" strokeDasharray="18 30" fill="none" opacity=".6" />
      <path d="M400 242c40-4 80-6 120-6 40 0 80 2 120 4v90H400z" fill="#dce8e0" />
      <path d="M560 240c40-10 70-40 95-80 20-32 45-60 70-70 12-4 25-6 35-6V330H560z" fill="#4f7156" />
      <path d="M560 240c40-10 70-40 95-80 20-32 45-60 70-70 12-4 25-6 35-6" fill="none" stroke="#2f4f38" strokeWidth="1.5" />
      <g fill="#17283a">
        <path d="M600 216l10-9 10 9v10h-20z" /><path d="M628 196l10-9 10 9v10h-20z" /><path d="M652 170l10-9 10 9v10h-20z" /><path d="M676 146l10-9 10 9v10h-20z" /><path d="M700 118l10-9 10 9v10h-20z" /><path d="M724 96l10-9 10 9v10h-20z" />
      </g>
      <g fill="#e2a23b"><rect x="736" y="82" width="6" height="3" /><rect x="744" y="80" width="6" height="3" /><rect x="752" y="78" width="6" height="3" /></g>
      <rect x="470" y="228" width="22" height="12" fill="#6a7b89" /><rect x="510" y="226" width="30" height="14" fill="#6a7b89" />
      <path d="M662 172L40 194" stroke="#2f6688" strokeWidth="1.2" strokeDasharray="4 5" fill="none" />
      <circle cx="40" cy="194" r="3" fill="#2f6688" />
      <path d="M400 300h340" stroke="#6a7b89" strokeWidth="1" /><path d="M400 295v10M740 295v10" stroke="#6a7b89" strokeWidth="1" />
      <g fontSize="11" fill="#17283a" aria-hidden="true">
        <text x="14" y="182" fill="#2f6688" fontWeight="600">{no ? "Åpent hav" : "Open sea"}</text>
        <text x="260" y="182">Sniksfjorden</text>
        <text x="404" y="262">{no ? "Audna elvas utløp" : "The mouth of the Audna"}</text>
        <text x="452" y="222" fontSize="10" fill="#3a4d60">{no ? "Bolighus og kontor i dag" : "House and office today"}</text>
        <text x="600" y="262" fill="#fff" fontWeight="600">Knotten</text>
        <text x="600" y="278" fill="#dce8e0" fontSize="10">{no ? "Boligrekker mot sør" : "Rows facing south"}</text>
        <text x="754" y="70" fill="#7a5312" fontSize="10" textAnchor="end">{no ? "Felles solanlegg bak feltet" : "Shared solar plant behind the field"}</text>
        <text x="404" y="318" fill="#3a4d60" fontSize="10">{no ? `Terrengprofil ${fmt(FACT.profile_m, lang)} m, 0 til ${FACT.knotten_m} moh.` : `Terrain profile ${fmt(FACT.profile_m, lang)} m, 0 to ${FACT.knotten_m} m above sea level`}</text>
        <text x="80" y="200" fill="#2f6688" fontSize="10" fontStyle="italic">{no ? "siktlinje" : "sight line"}</text>
      </g>
    </svg>
  );
}
