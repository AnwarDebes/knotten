import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PHOTOS } from "@/lib/klassisk/photos";
import { kHref, type KLocale } from "@/lib/klassisk/locale";
import { getSession, ROLE_LABEL, safeNext } from "@/lib/auth";
import { loadAuth, needsSetup, setupCode } from "@/lib/server/accounts";
import { CONTACT } from "@/lib/facts";
import { KLoginForm, KSetupForm } from "@/components/klassisk/AuthForms";
import ForgetWho from "@/components/klassisk/ForgetWho";
import { logout } from "@/app/(moderne)/[locale]/login/actions";
import { STORAGE } from "@/lib/server/kv";
import { STORAGE_MESSAGE } from "@/lib/errors";
import { MT } from "@/lib/member-text";
import { contactPath, minSidePath, registerPath } from "@/lib/member-paths";
import { page } from "@/lib/pages";

export type LoginSearch = { next?: string; slettet?: string; bekreftet?: string };

/** The page's title and description, for the two routes' metadata. */
export const loginText = (locale: KLocale) =>
  locale === "en"
    ? { title: "Log in", description: "Log in to My page, for buyers, or to the project portal, for the people the project has invited." }
    : { title: "Logg inn", description: "Logg inn på Min side, for kjøpere, eller i prosjektportalen, for dem prosjektet har invitert." };

const PHOTO_EN = { alt: "Sniksfjorden seen from the heights at Snig, out towards the sea", caption: "Sniksfjorden seen from the heights at Snig, with open sea at the end of the fjord" };

/**
 * The way in to Min side and the project portal in the Klassisk design, in Norwegian (/logg-inn) and English
 * (/english/logg-inn). The same accounts, checks and portal as the Moderne design; only the look differs.
 */
export default async function KlassiskLogin({ locale, search }: { locale: KLocale; search: LoginSearch }) {
  const { next, slettet, bekreftet } = search;
  const no = locale === "no";
  const p = PHOTOS.sniksfjorden;
  const session = await getSession();
  if (session && next) redirect(safeNext(next, locale));
  // without storage nobody can have an account yet: say so instead of showing forms that cannot work
  const noStorage = !session && STORAGE === "temp";
  const firstRun = !session && !noStorage && (await needsSetup());
  const code = firstRun ? await setupCode() : undefined;
  const owner = firstRun ? (await loadAuth()).accounts.find((a) => a.role === "superadmin") : undefined;
  const m = MT[locale];
  const member = session?.kind === "member";
  // after a buyer deleted the account, or confirmed an address from a link while logged out
  const notice = slettet ? m.deletedNotice : bekreftet ? m.confirmedNotice : "";
  const h1 = { fontSize: "clamp(2rem,4vw,3rem)" };
  return (
    <div className="login">
      {!session && <ForgetWho />}
      <div className="box">
        <div className="crumb"><Link href={kHref("/", locale)}>{m.home}</Link> / {page("login").name[locale]}</div>
        <div className="eyebrow">{page("login").about[locale]}</div>
        {session ? (
          <>
            <h1 style={h1}>{no ? "Du er logget inn" : "You are logged in"}</h1>
            <p className="lede mt">{session.name}, {member ? (no ? "kjøperkonto" : "buyer account") : ROLE_LABEL[session.role][locale].toLowerCase()}. {session.email}</p>
            <form action={logout} className="cta-row">
              <input type="hidden" name="to" value={kHref("/logg-inn", locale)} />
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="design" value="klassisk" />
              {member ? <Link className="btn" href={minSidePath("klassisk", locale)}>{m.toMinSide}</Link> : <Link className="btn" href={`/${locale}/portal`}>{no ? "Gå til portalen" : "Go to the portal"}</Link>}
              <button className="btn ghost" type="submit">{no ? "Logg ut" : "Log out"}</button>
            </form>
          </>
        ) : noStorage ? (
          <>
            <h1 style={h1}>{page("login").name[locale]}</h1>
            <div className="auth-msg err" role="status" style={{ marginTop: 24 }}>{STORAGE_MESSAGE[locale]}</div>
            <p className="small" style={{ marginTop: 24 }}>{no ? `Skriv til ${CONTACT.email} om du trenger noe fra prosjektet nå.` : `Write to ${CONTACT.email} if you need something from the project now.`}</p>
          </>
        ) : firstRun ? (
          <>
            <h1 style={h1}>{no ? "Første oppsett" : "First-time setup"}</h1>
            <p className="lede mt">{no ? "Portalen har ingen administrator med passord ennå. Den som setter opp nettstedet, oppretter den første kontoen her. Etterpå inviteres resten fra portalen." : "The portal has no administrator with a password yet. Whoever sets up the site creates the first account here. Everyone else is then invited from the portal."}</p>
            <div style={{ marginTop: 24 }}><KSetupForm locale={locale} email={owner?.email ?? CONTACT.email} name={owner?.name ?? CONTACT.name} devCode={process.env.NODE_ENV !== "production" ? code : undefined} /></div>
          </>
        ) : (
          <>
            <h1 style={h1}>{page("login").name[locale]}</h1>
            <p className="lede mt">{no ? "Min side for kjøpere, og prosjektportalen for prosjektgruppen, investorer, kommunen, forskere og beboere. Bruk e-postadressen kontoen er laget med." : "My page for buyers, and the project portal for the project group, investors, the municipality, researchers and residents. Use the email address the account was made with."}</p>
            {notice && <div className="auth-msg ok" role="status" style={{ marginTop: 24 }}>{notice}</div>}
            <div style={{ marginTop: 24 }}><KLoginForm locale={locale} next={next} /></div>
            <p className="small" style={{ marginTop: 24 }}>{m.newHere} <Link href={registerPath("klassisk", locale)}>{m.createAccount}</Link>{no ? " for å følge tomtene og lagre husene du setter sammen." : " to follow the plots and save the houses you configure."}</p>
            <p className="small" style={{ marginTop: 8 }}>{no ? "Har du ikke tilgang ennå? " : "No access yet? "}<Link href={contactPath("klassisk", locale)}>{m.requestAccess}</Link>{no ? `, eller skriv til ${CONTACT.email}.` : `, or write to ${CONTACT.email}.`}</p>
          </>
        )}
      </div>
      <div className="side">
        <Image src={p.src} alt={no ? p.alt : PHOTO_EN.alt} width={p.w} height={p.h} sizes="50vw" quality={80} />
        <div className="hero-cap">{no ? p.caption : PHOTO_EN.caption}. {no ? "Foto" : "Photo"}: {p.credit}, {p.license}</div>
      </div>
    </div>
  );
}
