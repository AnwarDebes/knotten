"use client";
import Link from "next/link";
import PageHead from "@/components/klassisk/PageHead";

/** English Klassisk: when a page cannot be shown (a service that does not answer), say so and offer a way on. */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <>
      <PageHead title="The page could not be shown" crumb="Error" locale="en">
        <p>Something went wrong while the page was being made. Try again in a moment, or go on to the front page or the plots.</p>
      </PageHead>
      <section className="sec">
        <div className="wrap stack" style={{ maxWidth: "70ch" }}>
          <div className="cta-row" style={{ marginTop: 0 }}>
            <button type="button" className="btn" onClick={() => retry()}>Try again</button>
            <Link className="btn ghost" href="/english">To the front page</Link>
            <Link className="btn ghost" href="/english/tomtene">Plots</Link>
          </div>
          {error.digest && <p className="small">Error code: {error.digest}</p>}
        </div>
      </section>
    </>
  );
}
