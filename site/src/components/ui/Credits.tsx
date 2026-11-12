import type { Locale } from "@/lib/i18n";
import { allCredits, creditsLine } from "@/lib/content/credits";

/** Maps, data and photos with their licences, for the footer: the short line, and the whole list on request. */
export default function Credits({ locale }: { locale: Locale }) {
  const no = locale === "no";
  return (
    <details className="group basis-full">
      <summary className="cursor-pointer list-none inline-flex items-baseline gap-2 text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
        <span>{no ? "Kart, data og bilder: " : "Maps, data and photos: "}{creditsLine(locale)}.</span>
        <span className="text-fjord whitespace-nowrap underline underline-offset-4">{no ? "Alle kilder og lisenser" : "Every source and licence"}</span>
      </summary>
      <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 xl:grid-cols-3 text-[13px] leading-snug">
        {allCredits().map((c) => (
          <li key={c.id}>
            {c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">{c.who[locale]}</a> : <span className="text-ink">{c.who[locale]}</span>}
            {`: ${c.what[locale]}. `}
            {c.licenceUrl ? <a href={c.licenceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{c.licence[locale]}</a> : c.licence[locale]}
            {"."}
          </li>
        ))}
      </ul>
    </details>
  );
}
