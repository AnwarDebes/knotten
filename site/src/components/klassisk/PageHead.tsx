import Link from "next/link";

/** `home`: the first crumb's label, "Forside" unless the page is in another language. */
export default function PageHead({ title, crumb, children, aside, home = "Forside" }: { title: string; crumb: string; children?: React.ReactNode; aside?: React.ReactNode; home?: string }) {
  return (
    <section className="phead">
      <div className="wrap">
        <div className="crumb"><Link href="/">{home}</Link> / {crumb}</div>
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
