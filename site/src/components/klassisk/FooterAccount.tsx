"use client";
import Link from "next/link";
import { useSession } from "@/lib/session-client";
import { loginPagePath, minSidePath, registerPath } from "@/lib/member-paths";
import { label, page } from "@/lib/pages";

/**
 * The account links in the Klassisk footer's last column, the same as the header's: Logg inn and Opprett konto when
 * signed out, Min side for a buyer, Portalen for a project account. The page itself stays static; the browser reads
 * the greeting cookie (lib/session-client.ts).
 */
export default function FooterAccount({ locale }: { locale: "no" | "en" }) {
  const session = useSession();
  if (!session) {
    return (
      <>
        <Link href={loginPagePath("klassisk", locale)}>{page("login").name[locale]}</Link>
        <Link href={registerPath("klassisk", locale)}>{page("register").name[locale]}</Link>
      </>
    );
  }
  if (session.kind === "member") return <Link href={minSidePath("klassisk", locale)}>{page("mine").name[locale]}</Link>;
  return <Link href={`/${locale}/portal`}>{label(page("portal"), locale, true)}</Link>;
}
