import Link from "next/link";
import type { Locale } from "@/lib/i18n";

/**
 * Where sales stand, under the front page's headline: the administrator's status line (the release note in
 * Innstillinger), the way to be told first, and the page that answers the rest.
 */
export default function StatusLine({ locale, text, className = "", onStatusPage = false }: { locale: Locale; text: string; className?: string; onStatusPage?: boolean }) {
  const no = locale === "no";
  if (!text.trim()) return null;
  return (
    <div role="note" aria-label={no ? "Status for salget" : "Sales status"} className={`panel flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 md:px-5 max-w-[760px] ${className}`.trim()}>
      <p className="flex-[1_1_260px] flex items-baseline gap-3 text-[15.5px] leading-snug text-ink">
        <span aria-hidden className="w-2.5 h-2.5 shrink-0 rounded-full bg-fjord shadow-[0_0_0_4px_rgba(47,102,136,.16)] translate-y-[-1px]" />
        {text}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link className="btn btn-sm no-underline" href={`/${locale}/interesse`}>{no ? "Få beskjed" : "Get notified"}</Link>
        {!onStatusPage && <Link className="text-[14px] text-fjord" href={`/${locale}/status`}>{no ? "Status og spørsmål" : "Status and questions"}</Link>}
      </div>
    </div>
  );
}
