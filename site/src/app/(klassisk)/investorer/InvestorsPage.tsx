import Link from "next/link";
import PageHead from "@/components/klassisk/PageHead";
import Reveal from "@/components/klassisk/Reveal";
import { Src } from "@/components/klassisk/Source";
import { kHref, type KLocale } from "@/lib/klassisk/locale";
import { assumption, dateShort, fmt, STATUS_LABEL } from "@/lib/facts";
import { CHECK_IT, DATA_ROOM, FIGURES_PRINCIPLE, INVESTORS_PAGE, INVESTOR_FIGURES, PUBLIC_PARTNERS, QA_HEAD, investorQA } from "@/lib/content/investors";
import { leadQueryFor } from "@/lib/leadForm";
import { loginPagePath } from "@/lib/member-paths";

/**
 * "Investorer og samarbeid" / "Investors and partners" in the Klassisk look, in both languages: rendered by
 * /investorer and /english/investorer. The words and figures come from src/lib/content/investors.ts, the same as
 * the Moderne page.
 */
export default function InvestorsPage({ locale: l }: { locale: KLocale }) {
  const dataRoom = `${loginPagePath("klassisk", l)}?next=${encodeURIComponent(`/${l}/portal/investor`)}`;
  const contact = (role: "investor" | "access") => kHref(`/kontakt${leadQueryFor(role, "klassisk")}`, l);
  const prov = (provisional?: boolean) => (provisional ? STATUS_LABEL.foreløpig[l] : STATUS_LABEL.fastsatt[l]);
  return (
    <>
      <PageHead
        title={INVESTORS_PAGE.title[l]}
        crumb={INVESTORS_PAGE.title[l]}
        locale={l}
        aside={<div className="cta-row" style={{ marginTop: 0 }}><Link className="btn" href={contact("investor")}>{INVESTORS_PAGE.request[l]}</Link><Link className="btn ghost" href={dataRoom}>{INVESTORS_PAGE.dataRoom[l]}</Link></div>}
      >
        <p>{INVESTORS_PAGE.lede[l]}</p>
      </PageHead>

      <section className="sec" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <Reveal className="facts ifacts" stagger>
            {INVESTOR_FIGURES.map(({ key, src }) => {
              const a = assumption(key);
              return (
                <div key={key} className="fact">
                  <small className={a.provisional ? "tag" : "tag green"}>{prov(a.provisional)}</small>
                  <b>{fmt(a.value, l)}<small> {a.unit[l]}</small></b>
                  <span>{a.label[l]} <Src id={src} /></span>
                  <span className="prov">{a.source[l]}, {dateShort(a.date, l)}</span>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal className="stack" style={{ maxWidth: "70ch" }}>
            <div className="eyebrow">{QA_HEAD.eyebrow[l]}</div>
            <h2>{QA_HEAD.title[l]}</h2>
            <p className="lede">{QA_HEAD.text[l]}</p>
          </Reveal>
          <Reveal className="openq" stagger>
            {investorQA(l).map((x) => (
              <div key={x.q}>
                <h3>{x.q}</h3>
                <p>{x.a}{x.src && <Src id={x.src} />}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap">
          <Reveal className="duo" stagger>
            <div>
              <h3>{DATA_ROOM.title[l]}</h3>
              <ul>{DATA_ROOM.items.map((s) => <li key={s.no}>{s[l]}</li>)}</ul>
              <p className="small dnote">{DATA_ROOM.reports[l]}</p>
            </div>
            <div>
              <h3>{PUBLIC_PARTNERS.title[l]}</h3>
              <ul>{PUBLIC_PARTNERS.items.map((s) => <li key={s.no}>{s[l]}</li>)}</ul>
              <p className="small dnote">{PUBLIC_PARTNERS.note[l]} <Link href={contact("access")}>{PUBLIC_PARTNERS.access[l]}</Link></p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="sec">
        <div className="wrap split">
          <Reveal className="stack">
            <div className="eyebrow">{FIGURES_PRINCIPLE.eyebrow[l]}</div>
            <h2>{FIGURES_PRINCIPLE.title[l]}</h2>
            <p className="measure">{FIGURES_PRINCIPLE.text[l]}</p>
            <div className="cta-row"><Link className="btn ghost" href={kHref("/kilder", l)}>{FIGURES_PRINCIPLE.sources[l]}</Link><Link className="btn ghost" href={dataRoom}>{INVESTORS_PAGE.dataRoom[l]}</Link></div>
          </Reveal>
          <Reveal className="mcard stack icheck" delay={120}>
            <h3>{CHECK_IT.title[l]}</h3>
            <p className="measure">{CHECK_IT.text[l]}</p>
            <div className="cta-row" style={{ marginTop: 4 }}><Link className="btn sm" href={kHref("/energi", l)}>{CHECK_IT.energy[l]}</Link><Link className="btn ghost sm" href={kHref("/dokumentbank", l)}>{CHECK_IT.documents[l]}</Link></div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
