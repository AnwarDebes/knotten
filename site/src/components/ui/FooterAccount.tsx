"use client";
import Link from "next/link";
import { useSession } from "@/lib/session-client";
import type { Locale } from "@/lib/i18n";
import { loginPagePath, minSidePath, registerPath } from "@/lib/member-paths";
import { label, page } from "@/lib/pages";

/**
 * The account links in the Moderne footer's last column, the same as the header's: Logg inn and Opprett konto when
 * signed out, Min side for a buyer, Portalen for a project account (read from the greeting cookie in the browser).
 */
export default function FooterAccount({ locale, className }: { locale: Locale; className: string }) {
  const session = useSession();
  if (!session) {
    return (
      <>
        <Link href={loginPagePath("moderne", locale)} className={className}>{page("login").name[locale]}</Link>
        <Link href={registerPath("moderne", locale)} className={className}>{page("register").name[locale]}</Link>
      </>
    );
  }
  if (session.kind === "member") return <Link href={minSidePath("moderne", locale)} className={className}>{page("mine").name[locale]}</Link>;
  return <Link href={`/${locale}/portal`} className={className}>{label(page("portal"), locale, true)}</Link>;
}
