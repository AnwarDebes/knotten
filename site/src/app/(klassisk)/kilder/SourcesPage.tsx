import Link from "next/link";
import PageHead from "@/components/klassisk/PageHead";
import Reveal from "@/components/klassisk/Reveal";
import { Src } from "@/components/klassisk/Source";
import { kHref, type KLocale } from "@/lib/klassisk/locale";
import type { Status } from "@/lib/facts";
import { SOURCES_PAGE, SOURCE_GROUPS, STATUS_ORDER, STATUS_TEXT, statusLabel } from "@/lib/content/sources";
import { DOCUMENTS_PAGE } from "@/lib/content/documents";

const TAG: Record<Status, string> = { fastsatt: "tag green", verifisert: "tag green", beregnet: "tag blue", foreløpig: "tag" };

/**
 * "Kilder og forutsetninger" / "Sources and assumptions" in the Klassisk look, in both languages: rendered by
 * /kilder and /english/kilder. One table for every number on the website (src/lib/content/sources.ts), the same as
 * the Moderne page; on a phone each row is a small card instead of a table that runs off the screen.
 */
export default function SourcesPage({ locale: l }: { locale: KLocale }) {
  const c = SOURCES_PAGE.columns;
  return (
    <>
      <PageHead title={SOURCES_PAGE.title[l]} crumb={SOURCES_PAGE.title[l]} locale={l}>
        <p>{SOURCES_PAGE.lede[l]}</p>
        <p className="small">{SOURCES_PAGE.version(l)}</p>
      </PageHead>
      <section className="sec" style={{ paddingTop: 32 }}>
        <div className="wrap">
          <Reveal className="tbl srcs">
            <table>
              <caption className="sr">{SOURCES_PAGE.title[l]}</caption>
              <thead>
                <tr><th scope="col">{c.what[l]}</th><th scope="col">{c.value[l]}</th><th scope="col">{c.unit[l]}</th><th scope="col">{c.status[l]}</th><th scope="col">{c.owner[l]}</th><th scope="col">{c.source[l]}</th></tr>
              </thead>
              {SOURCE_GROUPS.map((g) => (
                <tbody key={g.id}>
                  <tr className="grp">
                    <th colSpan={6} scope="colgroup">{g.title[l]}{g.note && <span>{g.note[l]}</span>}</th>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.key}>
                      <th scope="row">{r.what[l]}</th>
                      <td>{r.value[l]}</td>
                      <td>{r.unit[l]}</td>
                      <td><span className={TAG[r.status]} style={{ marginBottom: 0 }}>{statusLabel(r.status, l)}</span></td>
                      <td>{r.owner[l]}</td>
                      <td><Src id={r.src} /></td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </Reveal>

          <div className="srcs-cards">
            {SOURCE_GROUPS.map((g) => (
              <section key={g.id} aria-labelledby={`k-${g.id}`}>
                <h2 id={`k-${g.id}`}>{g.title[l]}</h2>
                {g.note && <p className="small">{g.note[l]}</p>}
                <ul>
                  {g.rows.map((r) => (
                    <li key={r.key}>
                      <span className="w">{r.what[l]}</span>
                      <span className="v">{r.value[l]} <span>{r.unit[l]}</span></span>
                      <span className="o"><span className={TAG[r.status]} style={{ marginBottom: 0 }}>{statusLabel(r.status, l)}</span> {r.owner[l]} <Src id={r.src} /></span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="split" style={{ marginTop: 56 }}>
            <Reveal className="stack">
              <h2>{SOURCES_PAGE.legendTitle[l]}</h2>
              <p className="lede">{SOURCES_PAGE.principle[l]}</p>
              <div className="cta-row"><Link className="btn ghost" href={kHref("/dokumentbank", l)}>{DOCUMENTS_PAGE.title[l]}</Link><Link className="btn ghost" href={kHref("/energi", l)}>{l === "no" ? "Energi og teknologi" : "Energy and technology"}</Link></div>
            </Reveal>
            <Reveal className="openq srclegend" stagger>
              {STATUS_ORDER.map((s) => (
                <div key={s}>
                  <h3><span className={TAG[s]} style={{ marginBottom: 0 }}>{statusLabel(s, l)}</span></h3>
                  <p>{STATUS_TEXT[s][l]}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
