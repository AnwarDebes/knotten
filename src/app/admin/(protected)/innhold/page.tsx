import Link from "next/link";
import { getDb } from "@/db";
import { listPlots, listTimeline, listFaq, listNews, listImageSlots } from "@/lib/content/service";

const CARDS = [
  { href: "/admin/innhold/tomter", label: "Tomter", hint: "Storrelse, status, pris, posisjon" },
  { href: "/admin/innhold/fremdrift", label: "Fremdrift", hint: "Stegene i tidslinjen" },
  { href: "/admin/innhold/faq", label: "FAQ", hint: "Sporsmal og svar (NO/EN)" },
  { href: "/admin/innhold/aktuelt", label: "Aktuelt", hint: "Nyheter, utkast og publisert" },
  { href: "/admin/innhold/blokker", label: "Tekstblokker", hint: "Hero og kontaktinfo" },
  { href: "/admin/innhold/dashbord", label: "Dashbord", hint: "Illustrative verdier" },
  { href: "/admin/innhold/bilder", label: "Bilder", hint: "Med alt-tekst og forbehold" },
];

export default async function ContentHub() {
  const db = await getDb();
  const [plots, stages, faq, news, images] = await Promise.all([
    listPlots(db),
    listTimeline(db),
    listFaq(db),
    listNews(db),
    listImageSlots(db),
  ]);
  const counts: Record<string, number> = {
    "/admin/innhold/tomter": plots.length,
    "/admin/innhold/fremdrift": stages.length,
    "/admin/innhold/faq": faq.length,
    "/admin/innhold/aktuelt": news.length,
    "/admin/innhold/bilder": images.length,
  };

  return (
    <div>
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Innhold</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Oppdater nettstedet uten kode. Endringer vises offentlig kort tid etter lagring.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="border-border bg-card hover:border-sea rounded-lg border p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-foreground font-medium">{c.label}</span>
              {counts[c.href] !== undefined ? (
                <span className="text-muted-foreground text-sm">{counts[c.href]}</span>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">{c.hint}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
