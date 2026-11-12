import type { Inline, Statement } from "@/lib/content/privacy";
import type { Lang } from "@/lib/facts";
import Reveal from "./Reveal";

function Parts({ parts }: { parts: Inline[] }) {
  return <>{parts.map((x, i) => (typeof x === "string" ? x : <a key={i} href={x.href} {...(x.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{x.text}</a>))}</>;
}

/** The privacy statement (src/lib/content/privacy.ts) in the Klassisk look: contents to the left, the text to the right. */
export default function Privacy({ locale, s }: { locale: Lang; s: Statement }) {
  const no = locale === "no";
  return (
    <section className="sec">
      <div className="wrap split">
        <Reveal className="stack" style={{ alignSelf: "stretch" }}>
          <div className="eyebrow">{s.title}</div>
          <p><span className="version">{s.updated}</span></p>
          <nav className="toc" aria-label={no ? "Innhold" : "Contents"}>
            {s.sections.map((x) => <a key={x.id} href={`#${x.id}`}>{x.title}</a>)}
          </nav>
        </Reveal>
        <div className="legal-wrap">
          {s.sections.map((x) => (
            <section key={x.id} aria-labelledby={x.id} className="legal">
              <h2 id={x.id}>{x.title}</h2>
              {x.blocks.map((b, i) =>
                b.kind === "p" ? <p key={i}><Parts parts={b.parts} /></p> : <ul key={i}>{b.items.map((it, j) => <li key={j}><Parts parts={it} /></li>)}</ul>,
              )}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
