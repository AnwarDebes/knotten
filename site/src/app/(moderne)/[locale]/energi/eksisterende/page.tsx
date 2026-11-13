import type { Locale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import Src from "@/components/ui/Source";
import { MeterView } from "@/components/portal/MeterView";
import { meters } from "@/lib/server/records";
import { BUILDINGS, BUILDINGS_LEDE, BUILDING_STATUS, METER_STEPS, NOT_MEASURED, meterName } from "@/lib/content/buildings";
import { pageMeta } from "@/lib/meta";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export const generateMetadata = pageMeta("/energi/eksisterende", {
  no: { title: "Eksisterende bygg", description: "Kontorbygget og bolighuset står på eiendommen i dag, og tilbygget til kontoret og lager- og verkstedbygget er planlagt. Målt forbruk blir et sammenligningsgrunnlag for de nye boligene." },
  en: { title: "Existing buildings", description: "The office building and the house stand on the property today, and the office extension and the warehouse and workshop are planned. Their measured consumption becomes a basis of comparison for the new homes." },
});

/** The buildings on the property (src/lib/content/buildings.ts, the same text as the Klassisk page), and their measured consumption once published. */
export default async function Existing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const no = locale === "no";
  const { buildings: all } = await meters.read();
  // only buildings whose readings the owner has published; until then the page shows no empty panels
  const measured = all.filter((m) => m.public && m.readings.length > 0);
  return (
    <>
      <Nav locale={locale} />
      <PageHead title={no ? "Eksisterende bygg" : "Existing buildings"} lede={BUILDINGS_LEDE[locale]} />
      <section className="wrap pb-12 grid gap-4 md:grid-cols-2">
        {BUILDINGS.map((b, i) => (
          <div key={b.id} className="panel p-6 md:p-7 rise" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="display text-[26px]">{b.name[locale]}</h2>
              <span className={`chip ${b.status === "planned" ? "chip-fjord" : "chip-pine"}`}>{BUILDING_STATUS[b.status][locale]}</span>
            </div>
            <p className="mt-3 text-[15.5px] text-bone-2">{b.text[locale]} <Src id={b.source} locale={locale} /></p>
            <div className="mt-5 num text-[30px]">{b.figure[locale]}</div>
            <div className="provenance mt-1">{b.note[locale]}</div>
          </div>
        ))}
      </section>
      {measured.length > 0 ? (
        <>
          <section className="wrap pb-16 grid gap-12 lg:grid-cols-2">
            {measured.map((m) => (
              <div key={m.id}>
                <h2 className="display text-[32px]">{meterName(m, locale)}</h2>
                <div className="mt-4 panel p-4 md:p-5">
                  <MeterView b={m} locale={locale} />
                  <div className="provenance mt-3">{no ? `Målt forbruk, ${m.readings[0].month} til ${m.readings[m.readings.length - 1].month}. Kilde: ${m.source ?? "måleverdier"}.` : `Measured consumption, ${m.readings[0].month} to ${m.readings[m.readings.length - 1].month}. Source: ${m.source ?? "meter values"}.`}</div>
                </div>
              </div>
            ))}
          </section>
          <section className="wrap pb-24">
            <div className="panel p-7 max-w-[70ch]">
              <h2 className="font-medium">{METER_STEPS.title[locale]}</h2>
              <ol className="mt-3 list-decimal ml-5 text-[15px] grid gap-1.5">
                {METER_STEPS.steps.map((s) => <li key={s.no}>{s[locale]}</li>)}
              </ol>
              <p className="provenance mt-4">{METER_STEPS.note[locale]} {METER_STEPS.reading[locale]}</p>
            </div>
          </section>
        </>
      ) : (
        <section className="wrap pb-16">
          <p className="provenance max-w-[70ch]">{NOT_MEASURED[locale]}</p>
        </section>
      )}
    </>
  );
}
