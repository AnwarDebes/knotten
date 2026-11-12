"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Counts page views for the owner's statistics (src/app/api/collect). No cookies, nothing stored
 * in the browser, nothing about the person: the page, where the visit came from, and which design.
 * Phone or computer is read on the server from the browser's name; the window size is never sent.
 * Browsers that ask not to be tracked (Do Not Track, Global Privacy Control) send nothing.
 */
const SKIP = /^\/((no|en)\/(portal|login|min-side|registrer)|logg-inn|min-side|registrer)(\/|$)/;

function send(body: object) {
  try {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    // JSON from this page only: the endpoint refuses anything else (keepalive lets it finish if the page is left)
    fetch("/api/collect", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" }, keepalive: true, credentials: "same-origin" }).catch(() => undefined);
  } catch { /* statistics never get in the way */ }
}

/** A named event without personal data, e.g. that someone started filling in the interest form. */
export function track(event: "form_start") {
  send({ e: event });
}

export default function Track({ design }: { design: "klassisk" | "moderne" }) {
  const path = usePathname();
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (!path || prev.current === path) return;
    // the first view of a page load carries the real referrer; later in-site navigation comes from the previous page
    const ref = prev.current === null ? document.referrer : `${location.origin}${prev.current}`;
    prev.current = path;
    if (!SKIP.test(path)) send({ p: path, r: ref, d: design });
  }, [path, design]);
  return null;
}
