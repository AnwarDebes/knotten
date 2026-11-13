import Reveal from "./Reveal";
import { Src } from "./Source";
import { companyBlock } from "@/lib/content/company";
import { OFFICES, fmt, type Lang } from "@/lib/facts";
import type { CompanyFacts } from "@/lib/store";

/**
 * "Om utbygger" in the Klassisk look: the company, its managing director, the buildings already standing on the
 * property, and the work with the University of Agder. The organisation number and the postal address appear
 * once the administrator has entered them (portal, Innstillinger).
 */
export default function AboutDeveloper({ locale, company, orgDisplay, alt = true, actions }: { locale: Lang; company: CompanyFacts; orgDisplay: string; alt?: boolean; /** links under the facts, such as the team page */ actions?: React.ReactNode }) {
  const b = companyBlock(locale, company, orgDisplay);
  const no = locale === "no";
  return (
    <section className={`sec${alt ? " alt" : ""}`} id="om-utbygger" aria-labelledby="om-utbygger-t">
      <div className="wrap split">
        <Reveal className="stack">
          <div className="eyebrow">{b.title}</div>
          <h2 id="om-utbygger-t">{no ? "Hvem som står bak" : "Who is behind it"}</h2>
          <p className="lede">{b.lede}</p>
          <dl className="devfacts">
            {b.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.href ? <a href={f.href} {...(f.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{f.value}</a> : f.value}</dd>
              </div>
            ))}
          </dl>
          {actions && <div className="cta-row" style={{ marginTop: 6 }}>{actions}</div>}
        </Reveal>
        <Reveal className="devcards" stagger delay={120}>
          <div>
            <h3>{b.proof.title}</h3>
            <p>{b.proof.text} <Src id="kontor" label={no ? "Kilde" : "Source"} /></p>
            <div className="numrow">
              <div><b>{fmt(OFFICES.now, locale)}</b><span>{no ? "kontorer ferdige i dag" : "offices completed today"}</span></div>
              <div><b>{fmt(OFFICES.after, locale)}</b><span>{no ? "kontorer etter utvidelsen" : "offices after the extension"}</span></div>
            </div>
          </div>
          <div>
            <h3>{b.uia.title}</h3>
            <p>{b.uia.text} <Src id="utlysning" label={no ? "Kilde" : "Source"} /></p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
