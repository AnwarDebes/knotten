import type { Metadata } from "next";
import Link from "next/link";
import { peekLink } from "@/lib/server/accounts";
import { KChoosePasswordForm } from "@/components/klassisk/AuthForms";
import { KConfirmLinkForm } from "@/components/klassisk/members/Forms";
import { MT } from "@/lib/member-text";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Velg passord", robots: { index: false } };

/**
 * Where invitation, reset and confirmation links land in the Klassisk design. A buyer's link that only confirms an
 * address shows a button instead of the password fields. Opening the page never uses the link up.
 */
export default async function VelgPassord({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const link = token ? await peekLink(token) : null;
  const m = MT.no;
  const confirmOnly = !!link && (link.kind === "email-change" || (link.kind === "verify" && !!link.account.password));
  return (
    <section className="sec">
      <div className="wrap" style={{ maxWidth: 560 }}>
        <div className="crumb"><Link href="/">Forside</Link> / <Link href="/logg-inn">Logg inn</Link> / Passord</div>
        {link && confirmOnly ? (
          <>
            <div className="eyebrow">{m.minSide}</div>
            <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>{link.kind === "email-change" ? m.changeTitle : m.confirmTitle}</h1>
            <p className="lede mt" style={{ overflowWrap: "anywhere" }}>{link.kind === "email-change" ? m.changeText(link.email ?? "") : m.confirmText(link.account.email)}</p>
            <div style={{ marginTop: 24 }}><KConfirmLinkForm locale="no" token={token} /></div>
          </>
        ) : link && link.kind === "verify" ? (
          <>
            <div className="eyebrow">{m.signupEyebrow}</div>
            <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>{m.verifyTitle}</h1>
            <p className="lede mt" style={{ overflowWrap: "anywhere" }}>{m.verifyText(link.account.email)}</p>
            <div style={{ marginTop: 24 }}><KChoosePasswordForm token={token} email={link.account.email} /></div>
          </>
        ) : link ? (
          <>
            <div className="eyebrow">Prosjektportalen</div>
            <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>{link.kind === "invite" ? `Velkommen, ${link.account.name.split(" ")[0]}` : "Velg nytt passord"}</h1>
            <p className="lede mt">{link.kind === "invite" ? `Du er invitert til prosjektportalen for Knotten som ${link.account.email}. Velg et passord, så er du inne.` : `For ${link.account.email}. Andre innlogginger på kontoen logges ut.`}</p>
            <div style={{ marginTop: 24 }}><KChoosePasswordForm token={token} email={link.account.email} /></div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>Lenken virker ikke</h1>
            <p className="lede mt">Lenken er ugyldig, allerede brukt eller utløpt. Invitasjoner gjelder i sju dager og lenker for nytt passord i ett døgn. Be administratoren om en ny lenke.</p>
            <p className="small mt">{m.againSignup} <Link href="/registrer">{m.createAccount}</Link></p>
            <div className="cta-row"><Link className="btn" href="/logg-inn">Til innlogging</Link></div>
          </>
        )}
      </div>
    </section>
  );
}
