"use client";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { rememberDesign, switchHref, type Design } from "@/lib/design";

const LABELS = {
  no: { title: "Utseende", klassisk: "Klassisk", moderne: "Moderne" },
  en: { title: "Appearance", klassisk: "Classic", moderne: "Modern" },
};

const onHistory = (change: () => void) => {
  window.addEventListener("popstate", change);
  return () => window.removeEventListener("popstate", change);
};
const browserSearch = () => window.location.search;
const serverSearch = () => "";

/**
 * The slim strip above the header in both designs: "Utseende: Klassisk | Moderne". It sits in
 * the same corner in both, so a visitor can flip back and forth without hunting for it. The
 * markup is shared; each design dresses it in its own look (.dbar in the two globals.css).
 * The other design is a plain link, so it works before the page is interactive. It keeps the
 * query string (a link's token on the password pages, the chosen plot and purpose on the forms),
 * read in the browser so the pages stay static, and checked again at the moment of the click.
 */
export default function DesignSwitch({ current, locale = "no" }: { current: Design; locale?: "no" | "en" }) {
  const path = usePathname() ?? "/";
  const search = useSyncExternalStore(onHistory, browserSearch, serverSearch);
  // the portal is one back office behind the login, not part of the choice
  if (current === "moderne" && /^\/(no|en)\/portal(\/|$)/.test(path)) return null;
  const t = LABELS[locale];
  const href = switchHref(current, path, search);
  // the address as it is right now (a form may have changed the query string without a new render)
  const fresh = (a: HTMLAnchorElement) => { a.href = switchHref(current, window.location.pathname, window.location.search); };
  const item = (d: Design) =>
    d === current ? (
      <span key={d} aria-current="true">{t[d]}</span>
    ) : (
      <a key={d} href={href} onPointerDown={(e) => fresh(e.currentTarget)} onFocus={(e) => fresh(e.currentTarget)} onClick={(e) => { fresh(e.currentTarget); rememberDesign(d); }}>{t[d]}</a>
    );
  return (
    <div className="dbar">
      <div className="wrap dbar-in">
        <span className="dbar-label" id="dbar-label">{t.title}</span>
        <div className="dbar-seg" role="group" aria-labelledby="dbar-label">
          {item("klassisk")}
          {item("moderne")}
        </div>
      </div>
    </div>
  );
}
