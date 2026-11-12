import Link from "next/link";
import type { Lang } from "@/lib/facts";

/**
 * Where sales stand, right under the front page's headline: the administrator's status line (the release note in
 * Innstillinger), a way to be told first, and the page that answers the rest. Both languages, so an English
 * Klassisk can use it as it is.
 */
export default function StatusLine({ locale, text, className = "", onStatusPage = false }: { locale: Lang; text: string; className?: string; onStatusPage?: boolean }) {
  const no = locale === "no";
  if (!text.trim()) return null;
  return (
    <div className={`statusline ${className}`.trim()} role="note" aria-label={no ? "Status for salget" : "Sales status"}>
      <p>{text}</p>
      <div className="acts">
        <Link className="btn sm" href="/kontakt">{no ? "Få beskjed" : "Get notified"}</Link>
        {!onStatusPage && <Link href="/status">{no ? "Status og spørsmål" : "Status and questions"}</Link>}
      </div>
    </div>
  );
}
