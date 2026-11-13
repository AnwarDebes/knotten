import Image from "next/image";
import Link from "next/link";

/*
 * The site's one 404 for unknown addresses, in the look of the default design (Klassisk), written out for this page
 * alone so it never loads either design's stylesheet. Used by src/app/global-not-found.tsx and, for an unknown first
 * part of the address (/finnes-ikke, which the Moderne [locale] route catches), by (moderne)/[locale]/not-found.tsx.
 * Everything is scoped to .nf-body, so it looks the same whichever stylesheet the route has loaded.
 */
export const NOT_FOUND_CSS = `
.nf-body { --nf-paper: #f6f8fa; --nf-paper-2: #edf1f5; --nf-ink: #14263d; --nf-ink-2: #4a5a6e; --nf-ink-3: #5c6979; --nf-fjord-deep: #2f5f85; --nf-line: #d4dce4; }
body.nf-body { margin: 0; min-height: 100vh; display: flex; background: var(--nf-paper); color: var(--nf-ink); font-family: var(--font-sans), "Segoe UI", Helvetica, Arial, sans-serif; font-size: 17px; line-height: 1.55; -webkit-font-smoothing: antialiased; }
.nf-body .nf { margin: auto; width: min(60ch, 100% - 32px); padding-block: 48px; display: flex; flex-direction: column; gap: 18px; box-sizing: border-box; }
.nf-body .nf-logo { display: inline-flex; align-items: center; gap: 12px; align-self: flex-start; margin-bottom: 20px; color: var(--nf-ink); text-decoration: none; }
.nf-body .nf-logo img { border-radius: 50%; box-shadow: 0 0 0 2px #fff, 0 0 0 3px var(--nf-line), 0 4px 12px rgba(20, 38, 61, .18); }
.nf-body .nf-name { display: block; font-family: var(--font-serif), Georgia, serif; font-size: 1.35rem; letter-spacing: .16em; text-transform: uppercase; line-height: 1; }
.nf-body .nf-sub { display: block; margin-top: 5px; font-size: .62rem; letter-spacing: .14em; text-transform: uppercase; color: var(--nf-ink-3); line-height: 1; }
.nf-body .nf-eyebrow { margin: 0; font-family: var(--font-serif), Georgia, serif; font-style: italic; font-size: 1.1rem; color: var(--nf-fjord-deep); }
.nf-body .nf h1 { margin: 0; font-family: var(--font-serif), Georgia, "Times New Roman", serif; font-weight: 300; letter-spacing: -.012em; font-size: clamp(2rem, 4vw, 3rem); line-height: 1.08; text-wrap: balance; }
.nf-body .nf-lede { margin: 0; font-size: 1.2rem; line-height: 1.5; color: var(--nf-ink-2); }
.nf-body .nf-cta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; }
.nf-body .nf-btn { display: inline-flex; align-items: center; padding: 12px 20px; border-radius: 999px; border: 1px solid var(--nf-ink); background: var(--nf-ink); color: #fff; font-weight: 500; text-decoration: none; transition: background .25s; }
.nf-body .nf-btn:hover { background: var(--nf-fjord-deep); border-color: var(--nf-fjord-deep); }
.nf-body .nf-btn.ghost { background: transparent; color: var(--nf-ink); }
.nf-body .nf-btn.ghost:hover { background: var(--nf-paper-2); border-color: var(--nf-ink); }
.nf-body .nf-en { margin: 14px 0 0; font-size: .92rem; color: var(--nf-ink-3); }
.nf-body .nf-en a { color: var(--nf-fjord-deep); text-decoration: underline; text-underline-offset: 3px; }
.nf-body :focus-visible { outline: 2px solid var(--nf-fjord-deep); outline-offset: 3px; }
`;

/** The page itself; the caller puts it in a <body className="nf-body">. */
export default function NotFoundPage() {
  return (
    <>
      <style href="knotten-404" precedence="default">{NOT_FOUND_CSS}</style>
      <main className="nf">
        <Link className="nf-logo" href="/" aria-label="Knotten, til forsiden">
          <Image src="/img/logo-mark.png" alt="" width={56} height={56} priority />
          <span><span className="nf-name">Knotten</span><span className="nf-sub">Sjøutsikt i Rødberg</span></span>
        </Link>
        <p className="nf-eyebrow">Ikke funnet</p>
        <h1>Denne siden finnes ikke</h1>
        <p className="nf-lede">Kanskje du lette etter tomtene, energikonseptet eller dokumentbanken.</p>
        <div className="nf-cta"><Link className="nf-btn" href="/">Til forsiden</Link><Link className="nf-btn ghost" href="/tomtene">Tomtene</Link><Link className="nf-btn ghost" href="/status">Status og spørsmål</Link></div>
        <p className="nf-en" lang="en">This page does not exist. <Link href="/english" hrefLang="en">Knotten in English</Link></p>
      </main>
    </>
  );
}
