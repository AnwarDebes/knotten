"use client";
import type { Locale } from "@/lib/i18n";
import { clock, priceText, tempText, useRightNow, windText } from "./now";

const MET = "https://www.met.no/";
const PRICES = "https://www.hvakosterstrommen.no/";

/**
 * "Akkurat nå på Knotten" in the Moderne look: the weather at the property now (MET), today's sunset and the power price
 * now. Filled in once the panel is near the screen; a service that does not answer is said quietly in its own cell.
 */
export default function RightNow({ locale }: { locale: Locale }) {
  const [ref, now] = useRightNow<HTMLDivElement>();
  const no = locale === "no";
  const w = now.data?.weather ?? null;
  const p = now.data?.price ?? null;
  const waiting = now.status === "waiting";
  const dots = <dd className="num text-[40px] mt-2 text-muted" aria-hidden="true">…</dd>;
  const off = (s: string) => <dd className="mt-3 text-[15px] text-muted">{s}</dd>;
  return (
    <div ref={ref} className="panel p-5 md:p-7" aria-busy={waiting}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="display text-[clamp(24px,2.4vw,32px)]">{no ? "Akkurat nå på Knotten." : "Right now at Knotten."}</h3>
        {now.data && <span className="provenance">{no ? "Hentet kl." : "Fetched at"} {clock(now.data.at, locale)}</span>}
      </div>
      <dl className="mt-5 grid border-t line sm:grid-cols-3">
        <div className="pt-5 sm:pr-6 min-w-0">
          <dt className="label">{no ? "Været" : "The weather"}</dt>
          {w ? (
            <>
              <dd className="num text-[40px] mt-2">{tempText(w.temp, locale)}</dd>
              <dd className="mt-2 text-[15px] text-ink">{[w.text[locale], `${no ? "vind" : "wind"} ${windText(w.wind, locale)}`].filter(Boolean).join(", ")}</dd>
              <dd className="provenance mt-1.5">{no ? <>Varsel for kl. {clock(w.time, locale)} fra <a href={MET} className="underline">Meteorologisk institutt</a></> : <>Forecast for {clock(w.time, locale)} from the <a href={MET} className="underline">Norwegian Meteorological Institute</a></>}</dd>
            </>
          ) : waiting ? dots : off(no ? "Værvarselet svarer ikke akkurat nå." : "The forecast is not answering right now.")}
        </div>
        <div className="pt-5 mt-5 border-t line sm:mt-0 sm:border-t-0 sm:border-l sm:px-6 min-w-0">
          <dt className="label">{no ? "Solnedgang i dag" : "Sunset today"}</dt>
          {now.sunset ? (
            <>
              <dd className="num text-[40px] mt-2">{clock(now.sunset, locale)}</dd>
              <dd className="provenance mt-2">{no ? "Beregnet for Knotten mot en flat horisont. Åsene rundt tar solen tidligere." : "Computed for Knotten against a flat horizon. The hills around take the sun earlier."}</dd>
            </>
          ) : dots}
        </div>
        <div className="pt-5 mt-5 border-t line sm:mt-0 sm:border-t-0 sm:border-l sm:pl-6 min-w-0">
          <dt className="label">{no ? "Strømprisen nå, NO2" : "The power price now, NO2"}</dt>
          {p ? (
            <>
              <dd className="num text-[40px] mt-2">{priceText(p.nok, locale)}<span className="text-[14px] font-body font-normal opacity-70 ml-0.5"> per kWh</span></dd>
              <dd className="provenance mt-2">{no ? <>Spotpris uten mva og nettleie, fra <a href={PRICES} className="underline">hvakosterstrommen.no</a></> : <>Spot price without VAT and grid tariff, from <a href={PRICES} className="underline">hvakosterstrommen.no</a></>}</dd>
            </>
          ) : waiting ? dots : off(no ? "Strømprisen svarer ikke akkurat nå." : "The power price is not answering right now.")}
        </div>
      </dl>
    </div>
  );
}
