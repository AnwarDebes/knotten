import Script from "next/script";

/**
 * Loads Plausible (cookieless, EU) only when a domain is configured, so
 * development and previews stay clean. The script is deferred and kept off the
 * critical path; it sets no cookies, so no consent prompt is required (see
 * docs/privacy/personvern-og-analyse.md). The tagged-events build lets links be
 * tracked with a class, and custom goals fire through window.plausible.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  const src =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.tagged-events.js";

  return (
    <>
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}
      </Script>
      <Script defer data-domain={domain} src={src} strategy="afterInteractive" />
    </>
  );
}
