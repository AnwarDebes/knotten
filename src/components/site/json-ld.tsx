/**
 * Sitewide structured data: the developer Organization and the WebSite. Plot and
 * article structured data live on their own pages. Rendered server-side; the
 * values are static strings, so JSON.stringify safely encodes them.
 */
export function SiteJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Sigve Simonsen AS",
      description:
        "Grunnentreprenor i Lindesnes som utvikler det energismarte boligomradet Knotten ved Sniksfjorden.",
      url: siteUrl,
      areaServed: "Lindesnes, Agder, Norge",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Knotten",
      url: siteUrl,
      inLanguage: ["no", "en"],
    },
  ];
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
