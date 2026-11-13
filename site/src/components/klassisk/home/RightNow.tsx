"use client";
import type { Lang } from "@/lib/facts";
import { clock, priceText, tempText, useRightNow, windText } from "@/components/ui/home/now";

const MET = "https://www.met.no/";
const PRICES = "https://www.hvakosterstrommen.no/";

/**
 * "Akkurat nå på Knotten" in the Klassisk look: the weather at the property now (MET), today's sunset and the power price
 * now. Filled in once the panel is near the screen; a service that does not answer is said quietly in its own cell.
 */
export default function RightNow({ locale }: { locale: Lang }) {
  const [ref, now] = useRightNow<HTMLDivElement>();
  const no = locale === "no";
  const w = now.data?.weather ?? null;
  const p = now.data?.price ?? null;
  const waiting = now.status === "waiting";
  const dots = <dd className="know-val" aria-hidden="true">…</dd>;
  return (
    <div ref={ref} className="know" aria-busy={waiting}>
      <div className="know-head">
        <h3>{no ? "Akkurat nå på Knotten" : "Right now at Knotten"}</h3>
        {now.data && <span className="small">{no ? "Hentet kl." : "Fetched at"} {clock(now.data.at, locale)}</span>}
      </div>
      <dl className="know-grid">
        <div>
          <dt>{no ? "Været" : "The weather"}</dt>
          {w ? (
            <>
              <dd className="know-val">{tempText(w.temp, locale)}</dd>
              <dd className="know-note">{[w.text[locale], `${no ? "vind" : "wind"} ${windText(w.wind, locale)}`].filter(Boolean).join(", ")}</dd>
              <dd className="small">{no ? <>Varsel for kl. {clock(w.time, locale)} fra <a href={MET}>Meteorologisk institutt</a></> : <>Forecast for {clock(w.time, locale)} from the <a href={MET}>Norwegian Meteorological Institute</a></>}</dd>
            </>
          ) : waiting ? dots : <dd className="know-off">{no ? "Værvarselet svarer ikke akkurat nå." : "The forecast is not answering right now."}</dd>}
        </div>
        <div>
          <dt>{no ? "Solnedgang i dag" : "Sunset today"}</dt>
          {now.sunset ? (
            <>
              <dd className="know-val">{clock(now.sunset, locale)}</dd>
              <dd className="small">{no ? "Beregnet for Knotten mot en flat horisont. Åsene rundt tar solen tidligere." : "Computed for Knotten against a flat horizon. The hills around take the sun earlier."}</dd>
            </>
          ) : dots}
        </div>
        <div>
          <dt>{no ? "Strømprisen nå, NO2" : "The power price now, NO2"}</dt>
          {p ? (
            <>
              <dd className="know-val">{priceText(p.nok, locale)} <span className="know-unit">per kWh</span></dd>
              <dd className="small">{no ? <>Spotpris uten mva og nettleie, fra <a href={PRICES}>hvakosterstrommen.no</a></> : <>Spot price without VAT and grid tariff, from <a href={PRICES}>hvakosterstrommen.no</a></>}</dd>
            </>
          ) : waiting ? dots : <dd className="know-off">{no ? "Strømprisen svarer ikke akkurat nå." : "The power price is not answering right now."}</dd>}
        </div>
      </dl>
    </div>
  );
}
