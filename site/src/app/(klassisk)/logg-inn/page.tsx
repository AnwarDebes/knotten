import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PHOTOS } from "@/lib/klassisk/photos";
import { getSession, ROLE_LABEL, safeNext } from "@/lib/auth";
import { loadAuth, needsSetup, setupCode } from "@/lib/server/accounts";
import { CONTACT } from "@/lib/facts";
import { KLoginForm, KSetupForm } from "@/components/klassisk/AuthForms";
import ClearWho from "@/components/auth/ClearWho";
import { logout } from "@/app/(moderne)/[locale]/login/actions";
import { STORAGE } from "@/lib/server/kv";
import { STORAGE_MESSAGE } from "@/lib/errors";
import { MT } from "@/lib/member-text";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Logg inn", robots: { index: false } };

/**
 * The way into the project portal in the Klassisk design. The same accounts, checks and portal
 * as the Moderne design; only the look differs.
 */
export default async function LoggInn({ searchParams }: { searchParams: Promise<{ next?: string; slettet?: string; bekreftet?: string }> }) {
  const { next, slettet, bekreftet } = await searchParams;
  const p = PHOTOS.sniksfjorden;
  const session = await getSession();
  if (session && next) redirect(safeNext(next, "no"));
  // without storage nobody can have an account yet: say so instead of showing forms that cannot work
  const noStorage = !session && STORAGE === "temp";
  const firstRun = !session && !noStorage && (await needsSetup());
  const code = firstRun ? await setupCode() : undefined;
  const owner = firstRun ? (await loadAuth()).accounts.find((a) => a.role === "superadmin") : undefined;
  const m = MT.no;
  const member = session?.kind === "member";
  // after a buyer deleted the account, or confirmed an address from a link while logged out
  const notice = slettet ? m.deletedNotice : bekreftet ? m.confirmedNotice : "";
  return (
    <div className="login">
      {!session && <ClearWho />}
      <div className="box">
        <div className="crumb"><Link href="/">Forside</Link> / Logg inn</div>
        <div className="eyebrow">Prosjektportalen</div>
        {session ? (
          <>
            <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>Du er logget inn</h1>
            <p className="lede mt">{session.name}, {member ? "kjøperkonto" : ROLE_LABEL[session.role].no.toLowerCase()}. {session.email}</p>
            <form action={logout} className="cta-row">
              <input type="hidden" name="to" value="/logg-inn" />
              <input type="hidden" name="design" value="klassisk" />
              {member ? <Link className="btn" href="/min-side">{m.toMinSide}</Link> : <Link className="btn" href="/no/portal">Gå til portalen</Link>}
              <button className="btn ghost" type="submit">Logg ut</button>
            </form>
          </>
        ) : noStorage ? (
          <>
            <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>Logg inn</h1>
            <div className="auth-msg err" role="status" style={{ marginTop: 24 }}>{STORAGE_MESSAGE.no}</div>
            <p className="small" style={{ marginTop: 24 }}>Skriv til {CONTACT.email} om du trenger noe fra prosjektet nå.</p>
          </>
        ) : firstRun ? (
          <>
            <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>Første oppsett</h1>
            <p className="lede mt">Portalen har ingen administrator med passord ennå. Den som setter opp nettstedet, oppretter den første kontoen her. Etterpå inviteres resten fra portalen.</p>
            <div style={{ marginTop: 24 }}><KSetupForm email={owner?.email ?? CONTACT.email} name={owner?.name ?? CONTACT.name} devCode={process.env.NODE_ENV !== "production" ? code : undefined} /></div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>Logg inn</h1>
            <p className="lede mt">Min side for kjøpere, og prosjektportalen for prosjektgruppen, investorer, kommunen, forskere og beboere. Bruk e-postadressen kontoen er laget med.</p>
            {notice && <div className="auth-msg ok" role="status" style={{ marginTop: 24 }}>{notice}</div>}
            <div style={{ marginTop: 24 }}><KLoginForm next={next} /></div>
            <p className="small" style={{ marginTop: 24 }}>{m.newHere} <Link href="/registrer">{m.createAccount}</Link> for å følge tomtene og lagre husene du setter sammen.</p>
            <p className="small" style={{ marginTop: 8 }}>Har du ikke tilgang ennå? <Link href="/kontakt">Be om tilgang</Link>, eller skriv til {CONTACT.email}.</p>
          </>
        )}
      </div>
      <div className="side">
        <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="50vw" quality={80} />
        <div className="hero-cap">{p.caption}. Foto: {p.credit}, {p.license}</div>
      </div>
    </div>
  );
}
