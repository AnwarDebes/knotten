import Link from "next/link";
import PageHead from "@/components/klassisk/PageHead";
import Reveal from "@/components/klassisk/Reveal";
import { type KLocale } from "@/lib/klassisk/locale";
import { loginPagePath } from "@/lib/member-paths";
import { DOCUMENTS_PAGE, DOC_GROUPS, docRows, portalDocuments, type DocRow } from "@/lib/content/documents";

/**
 * "Dokumentbank" / "Document bank" in the Klassisk look, in both languages: rendered by /dokumentbank and
 * /english/dokumentbank. One register (src/lib/content/documents.ts), grouped by who is behind each document, the
 * same as the Moderne page. Documents behind the login open in the project portal, in the same tab.
 */
function Row({ d }: { d: DocRow }) {
  const inner = (
    <>
      <span className="ic" aria-hidden>{d.icon}</span>
      <span><span className="t">{d.title}</span><br /><span className="m">{d.what}</span> <span className="sr">({d.format})</span></span>
      <span className="m">{d.date}</span>
      <span className={d.login ? "lock" : "lock open"}>{d.accessLabel}</span>
    </>
  );
  // a file is fetched as it is; a page of the site or the portal goes through the router
  return d.file ? <a className="doc" href={d.href}>{inner}</a> : <Link className="doc" href={d.href}>{inner}</Link>;
}

export default function DocumentsPage({ locale: l }: { locale: KLocale }) {
  const login = `${loginPagePath("klassisk", l)}?next=${encodeURIComponent(portalDocuments(l))}`;
  return (
    <>
      <PageHead title={DOCUMENTS_PAGE.title[l]} crumb={DOCUMENTS_PAGE.title[l]} locale={l} aside={<Link className="btn ghost" href={login}>{DOCUMENTS_PAGE.login[l]}</Link>}>
        <p>{DOCUMENTS_PAGE.lede[l]}</p>
      </PageHead>
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal className="docs">
            {DOC_GROUPS.map((g) => (
              <div key={g.id}>
                <h2 className="grp">{g.name[l]}</h2>
                {docRows(g.id, "klassisk", l).map((d) => <Row key={d.key} d={d} />)}
              </div>
            ))}
          </Reveal>
          <Reveal className="stack doc-coming" style={{ marginTop: 40, maxWidth: "70ch" }}>
            <h2>{DOCUMENTS_PAGE.comingTitle[l]}</h2>
            <ul className="mticks">{DOCUMENTS_PAGE.coming.map((c) => <li key={c.no}>{c[l]}</li>)}</ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
