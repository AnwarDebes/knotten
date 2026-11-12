"use client";
import Link from "next/link";
import { plotNo } from "@/lib/format";
import { registerPath } from "@/lib/member-paths";
import { useFollow } from "./useFollow";

const T = {
  no: { follow: "Følg tomten", following: "Du følger tomten", stop: "Slutt å følge", failed: "Det gikk ikke. Prøv igjen.", plot: "tomt" },
  en: { follow: "Follow the plot", following: "You follow the plot", stop: "Unfollow", failed: "That did not work. Try again.", plot: "plot" },
};

/**
 * "Følg tomten" for a Moderne plot page (/{no,en}/tomter/plot-NN): a visitor gets a link to sign-up with the plot
 * chosen; a logged-in buyer follows or stops following (it then shows on Min side, and on the lead).
 * Usage: <FollowPlotButton plotId={plot.id} locale={locale} />
 */
export default function FollowPlotButton({ plotId, locale }: { plotId: string; locale: "no" | "en" }) {
  const t = T[locale];
  const { who, following, pending, error, toggle } = useFollow(plotId);
  if (who === "other") return null;
  if (who === "visitor") return <Link className="btn btn-ghost no-underline" href={`${registerPath("moderne", locale)}?plot=${plotId}`}>{t.follow}</Link>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" className={`btn ${following ? "" : "btn-ghost"}`} onClick={toggle} disabled={pending || following === null} aria-pressed={!!following} aria-busy={pending}>
        {following ? t.following : t.follow}<span className="sr-only"> ({t.plot} {plotNo(plotId)})</span>
      </button>
      {following && <button type="button" className="text-[13.5px] text-ink-2 underline underline-offset-4" onClick={toggle} disabled={pending}>{t.stop}</button>}
      <span role="status" className="text-[13px] text-[#8a2f1d]">{error ? t.failed : ""}</span>
    </span>
  );
}
