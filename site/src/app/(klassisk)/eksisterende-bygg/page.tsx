import { klassiskMeta } from "@/lib/meta";
import PageHead from "@/components/klassisk/PageHead";
import Reveal from "@/components/klassisk/Reveal";
import { Src } from "@/components/klassisk/Source";
import { FACT } from "@/lib/facts";
import { beforeAfter, meters, type Building } from "@/lib/server/records";
import MeterChart from "@/components/klassisk/MeterChart";

export const metadata = klassiskMeta("/eksisterende-bygg", { title: "Eksisterende bygg", description: "Kontorbygget og bolighuset som står på eiendommen i dag, og lager- og verkstedbygget som er planlagt. Målt forbruk blir sammenligningsgrunnlaget for de nye boligene." });

const published = (b?: Building): b is Building => !!b && b.public && b.readings.length > 0;

/** Measured data for a building, once the owner has loaded it and chosen to publish it. */
function Measured({ b, title }: { b: Building; title: string }) {
  const nf = (v: number) => Math.round(v).toLocaleString("nb-NO");
  const first = b.readings[0].month, last = b.readings[b.readings.length - 1].month;
  return (
    <>
      <div>
        <span className="tag green">Målt</span>
        <h3>{title}</h3>
        <p className="small" style={{ marginTop: 8 }}>{`Målt forbruk per måned fra ${first} til ${last}. Kilde: ${b.source ?? "måleverdier"}.`}</p>
        {b.upgrades.map((u) => {
          const ba = beforeAfter(b.readings, u.date);
          return <p key={u.id} className="small" style={{ marginTop: 8 }}><strong>{u.title}</strong>{` (${u.date})`}{ba ? `: ${ba.change_pct > 0 ? "+" : ""}${ba.change_pct.toFixed(0)} % de ${ba.pairs} månedene etter mot før, ${nf(ba.after)} mot ${nf(ba.before)} kWh. Ikke temperaturkorrigert.` : ": før og etter vises når det finnes målinger på begge sider."}</p>;
        })}
      </div>
      <MeterChart b={b} />
    </>
  );
}

export default async function Bygg() {
  const { buildings } = await meters.read();
  const office = buildings.find((x) => x.id === "office"), house = buildings.find((x) => x.id === "house");
  return (
    <>
      <PageHead title="Eksisterende bygg" crumb="Eksisterende bygg">
        <p>Området har allerede et bolighus og et kontorbygg, og et lager- og verkstedbygg er planlagt. De tas inn i energibildet for hele feltet og gir virkelige forbrukstall å måle konseptet mot. <Src id="bygg" /></p>
      </PageHead>
      <section className="sec">
        <div className="wrap">
          <Reveal className="blist" stagger>
            <article><span className="st">I drift</span><h3>Kontorbygget</h3><p>{`${FACT.offices_now} kontorer er ferdig i dag. Bygget utvides til ${FACT.offices_after} kontorer. Faktisk strømforbruk for dagens bygg hentes inn, regnes om per kontor og skaleres til ${FACT.offices_after}, med felleslaster som oppvarming og ventilasjon holdt for seg.`} <Src id="kontor" /></p></article>
            <article><span className="st">I drift</span><h3>Bolighuset</h3><p>Ligger nederst i feltet og tas inn i det samlede energibildet for området som en energibruker og mulig energiflate.</p></article>
            <article><span className="st">Planlagt</span><h3>Lager og verksted</h3><p>Bygges rett bak bolighuset. Til målte tall finnes, dimensjoneres bygget som én bolig. Det er en tydelig merket antakelse som byttes ut med målerdata. <Src id="lager" /></p></article>
          </Reveal>

          {/* the measurements show once they exist; until then the page says so in one line instead of empty charts */}
          {published(office) && (
            <Reveal className="meter" delay={100}>
              <Measured b={office} title="Strømforbruk, kontorbygget" />
            </Reveal>
          )}
          {published(house) && (
            <Reveal className="meter" delay={160}>
              <Measured b={house} title="Strømforbruk, bolighuset" />
            </Reveal>
          )}
          {published(office) || published(house) ? (
            <p className="small" style={{ marginTop: 20, maxWidth: "70ch" }}>Målingene leses fra strømmålernes HAN-port eller hentes fra Elhub. Nettsiden viser data, den styrer ingenting i byggene.</p>
          ) : (
            <p className="small" style={{ marginTop: 28, maxWidth: "70ch" }}>Målt strømforbruk for byggene er ikke hentet inn ennå. Det vises her når prosjekteier har lagt det inn.</p>
          )}
        </div>
      </section>
    </>
  );
}
