import { can, requireSession, sessionInfo, type Area, type Session } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { minSidePath } from "@/lib/member-paths";
import { notFound, redirect } from "next/navigation";

/**
 * The first line of every portal page: which language, who is asking, and may they see this.
 * Without a session the visitor is sent to the login page and brought back here afterwards.
 * A buyer's own account never enters the portal: it is sent to Min side, in the design it logged in from.
 * Every page checks for itself; the layout around it is not a lock.
 */
export async function portalPage(params: Promise<{ locale: string }>, path: string, area: Area | "admin" | "superadmin" | "any") {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale: "no" | "en" = l === "en" ? "en" : "no";
  const session: Session = await requireSession(locale, `/${locale}/portal${path}`);
  if (session.kind === "member") redirect(await memberHome(locale));
  const ok = area === "any" || can(session, area);
  return { locale, no: locale === "no", session, ok, base: `/${locale}/portal` };
}

/** Min side for the logged-in buyer: the design the session was started from, in the page's language. */
export async function memberHome(locale: "no" | "en") {
  return minSidePath((await sessionInfo())?.design, locale);
}

/** The browser tab title of a portal page, in the visitor's language. */
export function pageTitle(no: string, en: string) {
  return async ({ params }: { params: Promise<{ locale: string }> }) => ({ title: (await params).locale === "en" ? en : no });
}
