import Link from "next/link";
import Logo from "./Logo";
import OwnerLogo from "./OwnerLogo";
import Credits, { CreditsLine } from "./Credits";
import { CONTACT } from "@/lib/facts";
import { formatOrgNumber, loadPublicSettings } from "@/lib/server/siteSettings";

export default async function Footer() {
  const { company } = await loadPublicSettings();
  const email = company.email || CONTACT.email;
  const phone = company.phone || CONTACT.phone_intl;
  return (
    <footer className="site">
      <div className="wrap">
        <div>
          <Link className="flogo" href="/">
            <Logo size={64} light />
          </Link>
          <p className="note">
            Planlagt som Norges mest energivennlige boligfelt, på Rødberg i Lindesnes. Alle tall på siden er foreløpige anslag som kan spores til dokumenterte forutsetninger. Ingenting her er et tilbud.
          </p>
        </div>
        <div>
          <h3>Prosjektet</h3>
          <Link href="/">Forside</Link>
          <Link href="/prosjektet">Om prosjektet</Link>
          <Link href="/tomtene">Tomtene</Link>
          <Link href="/kart">Kart og terreng</Link>
          <Link href="/energi">Energi og teknologi</Link>
          <Link href="/eksisterende-bygg">Eksisterende bygg</Link>
          <Link href="/galleri">Bilder</Link>
        </div>
        <div>
          <h3>For deg</h3>
          <Link href="/status">Status og spørsmål</Link>
          <Link href="/investorer">Investorer og kommune</Link>
          <Link href="/dokumentbank">Dokumentbank</Link>
          <Link href="/kilder">Kilder og forutsetninger</Link>
          <Link href="/kontakt">Meld interesse</Link>
          <Link href="/logg-inn">Logg inn</Link>
        </div>
        <div>
          <h3>Kontakt</h3>
          <span style={{ display: "block", padding: "4px 0 8px", fontSize: ".95rem" }}>{`Prosjekteier: ${CONTACT.company}`}</span>
          <a href={`mailto:${email}`}>{email}</a>
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
          {company.postal_address && <span style={{ display: "block", padding: "4px 0", fontSize: ".95rem" }}>{company.postal_address}</span>}
          <span style={{ display: "block", padding: "4px 0", fontSize: ".95rem" }}>{CONTACT.place}</span>
          {company.org_number && <span className="orgnr" style={{ display: "block", padding: "4px 0", fontSize: ".95rem" }}>{`Org.nr. ${formatOrgNumber(company.org_number)}`}</span>}
        </div>
        <div className="bottom">
          <OwnerLogo light />
          <CreditsLine locale="no" />
          <Link href="/personvern">Personvern</Link>
          <Credits locale="no" />
        </div>
      </div>
    </footer>
  );
}
