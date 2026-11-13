import PageHead from "@/components/klassisk/PageHead";
import InterestForm from "@/components/klassisk/InterestForm";
import OwnerLogo from "@/components/klassisk/OwnerLogo";
import { kHref, type KLocale } from "@/lib/klassisk/locale";
import { loadPlots } from "@/lib/data";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";
import { CONTACT_PAGE, contactDetails, formHead } from "@/lib/content/contact";
import { leadQuery } from "@/lib/leadForm";
import { registerPath } from "@/lib/member-paths";

export type ContactQuery = Record<string, string | string[] | undefined>;

/**
 * "Kontakt" / "Contact" in the Klassisk look, in both languages: rendered by /kontakt and /english/kontakt. The
 * project owner's details, where the field is, and the one interest form ("Meld interesse", or "Be om tilgang" for
 * /kontakt?rolle=tilgang), the same choices as the Moderne pages /{l}/kontakt and /{l}/interesse.
 */
export default async function ContactPage({ locale: l, query }: { locale: KLocale; query: ContactQuery }) {
  const [{ company }, { plots }] = await Promise.all([loadPublicSettings(), loadPlots()]);
  const c = contactDetails(l, company, formatOrgNumber(company.org_number));
  const { role, plots: preselect } = leadQuery(query);
  const head = formHead(role, l);
  return (
    <>
      <PageHead title={CONTACT_PAGE.title[l]} crumb={CONTACT_PAGE.title[l]} locale={l}>
        <p>{CONTACT_PAGE.lede[l]} {CONTACT_PAGE.sales[l]}</p>
      </PageHead>
      <section className="sec">
        <div className="wrap split">
          <div className="stack">
            <OwnerLogo />
            <div className="contact">
              <b>{c.company}</b>
              <span>{CONTACT_PAGE.owner[l]}</span>
              <span>{c.role}: {c.name}</span>
              {c.org && <span>{c.org}</span>}
              {c.postal && <span>{c.postal}</span>}
              <a href={`mailto:${c.email}`}>{c.email}</a>
              <a href={`tel:${c.tel}`}>{c.phone}</a>
            </div>
            <div className="contact">
              <b>{CONTACT_PAGE.where[l]}</b>
              <span>{c.place}</span>
              <span>{c.coords}</span>
              <span className="small">{CONTACT_PAGE.whereNote[l]}</span>
              <a href={c.mapUrl} target="_blank" rel="noopener noreferrer">{CONTACT_PAGE.map[l]}</a>
            </div>
            <p className="small measure">{CONTACT_PAGE.privacy[l]}</p>
          </div>
          <div className="stack" id="meld-interesse">
            <h2>{head.title}</h2>
            <p className="measure kform-lede">{head.text}</p>
            <InterestForm locale={l} role={role} plots={plots.map((p) => p.id)} preselect={preselect} privacyHref={kHref("/personvern", l)} accountHref={registerPath("klassisk", l)} level={3} />
          </div>
        </div>
      </section>
    </>
  );
}
