"use client";
import { useState } from "react";
import { Mark } from "./Mark";

/**
 * The Knotten logo. Uses the real logo file when it is in place (site/public/img/logo.webp, the round vignette with
 * the wordmark: the same pixels as public/assets/incoming/logo.png, transparency included, in a lossless WebP a third
 * smaller), and until then sets the same wordmark in type: KNOTTEN in wide capitals, Sjøutsikt i Rødberg beneath.
 */
export default function Logo({ height = 44, wordmark = true, className = "" }: { height?: number; wordmark?: boolean; className?: string }) {
  const [ok, setOk] = useState(true);
  if (ok) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- the logo file as it is (same pixels, transparency kept), with a fallback when it is missing
      <img
        src="/img/logo.webp"
        width={337}
        height={307}
        alt="Knotten, Sjøutsikt i Rødberg"
        style={{ height, width: "auto" }}
        className={className}
        onError={() => setOk(false)}
        ref={(el) => { if (el && el.complete && el.naturalWidth === 0) setOk(false); }}
      />
    );
  }
  return (
    <span className={`inline-flex items-center gap-2.5 text-ink ${className}`} style={{ height }}>
      <Mark size={Math.round(height * 0.62)} />
      {wordmark && (
        <span className="grid leading-none">
          <span style={{ fontFamily: "var(--font-cinzel), serif", fontWeight: 600, letterSpacing: ".16em", fontSize: Math.round(height * 0.4), lineHeight: 1 }}>KNOTTEN</span>
          <span style={{ fontSize: Math.max(8, Math.round(height * 0.17)), letterSpacing: ".2em", lineHeight: 1, marginTop: Math.round(height * 0.09), color: "var(--fjord)", fontWeight: 500 }}>SJØUTSIKT I RØDBERG</span>
        </span>
      )}
    </span>
  );
}
