"use client";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { rememberDesign, switchHref, type Design } from "@/lib/design";
import { kSplit } from "@/lib/klassisk/locale";

const LABELS = {
  no: { title: "Utseende", klassisk: "Klassisk", moderne: "Moderne" },
  en: { title: "Appearance", klassisk: "Classic", moderne: "Modern" },
};

const onHistory = (change: () => void) => {
  window.addEventListener("popstate", change);
  window.addEventListener("hashchange", change);
  return () => {
    window.removeEventListener("popstate", change);
    window.removeEventListener("hashchange", change);
  };
};
const browserSearch = () => window.location.search;
const browserHash = () => window.location.hash;
const serverEmpty = () => "";

/**
 * The slim strip above the header in both designs: "Utseende: Klassisk | Moderne", in English on the English pages.
 * It sits in the same corner in both, so a visitor can flip back and forth without hunting for it. The markup is
 * shared; each design dresses it in its own look (.dbar in the two globals.css). The other design is a plain link,
 * so it works before the page is interactive. It opens the matching page in the same language (src/lib/design.ts)
 * and keeps the query string (a link's token on the password pages, the chosen plot and purpose on the forms, the
 * configurator's choices) and the section, read in the browser so the pages stay static, and checked again at the
 * moment of the click.
 */
export default function DesignSwitch({ current, locale }: { current: Design; locale?: "no" | "en" }) {
  const path = usePathname() ?? "/";
  const search = useSyncExternalStore(onHistory, browserSearch, serverEmpty);
  const hash = useSyncExternalStore(onHistory, browserHash, serverEmpty);
  // the portal is one back office behind the login, not part of the choice
  if (current === "moderne" && /^\/(no|en)\/portal(\/|$)/.test(path)) return null;
  // Klassisk's language is in its address (/english); Moderne's layout passes its own
  const lang = locale ?? (current === "klassisk" ? kSplit(path).locale : "no");
  const t = LABELS[lang];
  const href = switchHref(current, path, search, hash);
  // the address as it is right now (a form may have changed the query string without a new render)
  const fresh = (a: HTMLAnchorElement) => { a.href = switchHref(current, window.location.pathname, window.location.search, window.location.hash); };
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
