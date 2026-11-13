import type { Locale } from "@/lib/i18n";
import { companyBlock } from "@/lib/content/company";
import { OFFICES, fmt } from "@/lib/facts";
import type { CompanyFacts } from "@/lib/store";
import Src from "./Source";

/**
 * "Om utbygger" in the Moderne look: the company, its managing director, the buildings already standing on the
 * property, and the work with the University of Agder. The organisation number and the postal address appear
 * once the administrator has entered them (portal, Innstillinger).
 */
export default function AboutDeveloper({ locale, company, orgDisplay, actions }: { locale: Locale; company: CompanyFacts; orgDisplay: string; /** links under the facts, such as the team page */ actions?: React.ReactNode }) {
  const b = companyBlock(locale, company, orgDisplay);
  const no = locale === "no";
  return (
    <section id="om-utbygger" aria-labelledby="om-utbygger-t" className="wrap section-tight">
      <div className="panel overflow-hidden grid lg:grid-cols-[1.05fr_1fr]">
        <div className="p-7 md:p-12 grid content-start gap-6">
          <div>
            <div className="label mb-3">{b.title}</div>
            <h2 id="om-utbygger-t" className="display text-[clamp(32px,4.2vw,58px)] max-w-[14ch]">{no ? "Hvem som står bak." : "Who is behind it."}</h2>
            <p className="lede mt-5 max-w-[50ch]">{b.lede}</p>
          </div>
          <dl className="grid border-t line text-[15px]">
            {b.facts.map((f) => (
              <div key={f.label} className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-0.5 py-2.5 border-b line">
                <dt className="text-muted">{f.label}</dt>
                <dd className="text-ink break-words">{f.href ? <a href={f.href} className="underline-offset-4" {...(f.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{f.value}</a> : f.value}</dd>
              </div>
            ))}
          </dl>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        <div className="grid content-start gap-8 p-7 md:p-12 bg-bg-2/60 border-t lg:border-t-0 lg:border-l line">
          <div>
            <h3 className="display text-[26px]">{b.proof.title}</h3>
            <p className="mt-3 text-[15.5px] text-ink-2 max-w-[52ch]">{b.proof.text} <Src id="kontor" locale={locale} /></p>
            <div className="mt-5 grid grid-cols-2 gap-6 max-w-[420px]">
              <div><div className="num text-[44px]">{fmt(OFFICES.now, locale)}</div><div className="mt-1.5 text-[14px] text-ink-2">{no ? "kontorer ferdige i dag" : "offices completed today"}</div></div>
              <div><div className="num text-[44px]">{fmt(OFFICES.after, locale)}</div><div className="mt-1.5 text-[14px] text-ink-2">{no ? "kontorer etter utvidelsen" : "offices after the extension"}</div></div>
            </div>
          </div>
          <div>
            <h3 className="display text-[26px]">{b.uia.title}</h3>
            <p className="mt-3 text-[15.5px] text-ink-2 max-w-[52ch]">{b.uia.text} <Src id="utlysning" locale={locale} /></p>
          </div>
        </div>
      </div>
    </section>
  );
}
