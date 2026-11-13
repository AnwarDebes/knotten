"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session-client";
import type { Who } from "@/lib/auth-shared";
import { loginPagePath, minSidePath, registerPath } from "@/lib/member-paths";
import { label, matchModerne, menuPages, moderneLink, page, type Page } from "@/lib/pages";
import Logo from "./Logo";
import { CONTACT, FACT } from "@/lib/facts";

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

/** The account link that follows the session: Logg inn when signed out, Min side for a buyer, Portalen for a project account. */
function account(session: Who | null, locale: Locale): { href: string; text: string } {
  if (!session) return { href: loginPagePath("moderne", locale), text: page("login").name[locale] };
  if (session.kind === "member") return { href: minSidePath("moderne", locale), text: page("mine").name[locale] };
  return { href: `/${locale}/portal`, text: label(page("portal"), locale, true) };
}

/**
 * The header: the logo, one sentence about the place on the front page (on the other pages, the page you are on),
 * the language, the account and Meld interesse, and the menu. It floats over the page and turns to glass once you
 * scroll. The menu opens as a sheet with every page from the page registry (src/lib/pages.ts) in large type. On a
 * phone the account and Meld interesse stay in the bar; the language moves into the sheet.
 */
export default function Nav({ locale }: { locale: Locale; dark?: boolean }) {
  const d = t(locale);
  const no = locale === "no";
  const p = (path: string) => `/${locale}${path}`;
  const other = locale === "no" ? "en" : "no";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // the menu sheet starts where the header ends, which is lower while the design strip above is in view
  const header = useRef<HTMLElement>(null);
  const [sheetTop, setSheetTop] = useState<number>();
  const session = useSession();
  const router = useRouter();
  const here = usePathname() ?? `/${locale}`;
  // the same page in the other language, with the query and the section; checked again at the click, since a page
  // may change its address without a new render (the configurator writes its choices into it)
  const query = useSyncExternalStore(onHistory, browserRest, serverEmpty);
  const otherPath = here.replace(/^\/(no|en)(?=\/|$)/, `/${other}`);
  const otherHref = otherPath + query;
  const switchLang = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    const live = window.location.search + window.location.hash;
    if (live === query || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    router.push(otherPath + live);
  };

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);
  // the sheet covers the page: Escape closes it and the focus goes back to the button that opened it
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  // the page this is, or the section it belongs to (a plot page belongs to Tomtene)
  const rest = here.replace(/^\/(no|en)(?=\/|$)/, "");
  const found = matchModerne(rest);
  const exact = found && !found.pattern ? found.page : null;
  const section = found && found.page.key !== "home" && found.page.key !== "portal" ? found.page : null;
  const mark = (x: Page) => (exact?.key === x.key ? "page" : section?.key === x.key ? "true" : undefined);
  const acct = account(session, locale);
  const interest = moderneLink(page("interest"), locale) ?? p("/interesse");
  const close = () => setOpen(false);
  const sectionHref = section ? moderneLink(section, locale) : null;

  return (
    <>
    <a className="skip" href="#innhold">{no ? "Hopp til innholdet" : "Skip to content"}</a>
    <header ref={header} className="sticky top-0 z-50 text-bone" style={{ height: "var(--nav-h)" }}>
      <div className={`absolute inset-0 transition-opacity duration-300 ${scrolled && !open ? "opacity-100" : "opacity-0"} bg-bg/85`} style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
      <div className="wrap relative h-full grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-6">
        <Link href={p("")} className="no-underline flex items-center" aria-label={no ? "Knotten, til forsiden" : "Knotten, to the front page"} onClick={close}>
          <Logo height={52} className="max-sm:!h-[40px]" />
        </Link>

        <div className={`min-w-0 ${section && sectionHref ? "justify-self-start" : "justify-self-center"}`}>
          {section && sectionHref ? (
            <Link href={sectionHref} aria-current={mark(section)} className="hidden md:inline-flex items-center gap-2 no-underline text-[15px] font-medium text-ink-2 hover:text-ink whitespace-nowrap">
              <span className="w-[6px] h-[6px] rounded-full bg-amber" aria-hidden />
              <span className="sr-only">{no ? "Du er her: " : "You are here: "}</span>
              {label(section, locale, true)}
            </Link>
          ) : (
            <p className={`hidden lg:block max-w-[44ch] text-[15px] leading-snug text-center transition-opacity ${scrolled ? "opacity-0" : "opacity-80"}`}>
              {no ? `Planlagt som Norges mest energivennlige boligfelt. Rundt ${FACT.plots} boliger på Knotten i Lindesnes, over Sniksfjorden.` : `Planned as Norway's most energy-friendly housing development. About ${FACT.plots} homes on Knotten in Lindesnes, above Sniksfjorden.`}
            </p>
          )}
        </div>

        <div className="justify-self-end flex items-center gap-1.5 sm:gap-2">
          <span className="lang-seg hidden sm:inline-flex" role="group" aria-label={no ? "Språk" : "Language"}>
            {(["no", "en"] as const).map((l) =>
              l === locale ? (
                <span key={l} className="on" aria-current="true" lang={l === "no" ? "nb" : "en"}>{l.toUpperCase()}</span>
              ) : (
                <Link key={l} href={otherHref} onClick={switchLang} hrefLang={l === "no" ? "nb" : "en"} lang={l === "no" ? "nb" : "en"} aria-label={l === "en" ? "EN, read this page in English" : "NO, les denne siden på norsk"}>{l.toUpperCase()}</Link>
              ),
            )}
          </span>
          {!session && <Link href={registerPath("moderne", locale)} className="hidden xl:inline no-underline text-[14px] font-medium text-fjord hover:text-ink px-2">{page("register").name[locale]}</Link>}
          <Link href={acct.href} title={session?.name || undefined} className="btn btn-ghost btn-sm no-underline max-sm:before:hidden max-sm:!px-3">{acct.text}</Link>
          <Link className="btn btn-sm no-underline max-sm:before:hidden max-sm:!px-3" href={interest}>{page("interest").name[locale]}</Link>
          <button ref={toggle} className={`btn btn-sm btn-plain max-sm:!px-3 max-sm:min-h-[36px] ${open ? "" : "btn-ghost"}`} onClick={() => { setSheetTop(header.current?.getBoundingClientRect().bottom); setOpen((o) => !o); }} aria-expanded={open} aria-controls={open ? "menu" : undefined}>
            <span className="max-sm:sr-only">{open ? d.nav.close : d.nav.menu}</span>
            <span className="inline-flex gap-[3px] sm:ml-1" aria-hidden>
              <span className="w-[5px] h-[5px] rounded-full bg-current" /><span className="w-[5px] h-[5px] rounded-full bg-current" />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div id="menu" className="fixed inset-0 z-40 bg-bg text-bone overflow-auto overscroll-contain" style={{ top: sheetTop ?? "var(--nav-h)" }}>
          <nav aria-label={no ? "Hovedmeny" : "Main menu"} className="wrap py-8 md:py-12 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div className="grid">
              {menuPages("main").map((x, i) => (
                <Link key={x.key} href={moderneLink(x, locale)!} onClick={close} aria-current={mark(x)} className="no-underline group grid sm:grid-cols-[1fr_auto] items-baseline gap-x-6 py-2 border-b line rise-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <span className="display text-[clamp(28px,4.2vw,54px)] group-hover:text-fjord group-aria-[current]:text-fjord transition-colors">
                    {label(x, locale, true)}
                    {mark(x) && <span className="inline-block align-middle ml-3 w-[9px] h-[9px] rounded-full bg-amber" aria-hidden />}
                  </span>
                  <span className="text-[14px] text-granite">{x.about[locale]}</span>
                </Link>
              ))}
            </div>
            <div className="grid content-start gap-5 text-[15px]">
              <div className="flex flex-wrap gap-2">
                <Link href={acct.href} onClick={close} className="btn btn-ghost no-underline">{acct.text}</Link>
                {!session && <Link href={registerPath("moderne", locale)} onClick={close} className="btn btn-ghost no-underline">{page("register").name[locale]}</Link>}
                <Link className="btn no-underline" href={interest} onClick={close}>{page("interest").name[locale]}</Link>
              </div>
              <ul className="grid gap-1 mt-2">
                {menuPages("more").map((x) => (
                  <li key={x.key}>
                    <Link href={moderneLink(x, locale)!} onClick={close} aria-current={mark(x)} className="no-underline inline-flex items-center gap-2 py-1.5 text-[17px] text-ink-2 hover:text-ink aria-[current]:text-ink aria-[current]:font-medium">
                      {x.name[locale]}
                      {mark(x) && <span className="w-[6px] h-[6px] rounded-full bg-amber" aria-hidden />}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={otherHref} onClick={switchLang} hrefLang={other === "no" ? "nb" : "en"} lang={other === "no" ? "nb" : "en"} className="no-underline text-granite hover:text-bone">{other === "en" ? "Read this in English" : "Les dette på norsk"}</Link>
              <p className="text-granite max-w-[36ch] mt-4">{`${CONTACT.place}. ${CONTACT.company}.`}</p>
            </div>
          </nav>
        </div>
      )}
    </header>
    <div id="innhold" tabIndex={-1} className="outline-none" />
    </>
  );
}
