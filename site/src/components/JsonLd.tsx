/**
 * Structured data for search engines, in a script tag. "<" is escaped so no text in the data can close the tag.
 */
export default function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
