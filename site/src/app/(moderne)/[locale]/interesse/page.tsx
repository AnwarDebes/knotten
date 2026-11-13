import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import Nav from "@/components/ui/Nav";
import PageHead from "@/components/ui/PageHead";
import InterestForm from "@/components/ui/InterestForm";
import { loadPlots } from "@/lib/data";
import { pageMeta } from "@/lib/meta";
import { formHead } from "@/lib/content/contact";
import { leadQuery } from "@/lib/leadForm";
import { registerPath } from "@/lib/member-paths";

export const generateMetadata = pageMeta("/interesse", {
  no: { title: "Meld interesse", description: "Tomtene er ikke lagt ut for salg ennå. Meld interesse, så hører du fra oss når det skjer noe med tomtene, eller be om tilgang til prosjektportalen." },
  en: { title: "Register interest", description: "The plots are not for sale yet. Register your interest and hear from us when something happens with the plots, or ask for access to the project portal." },
});

/**
 * "Meld interesse" / "Register interest": the one interest form (lib/leadForm.ts) in the Moderne look. The address
 * can choose who the person is and the plots: ?purpose=access (or invest, buy, ...) and ?plot=plot-07, and the
 * Klassisk names ?rolle= and ?tomt= as well, so a link from either design works here.
 */
export default async function Interest({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale: l } = await params;
  if (!isLocale(l)) notFound();
  const locale = l as Locale;
  const { role, plots: preselect } = leadQuery(await searchParams);
  const head = formHead(role, locale);
  const { plots } = await loadPlots();
  return (
    <>
      <Nav locale={locale} />
      <PageHead title={head.title} lede={head.text} />
      <section className="wrap pb-24">
        <div className="panel p-6 md:p-8 max-w-[760px]">
          <InterestForm locale={locale} plots={plots.map((p) => p.id)} preselect={preselect} role={role} accountHref={registerPath("moderne", locale)} level={2} />
        </div>
      </section>
    </>
  );
}
