"use client";
import Link from "next/link";
import Logo from "./Logo";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSession } from "@/lib/session-client";
import { klassiskLangHref } from "@/lib/design";
import { kHref, kSplit } from "@/lib/klassisk/locale";
import { minSidePath, registerPath, loginPagePath } from "@/lib/member-paths";
import { headerPages, klassiskLink, label, matchKlassisk, page } from "@/lib/pages";

const onHistory = (change: () => void) => {
  window.addEventListener("popstate", change);
  window.addEventListener("hashchange", change);
  return () => {
    window.removeEventListener("popstate", change);
    window.removeEventListener("hashchange", change);
  };
};
const browserRest = () => window.location.search + window.location.hash;
const serverEmpty = () => "";

/**
 * The Klassisk header in Norwegian and English: the logo, the main pages from the page registry (src/lib/pages.ts),
 * NO | EN (the same page in the other language), the account link that follows the session, and Meld interesse.
 * The full row needs about 1220 px; below that it folds into "Meny".
 */
export default function Header() {
  const path = usePathname() ?? "/";
  const { locale, path: here } = kSplit(path);
  const no = locale === "no";
  const other = no ? "en" : "no";
  const [open, setOpen] = useState(false);
  const session = useSession();
  const rest = useSyncExternalStore(onHistory, browserRest, serverEmpty);
  const toggle = useRef<HTMLButtonElement>(null);
  // close the menu when the page changes (adjusting state during render, not in an effect)
  const [shownFor, setShownFor] = useState(path);
  if (shownFor !== path) {
    setShownFor(path);
    setOpen(false);
  }
  // the open menu closes with Escape, and the focus goes back to the button that opened it
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  // the page this is, or the section it belongs to (a plot page belongs to Tomtene)
  const current = matchKlassisk(here);
  const section = current?.pattern ? current.page.key : null;
  const [q, h = ""] = rest.split("#");
  const langHref = klassiskLangHref(path, q, h ? `#${h}` : "", other);
  const fresh = (a: HTMLAnchorElement) => { a.href = klassiskLangHref(window.location.pathname, window.location.search, window.location.hash, other); };
  const interest = klassiskLink(page("interest"), locale) ?? kHref("/kontakt", locale);

  return (
    <header className="top">
      <div className="wrap">
        <Link className="brand" href={kHref("/", locale)} aria-label={no ? "Knotten, til forsiden" : "Knotten, to the front page"}>
          <Logo locale={locale} />
        </Link>
        <button ref={toggle} className="burger" aria-expanded={open} aria-controls="nav" onClick={() => setOpen((o) => !o)}>
          {no ? "Meny" : "Menu"}
        </button>
        <nav className={`nav${open ? " open" : ""}`} id="nav" aria-label={no ? "Hovedmeny" : "Main menu"}>
          {headerPages("klassisk").map((p) => {
            const href = kHref(p.klassisk!, locale);
            const on = here === p.klassisk ? "page" : section === p.key ? "true" : undefined;
            return <Link key={p.key} href={href} aria-current={on}>{label(p, locale, true)}</Link>;
          })}
          <div className="tools">
            <span className="lang" role="group" aria-label={no ? "Språk" : "Language"}>
              {(["no", "en"] as const).map((l) =>
                l === locale ? (
                  <span key={l} className="on" aria-current="true" lang={l === "no" ? "nb" : "en"}>{l.toUpperCase()}</span>
                ) : (
                  <a key={l} href={langHref} hrefLang={l === "no" ? "nb" : "en"} lang={l === "no" ? "nb" : "en"} onPointerDown={(e) => fresh(e.currentTarget)} onFocus={(e) => fresh(e.currentTarget)} onClick={(e) => fresh(e.currentTarget)} aria-label={l === "en" ? "EN, read this page in English" : "NO, les denne siden på norsk"}>{l.toUpperCase()}</a>
                ),
              )}
            </span>
            {!session ? (
              <>
                <Link className="acct" href={registerPath("klassisk", locale)}>{page("register").name[locale]}</Link>
                <Link className="btn ghost sm" href={loginPagePath("klassisk", locale)}>{page("login").name[locale]}</Link>
              </>
            ) : session.kind === "member" ? (
              <Link className="btn ghost sm" href={minSidePath("klassisk", locale)}>{page("mine").name[locale]}</Link>
            ) : (
              <Link className="btn ghost sm" href={`/${locale}/portal`} title={session.name || undefined}>{label(page("portal"), locale, true)}</Link>
            )}
            <Link className="btn sm" href={interest}>{page("interest").name[locale]}</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
