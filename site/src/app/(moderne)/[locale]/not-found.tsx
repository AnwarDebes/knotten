"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import NotFoundPage from "@/components/NotFoundPage";

/**
 * The 404 for /no and /en, in the visitor's language: a missing page, plot or unknown address. An unknown first part
 * of the address (/finnes-ikke) also lands in this route; it gets the site's one 404 for unknown addresses, the same
 * page as src/app/global-not-found.tsx (the layout gives it a bare document for that).
 */
export default function NotFound() {
  const param = useParams<{ locale?: string }>()?.locale;
  if (param !== "no" && param !== "en") return <NotFoundPage />;
  const locale = param;
  const no = locale === "no";
  return (
    <>
      <Nav locale={locale} />
      <PageHead
        title={no ? "Denne siden finnes ikke" : "This page does not exist"}
        lede={no ? "Kanskje du lette etter tomtene, energikonseptet eller dokumentene." : "Perhaps you were looking for the plots, the energy concept or the documents."}
      />
      <section className="wrap pb-24 flex flex-wrap gap-3">
        <Link className="btn btn-amber" href={`/${locale}`}>{no ? "Til forsiden" : "To the front page"}</Link>
        <Link className="btn btn-ghost" href={`/${locale}/tomter`}>{no ? "Tomtene" : "The plots"}</Link>
        <Link className="btn btn-ghost" href={`/${locale}/status`}>{no ? "Status og spørsmål" : "Status and questions"}</Link>
      </section>
    </>
  );
}
