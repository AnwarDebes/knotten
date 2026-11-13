import PageHead from "@/components/klassisk/PageHead";
import Reveal from "@/components/klassisk/Reveal";
import { Src } from "@/components/klassisk/Source";
import MeterChart, { MeterYears } from "@/components/klassisk/MeterChart";
import { BUILDINGS, BUILDINGS_LEDE, BUILDING_STATUS, METER_STEPS, NOT_MEASURED, meterName } from "@/lib/content/buildings";
import { beforeAfter, meters, type Building } from "@/lib/server/records";
import type { SourceId } from "@/lib/facts";
import type { KLocale } from "@/lib/klassisk/locale";

/** Measured data for a building, once the owner has loaded it and chosen to publish it. */
function Measured({ b, locale }: { b: Building; locale: KLocale }) {
  const en = locale === "en";
  const nf = (v: number) => Math.round(v).toLocaleString(en ? "en-GB" : "nb-NO");
  const first = b.readings[0].month, last = b.readings[b.readings.length - 1].month;
  const name = meterName(b, locale);
  return (
    <>
      <div>
        <span className="tag green">{en ? "Measured" : "Målt"}</span>
        <h2 className="mh">{en ? `Power use, ${name.charAt(0).toLowerCase()}${name.slice(1)}` : `Strømforbruk, ${name.toLowerCase()}`}</h2>
        <p className="small" style={{ marginTop: 8 }}>{en ? `Measured consumption per month from ${first} to ${last}. Source: ${b.source ?? "meter values"}.` : `Målt forbruk per måned fra ${first} til ${last}. Kilde: ${b.source ?? "måleverdier"}.`}</p>
        {b.upgrades.map((u) => {
          const ba = beforeAfter(b.readings, u.date);
          const change = ba ? `${ba.change_pct > 0 ? "+" : ""}${ba.change_pct.toFixed(0)} %` : "";
          return (
            <p key={u.id} className="small" style={{ marginTop: 8 }}>
              <strong>{u.title}</strong>{` (${u.date})`}
              {ba
                ? (en ? `: ${change} in the ${ba.pairs} months after against before, ${nf(ba.after)} against ${nf(ba.before)} kWh. Not weather-corrected.` : `: ${change} de ${ba.pairs} månedene etter mot før, ${nf(ba.after)} mot ${nf(ba.before)} kWh. Ikke temperaturkorrigert.`)
                : (en ? ": before and after shows once there are readings on both sides." : ": før og etter vises når det finnes målinger på begge sider.")}
            </p>
          );
        })}
      </div>
      <div className="meterdata">
        <MeterChart b={b} locale={locale} />
        <MeterYears b={b} locale={locale} />
      </div>
    </>
  );
}

/**
 * "Eksisterende bygg" in the Klassisk look, in Norwegian (/eksisterende-bygg) and English (/english/eksisterende-bygg):
 * the four buildings on the property with the energy budget's working figures (src/lib/content/buildings.ts, shared
 * with Moderne), and the measured consumption with its yearly totals once the owner publishes it in the portal.
 */
export default async function ByggPage({ locale }: { locale: KLocale }) {
  const en = locale === "en";
  const L = locale;
  const S = (id: SourceId) => <Src id={id} label={en ? "Source" : undefined} />;
  const { buildings } = await meters.read();
  // only buildings whose readings the owner has published; until then the page says so in one line instead of empty charts
  const measured = buildings.filter((b) => b.public && b.readings.length > 0);
  const title = en ? "Existing buildings" : "Eksisterende bygg";
  return (
    <>
      <PageHead title={title} crumb={title} locale={L}>
        <p>{BUILDINGS_LEDE[L]} {S("bygg")}</p>
      </PageHead>
      <section className="sec">
        <div className="wrap">
          <Reveal className="blist four" stagger>
            {BUILDINGS.map((b) => (
              <article key={b.id}>
                <span className={`st${b.status === "planned" ? " plan" : ""}`}>{BUILDING_STATUS[b.status][L]}</span>
                <h2>{b.name[L]}</h2>
                <p>{b.text[L]} {S(b.source)}</p>
                <div className="bfig">
                  {b.provisional && <span className="tag">{en ? "Provisional" : "Foreløpig"}</span>}
                  <b>{b.figure[L]}</b>
                  <span className="small">{b.note[L]}</span>
                </div>
              </article>
            ))}
          </Reveal>

          {measured.map((b, i) => (
            <Reveal key={b.id} className="meter" delay={100 + i * 60}>
              <Measured b={b} locale={L} />
            </Reveal>
          ))}
          {measured.length > 0 ? (
            <Reveal className="msteps" delay={120}>
              <h2>{METER_STEPS.title[L]}</h2>
              <ol>{METER_STEPS.steps.map((s) => <li key={s.no}>{s[L]}</li>)}</ol>
              <p className="small">{METER_STEPS.note[L]} {METER_STEPS.reading[L]}</p>
            </Reveal>
          ) : (
            <p className="small" style={{ marginTop: 28, maxWidth: "70ch" }}>{NOT_MEASURED[L]}</p>
          )}
        </div>
      </section>
    </>
  );
}
