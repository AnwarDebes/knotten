import Link from "next/link";

/**
 * `crumb` may hold links (a profile's trail runs through its overview page). The first crumb names the front page:
 * `home` when given, otherwise "Forside", or "Home" when `locale` is English.
 */
export default function PageHead({ title, crumb, children, aside, home, locale = "no" }: { title: string; crumb: React.ReactNode; children?: React.ReactNode; aside?: React.ReactNode; home?: string; locale?: "no" | "en" }) {
  return (
    <section className="phead">
      <div className="wrap">
        <div className="crumb"><Link href="/">{home ?? (locale === "en" ? "Home" : "Forside")}</Link> / {crumb}</div>
        <div className="row">
          <div>
            <h1>{title}</h1>
            {children}
          </div>
          {aside}
        </div>
      </div>
    </section>
  );
}
