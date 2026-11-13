import Link from "next/link";
import { peekLink } from "@/lib/server/accounts";
import { kHref, type KLocale } from "@/lib/klassisk/locale";
import { KChoosePasswordForm } from "@/components/klassisk/AuthForms";
import { KConfirmLinkForm } from "@/components/klassisk/members/Forms";
import { MT } from "@/lib/member-text";
import { loginPagePath, registerPath } from "@/lib/member-paths";
import { page } from "@/lib/pages";

/** The page's title and description, for the two routes' metadata. */
export const passwordText = (locale: KLocale) =>
  locale === "en"
    ? { title: "Choose a password", description: "Where invitation, password and confirmation links from Knotten land." }
    : { title: "Velg passord", description: "Her lander invitasjoner, lenker for nytt passord og bekreftelser fra Knotten." };

/**
 * Where invitation, reset and confirmation links land in the Klassisk design, in Norwegian (/logg-inn/passord) and
 * English (/english/logg-inn/passord). A buyer's link that only confirms an address shows a button instead of the
 * password fields. Opening the page never uses the link up.
 */
export default async function KlassiskPassword({ locale, token }: { locale: KLocale; token: string }) {
  const no = locale === "no";
  const link = token ? await peekLink(token) : null;
  const m = MT[locale];
  const confirmOnly = !!link && (link.kind === "email-change" || (link.kind === "verify" && !!link.account.password));
  const h1 = { fontSize: "clamp(2rem,4vw,3rem)" };
  const login = loginPagePath("klassisk", locale);
  return (
    <section className="sec">
      <div className="wrap" style={{ maxWidth: 560 }}>
        <div className="crumb"><Link href={kHref("/", locale)}>{m.home}</Link> / <Link href={login}>{page("login").name[locale]}</Link> / {no ? "Passord" : "Password"}</div>
        {link && confirmOnly ? (
          <>
            <div className="eyebrow">{m.minSide}</div>
            <h1 style={h1}>{link.kind === "email-change" ? m.changeTitle : m.confirmTitle}</h1>
            <p className="lede mt" style={{ overflowWrap: "anywhere" }}>{link.kind === "email-change" ? m.changeText(link.email ?? "") : m.confirmText(link.account.email)}</p>
            <div style={{ marginTop: 24 }}><KConfirmLinkForm locale={locale} token={token} /></div>
          </>
        ) : link && link.kind === "verify" ? (
          <>
            <div className="eyebrow">{m.signupEyebrow}</div>
            <h1 style={h1}>{m.verifyTitle}</h1>
            <p className="lede mt" style={{ overflowWrap: "anywhere" }}>{m.verifyText(link.account.email)}</p>
            <div style={{ marginTop: 24 }}><KChoosePasswordForm locale={locale} token={token} email={link.account.email} /></div>
          </>
        ) : link ? (
          <>
            <div className="eyebrow">{page("portal").name[locale]}</div>
            <h1 style={h1}>{link.kind === "invite" ? `${no ? "Velkommen" : "Welcome"}, ${link.account.name.split(" ")[0]}` : no ? "Velg nytt passord" : "Choose a new password"}</h1>
            <p className="lede mt">
              {link.kind === "invite"
                ? no ? `Du er invitert til prosjektportalen for Knotten som ${link.account.email}. Velg et passord, så er du inne.` : `You are invited to the Knotten project portal as ${link.account.email}. Choose a password and you are in.`
                : no ? `For ${link.account.email}. Andre innlogginger på kontoen logges ut.` : `For ${link.account.email}. Other sessions on the account are logged out.`}
            </p>
            <div style={{ marginTop: 24 }}><KChoosePasswordForm locale={locale} token={token} email={link.account.email} /></div>
          </>
        ) : (
          <>
            <h1 style={h1}>{no ? "Lenken virker ikke" : "The link does not work"}</h1>
            <p className="lede mt">{no ? "Lenken er ugyldig, allerede brukt eller utløpt. Invitasjoner gjelder i sju dager og lenker for nytt passord i ett døgn. Be administratoren om en ny lenke." : "The link is invalid, already used or expired. Invitations last seven days and password links one day. Ask the administrator for a new link."}</p>
            <p className="small mt">{m.againSignup} <Link href={registerPath("klassisk", locale)}>{m.createAccount}</Link></p>
            <div className="cta-row"><Link className="btn" href={login}>{no ? "Til innlogging" : "To log in"}</Link></div>
          </>
        )}
      </div>
    </section>
  );
}
