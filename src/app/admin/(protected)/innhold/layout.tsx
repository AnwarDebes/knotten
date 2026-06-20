import Link from "next/link";
import { requireRole } from "@/lib/admin/session-cookie";

const SECTIONS = [
  { href: "/admin/innhold/tomter", label: "Tomter" },
  { href: "/admin/innhold/fremdrift", label: "Fremdrift" },
  { href: "/admin/innhold/faq", label: "FAQ" },
  { href: "/admin/innhold/aktuelt", label: "Aktuelt" },
  { href: "/admin/innhold/blokker", label: "Tekstblokker" },
  { href: "/admin/innhold/dashbord", label: "Dashbord" },
  { href: "/admin/innhold/bilder", label: "Bilder" },
];

/** Content editing is the owner's job: gate the whole section to that role. */
export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  await requireRole("owner");
  return (
    <div className="space-y-6">
      <nav className="border-border flex flex-wrap gap-x-5 gap-y-2 border-b pb-3 text-sm">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="text-muted-foreground hover:text-sea">
            {s.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
