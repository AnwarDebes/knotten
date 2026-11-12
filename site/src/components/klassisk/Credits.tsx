import { allCredits, creditsLine } from "@/lib/content/credits";
import type { Lang } from "@/lib/facts";

/** Maps, data and photos with their licences, for the footer: the short line. */
export function CreditsLine({ locale }: { locale: Lang }) {
  return <span className="credline">{locale === "no" ? "Kart, data og bilder: " : "Maps, data and photos: "}{creditsLine(locale)}.</span>;
}

/** The whole list, opened on request. */
export default function Credits({ locale }: { locale: Lang }) {
  const no = locale === "no";
  return (
    <details className="credits">
      <summary>{no ? "Alle kilder og lisenser for kart, data og bilder" : "Every source and licence for maps, data and photos"}</summary>
      <ul>
        {allCredits().map((c) => (
          <li key={c.id}>
            {c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer">{c.who[locale]}</a> : c.who[locale]}
            {`: ${c.what[locale]}. `}
            {c.licenceUrl ? <a href={c.licenceUrl} target="_blank" rel="noopener noreferrer">{c.licence[locale]}</a> : c.licence[locale]}
            {"."}
          </li>
        ))}
      </ul>
    </details>
  );
}
